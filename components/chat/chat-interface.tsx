"use client"

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { getChatMessages, sendChatMessage } from '@/lib/api-client'
import { Loader2, Send, MoreVertical, Phone, Video } from 'lucide-react'
import { cn } from "@/lib/utils"

interface ChatInterfaceProps {
  roomId: string
  title: string
  subtitle?: string
  avatar?: string
  onBack?: () => void // For mobile view
}

export function ChatInterface({ roomId, title, subtitle, avatar, onBack }: ChatInterfaceProps) {
  const { toast } = useToast()
  const { user } = useAuth()

  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [content, setContent] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    try {
      setLoading(true)
      const data = await getChatMessages(roomId, 100, 0)
      // Sort messages by timestamp (ascending for chat flow)
      setMessages([...data].sort((a, b) => {
        const ta = new Date((a as any).createdAt || (a as any).timestamp || 0).getTime()
        const tb = new Date((b as any).createdAt || (b as any).timestamp || 0).getTime()
        return ta - tb
      }))
      scrollToBottom()
    } catch (err) {
      console.error(err)
      toast({ title: 'Error', description: 'Failed to load messages', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, 100)
  }

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !content.trim()) return
    
    const tempId = Date.now().toString()
    const tempMsg = {
      id: tempId,
      content: content.trim(),
      senderId: user.id,
      senderName: user.name,
      senderLevel: 'User', // Placeholder
      createdAt: new Date().toISOString(),
      pending: true
    }

    // Optimistic update
    setMessages((prev) => [...prev, tempMsg])
    setContent('')
    scrollToBottom()

    try {
      setSending(true)
      const msg = await sendChatMessage(roomId, user.id, tempMsg.content)
      // Replace temp message with real one
      setMessages((prev) => prev.map(m => m.id === tempId ? msg : m))
    } catch (err) {
      console.error(err)
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' })
      // Remove temp message on failure
      setMessages((prev) => prev.filter(m => m.id !== tempId))
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    if (roomId) {
      load()
    }
  }, [roomId])

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden shadow-sm">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" className="lg:hidden -ml-2" onClick={onBack}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Button>
          )}
          <Avatar className="h-10 w-10 ring-2 ring-border/50">
            <AvatarImage src={avatar} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary font-bold">
              {title.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent" ref={scrollRef}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            <p className="text-sm">Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div className="text-center">
              <p className="font-medium">No messages yet</p>
              <p className="text-xs opacity-70">Be the first to say hello!</p>
            </div>
          </div>
        ) : (
          messages.map((m, i) => {
            const isMe = m.senderId === user?.id
            const showAvatar = !isMe && (i === 0 || messages[i - 1].senderId !== m.senderId)
            
            return (
              <div key={m.id || i} className={cn("flex gap-3 max-w-[80%]", isMe ? "ml-auto flex-row-reverse" : "")}>
                {!isMe && (
                  <div className="w-8 flex-shrink-0 flex flex-col justify-end">
                    {showAvatar ? (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                          {m.senderName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ) : <div className="w-8" />}
                  </div>
                )}
                
                <div className={cn("flex flex-col gap-1", isMe ? "items-end" : "items-start")}>
                  {!isMe && showAvatar && (
                    <span className="text-xs text-muted-foreground ml-1">{m.senderName}</span>
                  )}
                  <div
                    className={cn(
                      "px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                      isMe 
                        ? "bg-primary text-primary-foreground rounded-tr-sm" 
                        : "bg-muted/50 border border-border/50 rounded-tl-sm"
                    )}
                  >
                    {m.content}
                  </div>
                  <span className="text-[10px] text-muted-foreground opacity-70 px-1">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background/80 backdrop-blur-md border-t border-border/50">
        <form onSubmit={onSend} className="flex items-center gap-2 relative">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message..."
            className="pr-12 h-12 rounded-full bg-muted/30 border-border/50 focus-visible:ring-primary/20"
            disabled={sending}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!content.trim() || sending}
            className="absolute right-1.5 top-1.5 h-9 w-9 rounded-full bg-primary hover:bg-primary/90 transition-all"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  )
}
