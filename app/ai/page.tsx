"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Sparkles, Send, Bot, Loader2, Play, Pause, SkipForward, Maximize2, RefreshCw } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

export default function AIPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [pipelineStage, setPipelineStage] = useState<string>("Idle")
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState([0])
  const [showControls, setShowControls] = useState(false)
  const [demoAnimation, setDemoAnimation] = useState<string | null>(null)
  const [animationProgress, setAnimationProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [renderProgress, setRenderProgress] = useState(0)
  const [renderStage, setRenderStage] = useState("")

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  // Animation demo videos/descriptions for each preset (matched to template keys)
  const presetPrompts = [
    {
      text: "Explain Newton's second law with an animation",
      demo: "newtonSecondLaw",
      description: "Watch as force, mass, and acceleration come to life with vectors and motion trails"
    },
    {
      text: "Show me projectile motion with vectors",
      demo: "projectileMotion",
      description: "See parabolic paths, velocity components, and trajectory predictions in real-time"
    },
    {
      text: "Visualize the electric field around a charge",
      demo: "electricField",
      description: "Field lines and equipotential surfaces rendered in interactive 3D space"
    },
    {
      text: "Walk me through solving quadratic equations",
      demo: "quadraticFunction",
      description: "Step-by-step algebraic transformations with graphing and vertex visualization"
    },
  ]

  // Demo animation sequences (90 seconds each)
  const demoAnimations: Record<string, { frames: Array<{ time: number; content: string; visual: string }> }> = {
    newton: {
      frames: [
        { time: 0, content: "Let's explore F = ma", visual: "title" },
        { time: 10, content: "A 5kg box on a frictionless surface...", visual: "box-static" },
        { time: 20, content: "Apply 10N force →", visual: "box-force-arrow" },
        { time: 30, content: "F = ma, so a = F/m = 10/5 = 2 m/s²", visual: "equation-highlight" },
        { time: 45, content: "Watch the acceleration!", visual: "box-accelerating" },
        { time: 60, content: "Velocity increases linearly: v = at", visual: "velocity-graph" },
        { time: 75, content: "Doubling the force doubles acceleration", visual: "comparison-split" },
        { time: 90, content: "That's Newton's 2nd Law! 🎯", visual: "summary" },
      ]
    },
    projectile: {
      frames: [
        { time: 0, content: "Projectile Motion Breakdown", visual: "title" },
        { time: 10, content: "Launch angle: 45°, velocity: 20 m/s", visual: "cannon-setup" },
        { time: 25, content: "Horizontal component: vₓ = v·cos(θ)", visual: "vector-decomp-x" },
        { time: 40, content: "Vertical component: vᵧ = v·sin(θ)", visual: "vector-decomp-y" },
        { time: 55, content: "Gravity acts only on vertical motion", visual: "parabola-trace" },
        { time: 70, content: "Range = v²·sin(2θ)/g", visual: "range-formula" },
        { time: 85, content: "Perfect trajectory! 🎯", visual: "complete-path" },
      ]
    },
    electric: {
      frames: [
        { time: 0, content: "Electric Field Visualization", visual: "title" },
        { time: 10, content: "A +5μC point charge...", visual: "charge-center" },
        { time: 25, content: "Field lines radiate outward", visual: "field-lines-grow" },
        { time: 40, content: "E = kQ/r² at any distance", visual: "equation-overlay" },
        { time: 55, content: "Add a test charge to see force", visual: "test-charge-force" },
        { time: 70, content: "Equipotential surfaces shown", visual: "3d-surfaces" },
        { time: 85, content: "Field strength visualized by color", visual: "heatmap" },
      ]
    },
    quadratic: {
      frames: [
        { time: 0, content: "Solving x² + 4x - 5 = 0", visual: "title" },
        { time: 10, content: "Step 1: Factor if possible", visual: "factoring-attempt" },
        { time: 25, content: "(x + 5)(x - 1) = 0", visual: "factored-form" },
        { time: 40, content: "Solutions: x = -5 or x = 1", visual: "roots-highlight" },
        { time: 55, content: "Graph the parabola y = x² + 4x - 5", visual: "parabola-plot" },
        { time: 70, content: "Roots are x-intercepts!", visual: "intercepts-marked" },
        { time: 85, content: "Vertex at (-2, -9)", visual: "vertex-complete" },
      ]
    }
  }

  useEffect(() => {
    if (!demoAnimation) return
    
    const demo = demoAnimations[demoAnimation]
    if (!demo) return

    const totalDuration = 90000 // 90 seconds
    const startTime = Date.now()

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min((elapsed / totalDuration) * 100, 100)
      setAnimationProgress(progress)

      if (progress >= 100) {
        clearInterval(interval)
        setTimeout(() => {
          setDemoAnimation(null)
          setAnimationProgress(0)
        }, 2000)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [demoAnimation])

  const getCurrentFrame = (demoKey: string) => {
    const demo = demoAnimations[demoKey]
    if (!demo) return null
    
    const currentTime = (animationProgress / 100) * 90
    let currentFrame = demo.frames[0]
    
    for (const frame of demo.frames) {
      if (currentTime >= frame.time) {
        currentFrame = frame
      } else {
        break
      }
    }
    
    return currentFrame
  }

  const handleSend = async () => {
    if (!input.trim() || isTyping) return

    const userMessage = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsTyping(true)
    setIsRendering(true)
    setRenderProgress(0)
    setPipelineStage("Processing...")
    setVideoUrl(null)

    try {
      // Call Manim render API with SSE
      const response = await fetch('/api/lumina/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage }),
      })

      if (!response.ok || !response.body) {
        throw new Error('Failed to start render')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'progress') {
                setRenderProgress(data.progress)
                setRenderStage(data.message)
                setPipelineStage(data.stage)
              } else if (data.type === 'complete') {
                setVideoUrl(data.videoUrl)
                setIsRendering(false)
                setMessages((prev) => [
                  ...prev,
                  {
                    role: 'assistant',
                    content: `Animation rendered successfully! Watch it in the canvas above.`,
                  },
                ])
                setPipelineStage("Complete ✓")
                toast({
                  title: "Animation Ready!",
                  description: "Your Manim animation has been generated.",
                })
              } else if (data.type === 'error') {
                throw new Error(data.message)
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Render error:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I couldn't generate the animation. ${error.message || 'Please try again.'}`,
        },
      ])
      setPipelineStage("Error")
      toast({
        title: "Render Failed",
        description: error.message || "Could not generate animation",
        variant: "destructive",
      })
    } finally {
      setIsTyping(false)
      setIsRendering(false)
    }
  }

  const handlePresetClick = async (promptObj: typeof presetPrompts[0]) => {
    setInput(promptObj.text)
    setMessages((prev) => [...prev, { role: "user", content: promptObj.text }])
    setIsTyping(true)
    setIsRendering(true)
    setRenderProgress(0)
    setPipelineStage("Processing...")
    setVideoUrl(null)
    setDemoAnimation(null) // Clear any demo animation

    toast({
      title: "Rendering with Manim",
      description: "Generating your animation using real Manim library...",
    })

    try {
      // Call Manim render API with SSE and preset parameter
      const response = await fetch('/api/lumina/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: promptObj.text,
          preset: promptObj.demo 
        }),
      })

      if (!response.ok || !response.body) {
        throw new Error('Failed to start render')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'progress') {
                setRenderProgress(data.progress)
                setRenderStage(data.message)
                setPipelineStage(data.stage)
              } else if (data.type === 'complete') {
                setVideoUrl(data.videoUrl)
                setIsRendering(false)
                setMessages((prev) => [
                  ...prev,
                  {
                    role: 'assistant',
                    content: `✨ Animation rendered successfully! This is a real Manim-generated video. Use the video controls to play, pause, or scrub through the animation.`,
                  },
                ])
                setPipelineStage("Complete ✓")
                toast({
                  title: "Manim Animation Ready!",
                  description: "Your animation has been generated by 3Blue1Brown's Manim library.",
                })
              } else if (data.type === 'error') {
                // If Manim not available, show fallback message
                if (data.fallback) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      role: 'assistant',
                      content: `📝 Manim script generated successfully, but rendering requires Python + Manim on the server. See the setup guide in docs/MANIM_SETUP.md to enable full rendering.`,
                    },
                  ])
                  toast({
                    title: "Script Generated",
                    description: "Install Manim to enable video rendering",
                  })
                } else {
                  throw new Error(data.message)
                }
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Render error:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I couldn't generate the animation. ${error.message || 'Please try again.'}`,
        },
      ])
      setPipelineStage("Error")
      toast({
        title: "Render Failed",
        description: error.message || "Could not generate animation",
        variant: "destructive",
      })
    } finally {
      setIsTyping(false)
      setIsRendering(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Lumina...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-2 sm:px-4 py-4 max-w-[1800px]">
        {/* Header */}
        <div className="mb-4 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Lumina</h1>
              <p className="text-sm text-muted-foreground">Intelligent Visual Learning Platform</p>
            </div>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[30%_70%] gap-4 mb-4">
          {/* Chat Panel */}
          <Card className="flex flex-col h-[600px]">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-lg">Chat with Lumina</h2>
              <p className="text-xs text-muted-foreground">Ask anything about math, physics, or science</p>
            </div>

            {/* Preset Prompts */}
            {messages.length === 0 && !demoAnimation && !videoUrl && (
              <div className="p-4 border-b bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                    Quick Start: Real Manim Animations
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground mb-3">
                  Click to generate actual 3Blue1Brown-style animations (~8s render)
                </p>
                <div className="space-y-2">
                  {presetPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePresetClick(prompt)}
                      disabled={isRendering}
                      className="w-full text-left text-xs p-3 rounded-lg bg-background hover:bg-muted transition-all border border-purple-200 dark:border-purple-800 group hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-medium mb-1 flex items-center gap-2">
                        <span className="text-purple-600 dark:text-purple-400">▶</span>
                        {prompt.text}
                      </div>
                      <div className="text-[10px] text-muted-foreground leading-relaxed">
                        {prompt.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message List */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-3">
                    <Bot className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold mb-1">Ready to Learn</h3>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Pick a preset above or type your own question about math, physics, or science!
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ask me anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  className="min-h-[60px] resize-none"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="h-[60px] px-6"
                >
                  {isTyping ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Visualization Canvas */}
          <Card className="flex-1 overflow-hidden">
            <CardContent className="p-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center relative h-[600px] overflow-hidden">
              {videoUrl ? (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <video
                    key={videoUrl}
                    src={videoUrl}
                    controls
                    autoPlay
                    loop
                    className="max-w-full max-h-full rounded-lg shadow-2xl"
                  />
                </div>
              ) : isRendering ? (
                <div className="text-center text-slate-100">
                  <div className="w-32 h-32 border-4 border-purple-500/30 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                    <RefreshCw className="w-16 h-16 text-purple-400 animate-spin" />
                    <div className="absolute -bottom-2 text-xs font-medium text-purple-300">
                      {renderProgress}%
                    </div>
                  </div>
                  <p className="text-sm font-medium">{renderStage}</p>
                  <p className="text-xs mt-1 text-slate-400">Manim is generating your animation...</p>
                </div>
              ) : demoAnimation ? (
                <div className="text-center text-slate-100 w-full h-full flex flex-col items-center justify-center p-8">
                  {/* Demo Animation Playback */}
                  <div className="mb-6 relative">
                    <div className="w-48 h-48 border-4 border-purple-500/50 rounded-full flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
                      {/* Animated visual based on current frame */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 animate-pulse" />
                      <Sparkles className="w-24 h-24 text-purple-300 relative z-10 animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                    {/* Progress ring */}
                    <svg className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 -rotate-90">
                      <circle
                        cx="96"
                        cy="96"
                        r="92"
                        stroke="rgb(168, 85, 247)"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${(animationProgress / 100) * 578} 578`}
                        className="transition-all duration-300"
                      />
                    </svg>
                  </div>
                  
                  {/* Current frame content */}
                  {getCurrentFrame(demoAnimation) && (
                    <div className="space-y-3 max-w-md">
                      <p className="text-lg font-bold text-purple-300">
                        {getCurrentFrame(demoAnimation)!.content}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {getCurrentFrame(demoAnimation)!.visual}
                      </Badge>
                      <p className="text-xs text-slate-400 mt-2">
                        {Math.floor(animationProgress / 100 * 90)}s / 90s
                      </p>
                    </div>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDemoAnimation(null)
                      setAnimationProgress(0)
                    }}
                    className="mt-6 text-xs"
                  >
                    Skip Demo
                  </Button>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-slate-400">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-12 h-12 text-purple-400" />
                  </div>
                  <p className="text-sm font-medium">Ready to visualize</p>
                  <p className="text-xs mt-1">Click a Quick Start demo to see a 90s preview</p>
                </div>
              ) : (
                <div className="text-center text-slate-400">
                  <div className="w-32 h-32 border-4 border-purple-500/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <RefreshCw className="w-16 h-16 text-purple-400 animate-spin" />
                  </div>
                  <p className="text-sm font-medium">Animation rendering...</p>
                  <p className="text-xs mt-1">WebGL canvas placeholder</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Control Panel - Collapsible */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowControls(!showControls)}
              className="text-xs h-7"
            >
              {showControls ? "Hide" : "Show"} Controls
            </Button>
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              {pipelineStage}
            </Badge>
          </div>
          
          {showControls && (
            <Card>
              <div className="p-3">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setIsPlaying(!isPlaying)}>
                      {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </Button>
                    <Button variant="outline" size="icon" className="h-7 w-7">
                      <SkipForward className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-7 w-7">
                      <Maximize2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Slider value={currentTime} onValueChange={setCurrentTime} max={100} step={1} className="w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Velocity</label>
                    <Slider defaultValue={[50]} max={100} step={1} className="w-full" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Angle</label>
                    <Slider defaultValue={[45]} max={90} step={1} className="w-full" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Mass</label>
                    <Slider defaultValue={[75]} max={100} step={1} className="w-full" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Friction</label>
                    <Slider defaultValue={[20]} max={100} step={1} className="w-full" />
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="text-center mt-3">
          <Badge variant="secondary" className="text-xs flex items-center gap-2 mx-auto w-fit">
            <Sparkles className="w-3 h-3" />
            Powered by Manim (3Blue1Brown) + Gemini 2.5 Flash • Phase 1 Active
          </Badge>
        </div>
      </div>
    </div>
  )
}
