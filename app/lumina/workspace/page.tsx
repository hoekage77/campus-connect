"use client"

import { Icon } from "@iconify/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect, useRef } from "react"
import { useLuminaQuery, type ActivityLog } from "@/hooks/use-lumina"
import { ArrowLeft, Maximize2, Minimize2 } from "lucide-react"

export default function LuminaWorkspacePage() {
  const [queryInput, setQueryInput] = useState("")
  const [isCanvasExpanded, setIsCanvasExpanded] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: "user" | "assistant"; content: string; query?: string }>>([])
  const activityLogRef = useRef<HTMLDivElement>(null)
  
  const { 
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
  } = useLuminaQuery({
    query: queryInput,
  })

  const handleAsk = () => {
    if (queryInput.trim() && !isStreaming) {
      start()
    }
  }

  const handleCancel = () => {
    cancel()
  }

  // Auto-scroll activity log to bottom when new events arrive
  useEffect(() => {
    if (activityLogRef.current) {
      activityLogRef.current.scrollTop = activityLogRef.current.scrollHeight
    }
  }, [activityLog])

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Absolute background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 h-80 w-80 rounded-full bg-gradient-to-br from-purple-600/20 to-orange-500/0 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 h-80 w-80 rounded-full bg-gradient-to-br from-orange-500/20 to-pink-500/0 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <header className="border-b border-border/60 bg-background/80 backdrop-blur-md px-4 py-3 relative">
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-50" />
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/lumina">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-purple-500/10 hover:text-purple-500 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="h-6 w-px bg-border/60" />
              <div className="flex items-center gap-2">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-orange-400/20 ring-1 ring-purple-500/20">
                  <Icon icon="solar:brain-bold-duotone" className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold bg-gradient-to-r from-purple-500 to-orange-400 bg-clip-text text-transparent">Lumina Workspace</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">AI-powered STEM tutor</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  isStreaming
                    ? "gap-1.5 border-purple-500/40 bg-purple-500/10 text-purple-500 px-3 py-1"
                    : "gap-1.5 px-3 py-1"
                }
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isStreaming ? "bg-purple-500 animate-pulse" : "bg-muted-foreground"}`} />
                {isStreaming ? "Thinking..." : "Ready"}
              </Badge>
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  <Icon icon="solar:home-2-bold-duotone" className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 overflow-hidden">
          <div className="max-w-7xl mx-auto h-full px-4 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-4 h-full">
              {/* Left sidebar: Consolidated controls */}
              <Card className="border-border/60 bg-card/80 backdrop-blur overflow-hidden flex flex-col">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Icon icon="solar:brain-bold-duotone" className="h-4 w-4 text-purple-500" />
                    Lumina Assistant
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Query input */}
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Ask a STEM question..."
                      value={queryInput}
                      onChange={(e) => setQueryInput(e.target.value)}
                      className="min-h-[80px] resize-none text-sm"
                      disabled={isStreaming}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                          handleAsk()
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      {isStreaming && (
                        <Button size="sm" variant="outline" onClick={handleCancel} className="flex-1">
                          <Icon icon="solar:stop-bold" className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      )}
                      {error && runId && stages.length > 0 && (
                        <Button size="sm" variant="outline" onClick={resume} className="flex-1">
                          <Icon icon="solar:restart-bold-duotone" className="h-3 w-3 mr-1" />
                          Resume
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={handleAsk}
                        disabled={isStreaming || !queryInput.trim()}
                        className="flex-1"
                      >
                        <Icon icon="solar:magic-stick-3-bold-duotone" className="h-3 w-3 mr-1" />
                        Ask
                      </Button>
                    </div>
                  </div>

                  {/* Pipeline Status */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">Pipeline Status</p>
                      {isStreaming && (
                        <Badge variant="outline" className="text-[10px] gap-1 border-purple-500/40 bg-purple-500/10 text-purple-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { label: "Query", key: "query_processing" },
                        { label: "Planning", key: "lesson_planning" },
                        { label: "Script", key: "script_generation" },
                        { label: "Animation", key: "animation_synthesis" },
                        { label: "Optimize", key: "optimization" },
                      ].map((stage, index) => {
                        const isCompleted = stages.includes(stage.key)
                        const isActive = activeStage === stage.key
                        const isSkipped = skippedStages.includes(stage.key)
                        return (
                          <div
                            key={stage.key}
                            className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-all ${
                              isActive
                                ? "border-purple-500/60 bg-purple-500/10"
                                : isCompleted
                                ? "border-green-500/60 bg-green-500/10"
                                : isSkipped
                                ? "border-gray-500/60 bg-gray-500/10"
                                : "border-border/60 bg-background/40"
                            }`}
                          >
                            {isCompleted && !isActive ? (
                              <Icon icon="solar:check-circle-bold" className="h-3 w-3 text-green-500 flex-shrink-0" />
                            ) : isSkipped ? (
                              <Icon icon="solar:skip-next-bold" className="h-3 w-3 text-gray-500 flex-shrink-0" />
                            ) : (
                              <span
                                className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                                  isActive ? "bg-purple-500 animate-pulse" : "bg-muted-foreground/40"
                                }`}
                              />
                            )}
                            <span className="text-[11px]">{stage.label}</span>
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* Retry status */}
                    {retryStatus && (
                      <div className="flex items-center gap-2 rounded-md bg-orange-500/10 border border-orange-500/20 px-2.5 py-1.5">
                        <Icon icon="solar:refresh-bold-duotone" className="h-3 w-3 text-orange-500 animate-spin flex-shrink-0" />
                        <div className="text-[10px] min-w-0">
                          <p className="font-medium text-orange-500 truncate">
                            Retry #{retryStatus.attempt}
                          </p>
                          <p className="text-muted-foreground">
                            {Math.round(retryStatus.delay / 1000)}s wait
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Conversation */}
                  {(answer || error) && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Response</p>
                      
                      {error && (
                        <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5">
                          <Icon icon="solar:danger-circle-bold-duotone" className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-red-500 leading-relaxed">{error}</p>
                        </div>
                      )}

                      {answer && (
                        <div className="rounded-lg bg-muted/40 border border-border/60 p-3 text-xs leading-relaxed max-h-[300px] overflow-y-auto">
                          {answer}
                          {isStreaming && (
                            <span className="inline-block w-1.5 h-3 ml-1 bg-purple-500 animate-pulse" />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right panel: Visual Canvas */}
              <Card
                className={`border-border/60 bg-card/80 backdrop-blur overflow-hidden flex flex-col transition-all ${
                  isCanvasExpanded ? "lg:col-span-2" : ""
                }`}
              >
                <CardHeader className="pb-3 border-b border-border/60">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Icon icon="solar:clapperboard-text-bold-duotone" className="h-4 w-4 text-purple-500" />
                      Visual Canvas
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCanvasExpanded(!isCanvasExpanded)}
                      className="h-7 w-7 p-0"
                    >
                      {isCanvasExpanded ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  {videoUrl ? (
                    <div className="w-full h-full rounded-2xl border border-border/60 bg-black overflow-hidden flex flex-col m-6">
                      <video 
                        controls 
                        className="flex-1 w-full h-full object-contain"
                        src={videoUrl}
                      >
                        Your browser does not support video playback.
                      </video>
                      <div className="bg-background/95 border-t border-border/60 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon icon="solar:play-circle-bold-duotone" className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="text-xs font-medium">Animation Ready</p>
                            <p className="text-[10px] text-muted-foreground">Generated with Manim</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <a href={videoUrl} download>
                            <Icon icon="solar:download-bold-duotone" className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : activityLog.length > 0 ? (
                    <div ref={activityLogRef} className="w-full h-full overflow-y-auto p-6 space-y-3 scroll-smooth">
                      {activityLog.map((log) => (
                        <div
                          key={log.id}
                          className={`rounded-xl border p-4 transition-all animate-in slide-in-from-top-2 ${
                            log.type === "thinking"
                              ? "border-purple-500/30 bg-purple-500/5"
                              : log.type === "output"
                              ? "border-green-500/30 bg-green-500/5"
                              : log.type === "retry"
                              ? "border-orange-500/30 bg-orange-500/5"
                              : "border-red-500/30 bg-red-500/5"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                log.type === "thinking"
                                  ? "bg-purple-500/20"
                                  : log.type === "output"
                                  ? "bg-green-500/20"
                                  : log.type === "retry"
                                  ? "bg-orange-500/20"
                                  : "bg-red-500/20"
                              }`}
                            >
                              {log.type === "thinking" ? (
                                <Icon
                                  icon="solar:chat-round-line-bold-duotone"
                                  className="h-4 w-4 text-purple-500 animate-pulse"
                                />
                              ) : log.type === "output" ? (
                                <Icon
                                  icon="solar:check-circle-bold"
                                  className="h-4 w-4 text-green-500"
                                />
                              ) : log.type === "retry" ? (
                                <Icon
                                  icon="solar:refresh-bold-duotone"
                                  className="h-4 w-4 text-orange-500 animate-spin"
                                />
                              ) : (
                                <Icon
                                  icon="solar:danger-circle-bold"
                                  className="h-4 w-4 text-red-500"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="text-sm font-medium">{log.title}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {log.timestamp.toLocaleTimeString()}
                                </p>
                              </div>
                              {log.content && (
                                <p className="text-xs text-muted-foreground">{log.content}</p>
                              )}
                              {log.data && (
                                <div className="mt-2 rounded-lg bg-background/60 border border-border/40 p-3 text-xs">
                                  {log.stage === "query_processing" && log.data.concepts && (
                                    <div className="space-y-1">
                                      <p className="font-medium text-purple-500">Concepts:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {log.data.concepts.map((concept: string) => (
                                          <Badge key={concept} variant="outline" className="text-[10px]">
                                            {concept}
                                          </Badge>
                                        ))}
                                      </div>
                                      <p className="text-muted-foreground mt-2">
                                        Audience: {log.data.audience}
                                      </p>
                                    </div>
                                  )}
                                  {log.stage === "lesson_planning" && log.data.narrative && (
                                    <div className="space-y-1">
                                      <p className="font-medium text-purple-500">Lesson Plan:</p>
                                      <p className="text-muted-foreground">
                                        {log.data.narrative.steps?.length || 0} steps planned
                                      </p>
                                    </div>
                                  )}
                                  {log.stage === "script_generation" && log.data.manim_specs && (
                                    <div className="space-y-1">
                                      <p className="font-medium text-purple-500">Animation Spec:</p>
                                      <p className="text-muted-foreground">
                                        Scene: {log.data.manim_specs.scene}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {isStreaming && (
                        <div className="flex items-center justify-center py-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                            <span>Processing...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : visualPlan ? (
                    <div className="w-full h-full rounded-2xl border border-border/60 bg-gradient-to-br from-purple-500/5 via-background to-orange-400/5 p-6 flex flex-col items-center justify-center space-y-4">
                      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-orange-400/20">
                        <Icon icon="solar:video-frame-play-horizontal-bold-duotone" className="h-8 w-8 text-purple-500" />
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-lg font-semibold">{visualPlan.scene?.replace(/_/g, " ") || "Visual Plan"}</p>
                        <p className="text-sm text-muted-foreground">Scene ready for rendering</p>
                      </div>
                      {visualPlan.spec?.parameters && (
                        <div className="rounded-xl bg-background/80 border border-border/60 px-4 py-3 text-xs">
                          <p className="font-medium mb-2">Parameters:</p>
                          <div className="space-y-1 text-muted-foreground">
                            {Object.entries(visualPlan.spec.parameters).map(([key, value]) => (
                              <div key={key} className="flex items-center gap-2">
                                <span className="font-mono">{key}:</span>
                                <span className="font-mono text-purple-500">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <Badge variant="outline" className="text-xs">
                        <Icon icon="solar:layers-minimalistic-bold-duotone" className="h-3 w-3 mr-1" />
                        Concept: {visualPlan.spec?.concept || "N/A"}
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-4">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/40">
                          <Icon icon="solar:gallery-minimalistic-bold-duotone" className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Agent Activity</p>
                          <p className="text-xs text-muted-foreground/70 max-w-xs">
                            Ask Lumina a question to see real-time agent reasoning and tool execution
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
