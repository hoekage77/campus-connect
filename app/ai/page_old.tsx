"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Send, Bot, Loader2, Play, Pause, SkipForward, Maximize2 } from "lucide-react"
import { Slider } from "@/components/ui/slider"
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
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  const presetPrompts = [
    "Explain Newton's second law with an animation",
    "Show me projectile motion with vectors",
    "Visualize the electric field around a charge",
    "Walk me through solving quadratic equations",
  ]

  const handleSend = async () => {
    if (!input.trim() || isTyping) return

    const userMessage = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsTyping(true)
    setPipelineStage("Query Processing...")

    // Simulate pipeline stages
    setTimeout(() => setPipelineStage("Content Planning..."), 500)
    setTimeout(() => setPipelineStage("Script Generation..."), 1500)
    setTimeout(() => setPipelineStage("Animation Synthesis..."), 3000)
    setTimeout(() => setPipelineStage("Optimization..."), 8000)

    // Simulate AI response (replace with actual API call later)
    setTimeout(() => {
      const aiResponse = `I've created a visual animation to help explain that concept. You can see it rendered on the canvas. Use the controls below to interact with the visualization!`
      setMessages((prev) => [...prev, { role: "assistant", content: aiResponse }])
      setIsTyping(false)
      setPipelineStage("Complete ✓")
    }, 9000)
  }

  const handlePresetClick = (prompt: string) => {
    setInput(prompt)
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
            {messages.length === 0 && (
              <div className="p-4 border-b bg-muted/30">
                <p className="text-xs font-medium mb-2">Quick Start:</p>
                <div className="space-y-2">
                  {presetPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePresetClick(prompt)}
                      className="w-full text-left text-xs p-2 rounded bg-muted hover:bg-muted/80 transition-colors"
                    >
                      {prompt}
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
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                    )}
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
            </div>

              {/* Input */}
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
            </CardContent>
          </Card>
        )}

        {activeTab === 'presentation' && (
          <Card className="mb-6 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base">Lumina Overview Presentation</CardTitle>
              <CardDescription>Explore the vision, capabilities, and integration roadmap.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full aspect-video bg-black/40">
                <iframe
                  src="/lumina.html"
                  className="w-full h-full border-0"
                  loading="lazy"
                  title="Lumina Presentation"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'docs' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">AI Integration Docs</CardTitle>
              <CardDescription>High-level strategy & next implementation steps.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <ul className="list-disc pl-4 space-y-1">
                <li>Phase 1: Embed presentation, simulated assistant.</li>
                <li>Phase 2: Real LLM endpoint (secure, rate-limited).</li>
                <li>Phase 3: Contextual personalization (user interests & sessions).</li>
                <li>Phase 4: Proactive recommendations & summaries.</li>
                <li>Phase 5: Multi-modal (slides ingestion, docs Q&A).</li>
              </ul>
              <div className="rounded-md border p-3 bg-muted/50">
                <p className="font-medium mb-1">Next Suggested Tasks</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Set up /api/ai/chat endpoint wrapping provider.</li>
                  <li>Add streaming UI state for tokens.</li>
                  <li>Persist conversation history per user.</li>
                  <li>Inject group/session summaries as system context.</li>
                  <li>Moderation / abuse filter.</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center space-y-2">
          <Badge variant="secondary" className="text-xs">
            {activeTab === 'chat' ? '💡 Lumina assistant responses are simulated.' : '📽 Presentation loaded via iframe placeholder.'} Full AI integration coming soon.
          </Badge>
          <p className="text-xs text-muted-foreground">Replace <code>public/lumina.html</code> with final exported deck for production.</p>
        </div>
      </div>
    </div>
  )
}
