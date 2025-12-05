"use client"

import { Icon } from "@iconify/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useLuminaQuery } from "@/hooks/use-lumina"

export default function LuminaPage() {
  const [showDemo, setShowDemo] = useState(false)
  const [queryInput, setQueryInput] = useState("")
  const { answer, stages, visualPlan, isStreaming, error, start } = useLuminaQuery({
    query: queryInput,
  })

  const handleAsk = () => {
    if (queryInput.trim()) {
      start()
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Absolute background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 h-80 w-80 rounded-full bg-gradient-to-br from-purple-600/30 to-orange-500/0 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 h-80 w-80 rounded-full bg-gradient-to-br from-orange-500/30 to-pink-500/0 blur-3xl" />
        <div className="absolute top-20 left-1/2 h-px w-[640px] -translate-x-1/2 bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
        {/* Hero */}
        <section className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-orange-400/20">
                <Icon icon="solar:brain-bold-duotone" className="h-3.5 w-3.5 text-purple-500" />
              </span>
              Lumina · AI Tutor
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                Turn 
                <span className="whitespace-nowrap">“I don&apos;t get it”</span>
                <span className="ml-2">into clear insight.</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-xl">
                Lumina is an AI tutor that breaks the fourth wall of education—turning your STEM questions into visual, conversational explanations that stick.
              </p>
            </div>

            <div className="space-y-6">
              <div className="relative max-w-lg group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl opacity-30 group-hover:opacity-50 blur transition duration-200"></div>
                <div className="relative flex items-center bg-background rounded-xl p-1">
                  <div className="pl-3 text-muted-foreground">
                    <Icon icon="solar:magic-stick-3-bold-duotone" className="h-5 w-5" />
                  </div>
                  <Input 
                    placeholder="Ask anything (e.g. 'Explain projectile motion')..." 
                    className="border-0 shadow-none focus-visible:ring-0 bg-transparent h-12 text-base"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        // Navigate to workspace with query
                        window.location.href = `/lumina/workspace?q=${encodeURIComponent(queryInput)}`
                      }
                    }}
                  />
                  <Button 
                    size="sm" 
                    className="h-9 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md" 
                    onClick={() => {
                      if (queryInput.trim()) {
                         window.location.href = `/lumina/workspace?q=${encodeURIComponent(queryInput)}`
                      }
                    }}
                  >
                    Generate
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>Try:</span>
                {['Projectile Motion', 'Calculus Derivatives', 'Photosynthesis'].map(topic => (
                  <Badge 
                    key={topic} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-purple-500/10 hover:text-purple-600 transition-colors px-3 py-1" 
                    onClick={() => setQueryInput(`Explain ${topic}`)}
                  >
                    {topic}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-4 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowDemo(true)}
                >
                  <Icon icon="solar:play-circle-bold-duotone" className="h-5 w-5" />
                  Watch demo
                </Button>
                <Link href="/lumina/workspace">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <Icon icon="solar:arrow-right-bold-duotone" className="h-4 w-4" />
                    Go to Workspace
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 text-xs">
              <HighlightCard
                icon="solar:bolt-bold-duotone"
                label="From question to visual"
                value="≈ 2.8s"
              />
              <HighlightCard
                icon="solar:infinity-bold-duotone"
                label="Learning paths"
                value="Adaptive and unbounded"
              />
              <HighlightCard
                icon="solar:target-bold-duotone"
                label="Feedback"
                value="Concept checks built in"
              />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-orange-400/20 blur-2xl" />
            <Card className="relative rounded-3xl border-border/60 bg-background/80 backdrop-blur-xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/60">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Tutor workspace</p>
                  <p className="text-sm font-medium">Chat · Canvas · Concept checks</p>
                </div>
                <Badge variant="outline" className="gap-1 text-[10px]">
                  <Icon icon="solar:chart-bold-duotone" className="h-3.5 w-3.5" />
                  Live pipeline
                </Badge>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-3">
                  <div className="rounded-2xl border border-border/60 bg-background/80 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Icon icon="solar:dialog-2-bold-duotone" className="h-3.5 w-3.5 text-purple-500" />
                        Chat
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        {isStreaming ? "Streaming..." : "Ready"}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ask Lumina a question..."
                          value={queryInput}
                          onChange={(e) => setQueryInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                          className="h-8 text-xs"
                          disabled={isStreaming}
                        />
                        <Button size="sm" onClick={handleAsk} disabled={isStreaming || !queryInput.trim()} className="h-8 px-3 text-xs">
                          Ask
                        </Button>
                      </div>
                      {answer && (
                        <div className="space-y-1 rounded-xl bg-muted/40 p-2 max-h-32 overflow-y-auto">
                          <p className="text-[11px] text-muted-foreground">You · {queryInput}</p>
                          <p className="text-[11px] font-medium">
                            Lumina · {answer}
                          </p>
                        </div>
                      )}
                      {error && (
                        <p className="text-[11px] text-red-500">Error: {error}</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-purple-500/10 via-background to-orange-400/10 p-3 space-y-2">
                    <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                      <Icon icon="solar:clapperboard-text-bold-duotone" className="h-3.5 w-3.5 text-purple-500" />
                      Visual canvas
                    </p>
                    <div className="h-24 rounded-xl border border-border/60 bg-background/70 flex items-center justify-center text-[11px] text-muted-foreground p-2">
                      {visualPlan ? (
                        <div className="text-center space-y-1">
                          <p className="font-medium">{visualPlan.scene}</p>
                          <p className="text-[10px] opacity-70">
                            {JSON.stringify(visualPlan.spec?.parameters || {})}
                          </p>
                        </div>
                      ) : (
                        "Ask a question to see visuals"
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  {[
                    { label: "Query processing", key: "query_processing" },
                    { label: "Lesson planning", key: "lesson_planning" },
                    { label: "Script generation", key: "script_generation" },
                    { label: "Animation synthesis", key: "animation_synthesis" },
                    { label: "Optimization", key: "optimization" },
                  ].map((stage, index) => {
                    const isActive = stages.includes(stage.key)
                    return (
                      <div
                        key={stage.key}
                        className={`flex items-center gap-1 rounded-full border px-2 py-1 transition-colors ${
                          isActive
                            ? "border-purple-500/60 bg-purple-500/10"
                            : "border-border/60 bg-background/80"
                        }`}
                      >
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-purple-500/10">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              isActive ? "bg-purple-500 animate-pulse" : "bg-purple-500/40"
                            }`}
                          />
                        </span>
                        <span className="truncate">{index + 1}. {stage.label}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Problem / Solution */}
        <section className="grid gap-8 md:grid-cols-2">
          <Card className="border-border/70 bg-background/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Icon icon="solar:confounded-circle-bold-duotone" className="h-4 w-4 text-purple-500" />
                The challenge in modern STEM learning
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Most explanations stop at symbols, not understanding.</p>
              <ul className="space-y-1 list-disc pl-5">
                <li>Abstract equations without a visual anchor</li>
                <li>One-pace-fits-all lectures and videos</li>
                <li>Little space to experiment or ask &quot;what if&quot; questions</li>
                <li>Hard to know if a concept is truly mastered</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-background/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Icon icon="solar:magic-stick-bold-duotone" className="h-4 w-4 text-orange-500" />
                How Lumina responds
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Every question becomes a guided, visual conversation.</p>
              <ul className="space-y-1 list-disc pl-5">
                <li>Adaptive AI tutor that adjusts to your pace</li>
                <li>Instant animations that show forces, fields, and flows</li>
                <li>Experiment mode to tweak parameters and see outcomes</li>
                <li>Concept checks that confirm understanding—not just memorization</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Core capabilities */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-sm font-semibold tracking-[0.18em] uppercase text-muted-foreground">
              Core capabilities
            </h2>
            <Badge variant="outline" className="text-[11px]">
              Built for math, physics, and beyond
            </Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-sm">
            <FeatureCard
              icon="solar:ai-bold-duotone"
              title="AI tutoring agents"
              body="Multi-turn dialogue that learns your style, surfaces prerequisite ideas, and stays grounded in the math."
            />
            <FeatureCard
              icon="solar:video-frame-cut-bold-duotone"
              title="Real-time animation"
              body="Template-driven visuals for common topics plus more expressive scenes when you need them."
            />
            <FeatureCard
              icon="solar:devices-bold-duotone"
              title="Interactive workspace"
              body="Chat, canvas, and controls in one view so you can move between explanation and experimentation."
            />
            <FeatureCard
              icon="solar:radar-2-bold-duotone"
              title="Adaptive learning"
              body="Tracks what you&apos;ve explored, suggests next steps, and keeps difficulty in a productive zone."
            />
          </div>
        </section>
      </main>

      <Dialog open={showDemo} onOpenChange={setShowDemo}>
        <DialogContent className="max-w-3xl border-border/70 bg-background/95 p-0 overflow-hidden">
          <div className="aspect-video w-full bg-black">
            <video
              src="/lumina-physics-demo.mp4"
              controls
              autoPlay
              className="h-full w-full"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function HighlightCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <Card className="border-border/60 bg-background/80 backdrop-blur">
      <CardContent className="py-3 flex items-center gap-3">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/15 to-orange-400/20">
          <Icon icon={icon} className="h-4 w-4 text-purple-500" />
        </div>
        <div className="space-y-0.5">
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className="text-xs font-medium">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function FeatureCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <Card className="border-border/60 bg-background/80 backdrop-blur">
      <CardHeader className="pb-3 flex flex-row items-center gap-3">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/15 to-orange-400/20">
          <Icon icon={icon} className="h-4 w-4 text-purple-500" />
        </div>
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{body}</CardContent>
    </Card>
  )
}
