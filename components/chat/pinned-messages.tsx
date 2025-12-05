"use client"

/**
 * Pinned Messages Component
 * Shows pinned messages at the top of chat
 */

import { useState } from 'react'
import { Pin, ChevronDown, ChevronUp, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PinnedMessage {
  id: string
  messageId: string
  pinnedBy: string
  pinnedAt: string
  message: {
    id: string
    content: string
    senderName: string
    senderId: string
    createdAt: string
    encrypted?: boolean
  } | null
}

interface PinnedMessagesProps {
  messages: PinnedMessage[]
  onJumpToMessage?: (messageId: string) => void
  onUnpin?: (messageId: string) => void
  canUnpin?: boolean
  className?: string
}

export function PinnedMessages({ 
  messages, 
  onJumpToMessage, 
  onUnpin,
  canUnpin = false,
  className 
}: PinnedMessagesProps) {
  const [expanded, setExpanded] = useState(false)
  
  if (messages.length === 0) return null

  const displayedMessages = expanded ? messages : messages.slice(0, 1)

  return (
    <div className={cn(
      "border-b border-border/50 bg-muted/30 backdrop-blur-sm",
      className
    )}>
      <div className="px-4 py-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Pin className="h-3 w-3" />
            <span>{messages.length} Pinned {messages.length === 1 ? 'Message' : 'Messages'}</span>
          </div>
          {messages.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show all
                </>
              )}
            </Button>
          )}
        </div>
        
        <div className="space-y-1.5">
          {displayedMessages.map((pinned) => (
            <div 
              key={pinned.id}
              className="flex items-start gap-2 p-2 rounded-md bg-background/50 hover:bg-background/80 transition-colors cursor-pointer group"
              onClick={() => pinned.message && onJumpToMessage?.(pinned.message.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium">
                    {pinned.message?.senderName || 'Unknown'}
                  </span>
                  {pinned.message?.encrypted && (
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {pinned.message?.encrypted 
                    ? '🔒 Encrypted message' 
                    : pinned.message?.content || 'Message not found'
                  }
                </p>
              </div>
              {canUnpin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    pinned.message && onUnpin?.(pinned.message.id)
                  }}
                >
                  <Pin className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
