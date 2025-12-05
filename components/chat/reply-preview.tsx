"use client"

/**
 * Reply Preview Component
 * Shows the message being replied to
 */

import { X, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReplyPreviewProps {
  message: {
    id: string
    senderName: string
    content: string
    encrypted?: boolean
  }
  onCancel: () => void
  className?: string
}

export function ReplyPreview({ message, onCancel, className }: ReplyPreviewProps) {
  // Truncate content
  const displayContent = message.encrypted 
    ? '🔒 Encrypted message'
    : message.content.length > 100 
      ? message.content.slice(0, 100) + '...' 
      : message.content

  return (
    <div className={cn(
      "flex items-center gap-2 px-4 py-2 bg-muted/50 border-l-2 border-primary",
      className
    )}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-primary">
            Replying to {message.senderName}
          </span>
          {message.encrypted && <Lock className="h-3 w-3 text-muted-foreground" />}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {displayContent}
        </p>
      </div>
      <button 
        onClick={onCancel}
        className="p-1 hover:bg-muted rounded transition-colors"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  )
}

/**
 * Inline Reply Reference
 * Shows in the message bubble when it's a reply
 */
interface InlineReplyProps {
  replyTo: {
    id: string
    senderName: string
    content: string
    encrypted?: boolean
  }
  onClick?: () => void
  className?: string
}

export function InlineReply({ replyTo, onClick, className }: InlineReplyProps) {
  const content = replyTo.content || ''
  const displayContent = replyTo.encrypted 
    ? '🔒 Encrypted message'
    : !content
      ? '(empty message)'
      : content.length > 50 
        ? content.slice(0, 50) + '...' 
        : content

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-2 py-1 mb-1 rounded bg-background/50 border-l-2 border-primary/50",
        "hover:bg-background/80 transition-colors",
        className
      )}
    >
      <div className="text-[10px] font-medium text-primary/80">
        {replyTo.senderName || 'Unknown'}
      </div>
      <div className="text-[11px] text-muted-foreground truncate">
        {displayContent}
      </div>
    </button>
  )
}
