import type { XeraAnimateRequest, XeraAnimateResponse, ScriptGenerationOutput } from "@/types/lumina"

type ManimSpec = ScriptGenerationOutput["manim_spec"]

/**
 * XeraAnimateClient
 * 
 * Handles Manim animation synthesis via Xera Animate agent in Daytona sandboxes
 */
export class XeraAnimateClient {
  private endpoint: string
  private timeout: number

  constructor(endpoint: string, timeout: number = 60000) {
    this.endpoint = endpoint
    this.timeout = timeout
  }

  /**
   * Submit Manim spec to Xera Animate for rendering
   * Returns job ID for polling
   */
  async submitManimSpec(spec: ManimSpec): Promise<string> {
    const request: XeraAnimateRequest = {
      manim_spec: spec,
      quality: "medium_quality",
      output_format: "mp4",
    }

    try {
      const response = await fetch(`${this.endpoint}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`Xera Animate submission failed: ${response.statusText}`)
      }

      const data = await response.json()
      return data.job_id
    } catch (error) {
      console.error("[XeraAnimateClient] Submit error:", error)
      throw error
    }
  }

  /**
   * Poll job status until completion or timeout
   */
  async pollJob(jobId: string): Promise<XeraAnimateResponse> {
    const startTime = Date.now()
    const pollInterval = 2000 // 2 seconds

    while (Date.now() - startTime < this.timeout) {
      try {
        const response = await fetch(`${this.endpoint}/status/${jobId}`)

        if (!response.ok) {
          throw new Error(`Poll failed: ${response.statusText}`)
        }

        const data: XeraAnimateResponse = await response.json()

        if (data.status === "completed") {
          return data
        }

        if (data.status === "failed") {
          throw new Error(data.error || "Manim rendering failed")
        }

        // Still processing, wait before next poll
        await new Promise((resolve) => setTimeout(resolve, pollInterval))
      } catch (error) {
        console.error("[XeraAnimateClient] Poll error:", error)
        throw error
      }
    }

    throw new Error(`Manim rendering timed out after ${this.timeout}ms`)
  }

  /**
   * Submit and wait for completion in one call
   */
  async renderManimSpec(spec: ManimSpec): Promise<XeraAnimateResponse> {
    const jobId = await this.submitManimSpec(spec)
    return await this.pollJob(jobId)
  }

  /**
   * Cleanup sandbox resources after job completion
   */
  async cleanup(jobId: string): Promise<void> {
    try {
      await fetch(`${this.endpoint}/cleanup/${jobId}`, {
        method: "DELETE",
      })
    } catch (error) {
      console.error("[XeraAnimateClient] Cleanup warning:", error)
      // Non-critical, don't throw
    }
  }

  /**
   * Generate fallback visual plan when Xera is unavailable
   */
  generateFallbackPlan(spec: ManimSpec) {
    return {
      scene: spec.concept,
      spec: {
        concept: spec.concept,
        parameters: spec.parameters,
      },
    }
  }
}

// Singleton instance
let xeraClient: XeraAnimateClient | null = null

export function getXeraAnimateClient(): XeraAnimateClient {
  if (!xeraClient) {
    const endpoint = process.env.XERA_AGENT_ENDPOINT
    if (!endpoint) {
      console.warn("[XeraAnimateClient] XERA_AGENT_ENDPOINT not configured, using fallback mode")
      // Return client with dummy endpoint - will use fallback plans
      xeraClient = new XeraAnimateClient("http://localhost:0")
    } else {
      xeraClient = new XeraAnimateClient(endpoint)
    }
  }
  
  return xeraClient
}
