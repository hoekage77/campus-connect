"use client"

import { useCallback, useRef, useState } from "react"

export type LuminaEvent =
  | { type: "stage"; stage: string; status?: string }
  | { type: "token"; content: string }
  | { type: "visual-plan"; scene: string; spec: any }
  | { type: "done"; video_url?: string }
  | { type: "error"; message: string }
  | { type: "retry"; stage: string; attempt: number; delay: number }
  | { type: "stage_output"; stage: string; output: any }

export interface ActivityLog {
  id: string
  timestamp: Date
  stage: string
  type: "thinking" | "output" | "retry" | "error"
  title: string
  content?: string
  data?: any
}

interface UseLuminaQueryOptions {
  query: string
  mode?: "explain" | "what-if" | "check"
  context?: { courseId?: string; unitId?: string }
  runId?: string // For resuming failed runs
}

interface UseLuminaQueryResult {
  answer: string
  stages: string[]
  activeStage: string | null
  skippedStages: string[]
  retryStatus: { stage: string; attempt: number; delay: number } | null
  activityLog: ActivityLog[]
  visualPlan: any | null
  videoUrl: string | null
  isStreaming: boolean
  error?: string
  runId: string | null
  start: () => void
  resume: () => void
  cancel: () => void
}

export function useLuminaQuery(options: UseLuminaQueryOptions): UseLuminaQueryResult {
  const { query, mode, context, runId: initialRunId } = options

  const [answer, setAnswer] = useState("")
  const [stages, setStages] = useState<string[]>([])
  const [activeStage, setActiveStage] = useState<string | null>(null)
  const [skippedStages, setSkippedStages] = useState<string[]>([])
  const [retryStatus, setRetryStatus] = useState<{ stage: string; attempt: number; delay: number } | null>(null)
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([])
  const [visualPlan, setVisualPlan] = useState<any | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [runId, setRunId] = useState<string | null>(initialRunId || null)
  const abortRef = useRef<AbortController | null>(null)

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setIsStreaming(false)
    setActiveStage(null)
    setRetryStatus(null)
  }, [])

  const executeQuery = useCallback((resumeMode = false) => {
    if ((!query && !resumeMode) || isStreaming) return

    if (!resumeMode) {
      setAnswer("")
      setStages([])
      setActiveStage(null)
      setSkippedStages([])
      setActivityLog([])
      setVisualPlan(null)
      setVideoUrl(null)
      setRunId(null)
    }
    setError(undefined)
    setRetryStatus(null)

    const controller = new AbortController()
    abortRef.current = controller
    setIsStreaming(true)

    const endpoint = resumeMode && runId 
      ? `/api/lumina/query?resume=${runId}` 
      : "/api/lumina/query"

    fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, mode, context }),
    })
      .then(async (res) => {
        if (!res.ok || !res.body) {
          throw new Error("Failed to connect to Lumina agent")
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder("utf-8")

        let buffered = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffered += decoder.decode(value, { stream: true })

          const lines = buffered.split(/\n\n/)
          buffered = lines.pop() || ""

          for (const block of lines) {
            const line = block.trim()
            if (!line.startsWith("data:")) continue

            const json = line.slice("data:".length).trim()
            if (!json) continue

            let event: LuminaEvent | null = null
            try {
              event = JSON.parse(json)
            } catch {
              continue
            }

            if (!event) continue

            if (event.type === "stage") {
              if (event.status === "skipped") {
                setSkippedStages((prev) => [...prev, event.stage])
              } else {
                setActiveStage(event.stage)
                setStages((prev) => (prev.includes(event!.stage) ? prev : [...prev, event!.stage]))
                setActivityLog((prev) => [
                  ...prev,
                  {
                    id: `${Date.now()}-${Math.random()}`,
                    timestamp: new Date(),
                    stage: event.stage,
                    type: "thinking",
                    title: `Processing ${event.stage.replace(/_/g, " ")}...`,
                  },
                ])
              }
            } else if (event.type === "stage_output") {
              setActivityLog((prev) => [
                ...prev,
                {
                  id: `${Date.now()}-${Math.random()}`,
                  timestamp: new Date(),
                  stage: event.stage,
                  type: "output",
                  title: `Completed ${event.stage.replace(/_/g, " ")}`,
                  data: event.output,
                },
              ])
            } else if (event.type === "token") {
              setAnswer((prev) => (prev ? prev + " " + event!.content : event!.content))
            } else if (event.type === "visual-plan") {
              setVisualPlan(event)
            } else if (event.type === "retry") {
              setRetryStatus({
                stage: event.stage,
                attempt: event.attempt,
                delay: event.delay,
              })
              setActivityLog((prev) => [
                ...prev,
                {
                  id: `${Date.now()}-${Math.random()}`,
                  timestamp: new Date(),
                  stage: event.stage,
                  type: "retry",
                  title: `Retrying ${event.stage.replace(/_/g, " ")}`,
                  content: `Attempt ${event.attempt}, waiting ${Math.round(event.delay / 1000)}s`,
                },
              ])
            } else if (event.type === "error") {
              setError(event.message)
              setIsStreaming(false)
              setActiveStage(null)
              setRetryStatus(null)
              setActivityLog((prev) => [
                ...prev,
                {
                  id: `${Date.now()}-${Math.random()}`,
                  timestamp: new Date(),
                  stage: activeStage || "unknown",
                  type: "error",
                  title: "Error occurred",
                  content: event.message,
                },
              ])
            } else if (event.type === "done") {
              if (event.video_url) {
                setVideoUrl(event.video_url)
              }
              setIsStreaming(false)
              setActiveStage(null)
              setRetryStatus(null)
            }
          }
        }

        setIsStreaming(false)
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err.message || "Unexpected error")
        setIsStreaming(false)
        setActiveStage(null)
        setRetryStatus(null)
      })
  }, [query, mode, context, isStreaming, runId])

  const start = useCallback(() => {
    executeQuery(false)
  }, [executeQuery])

  const resume = useCallback(() => {
    if (!runId) {
      console.error("[useLuminaQuery] Cannot resume: no runId")
      return
    }
    executeQuery(true)
  }, [executeQuery, runId])

  return { 
    answer, 
    stages, 
    activeStage,
    skippedStages,
    retryStatus,
    activityLog,
    visualPlan, 
    videoUrl, 
    isStreaming, 
    error, 
    runId,
    start, 
    resume,
    cancel 
  }
}
