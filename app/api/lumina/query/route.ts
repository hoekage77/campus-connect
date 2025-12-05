import { NextRequest } from "next/server"
import { getAIosKernelClient } from "@/lib/aios-kernel-client"

// Lumina query API route (AIOS-backed)
// Proxies requests to AIOS kernel and streams events via SSE

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()

  const sendEvent = (data: unknown) => {
    const json = JSON.stringify(data)
    const payload = `data: ${json}\n\n`
    return writer.write(encoder.encode(payload))
  }

  ;(async () => {
    try {
      const body = await req.json().catch(() => ({}))
      const query = typeof body?.query === "string" ? body.query : ""
      const mode = body?.mode || "explain"
      const resumeRunId = body?.resumeRunId

      // Get resume parameter from query string
      const url = new URL(req.url)
      const resumeParam = url.searchParams.get("resume")
      const actualResumeRunId = resumeRunId || resumeParam

      // Basic guard
      if (!query && !actualResumeRunId) {
        await sendEvent({ type: "error", message: "Missing query" })
        await sendEvent({ type: "done" })
        await writer.close()
        return
      }

      // Get AIOS kernel client
      const aiosClient = getAIosKernelClient()

      // Check if AIOS kernel is available
      const kernelHealthy = await aiosClient.healthCheck()
      if (!kernelHealthy) {
        throw new Error(
          "AIOS kernel is not available. Make sure it's running on port 8000"
        )
      }

      // Execute query via AIOS kernel
      const userId = "user_demo" // TODO: Get from auth

      for await (const event of aiosClient.executeLuminaQuery(
        userId,
        query,
        mode,
        actualResumeRunId
      )) {
        await sendEvent(event)
      }

      await writer.close()
    } catch (error) {
      console.error("[Lumina API Error]", error)
      await sendEvent({
        type: "error",
        message: error instanceof Error ? error.message : "Unexpected server error",
      })
      await sendEvent({ type: "done" })
      await writer.close()
    }
  })()

  return new Response(readable, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
