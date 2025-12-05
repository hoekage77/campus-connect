"use client"

/**
 * Emoji Reaction Picker Component
 * Displays available emoji reactions for messages
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Smile } from 'lucide-react'
import { cn } from '@/lib/utils'

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '✅', '❓', '🎉', '🔥', '👀']

interface ReactionPickerProps {
  onSelect: (emoji: string) => void
  disabled?: boolean
}

export function ReactionPicker({ onSelect, disabled }: ReactionPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          disabled={disabled}
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex gap-1">
          {EMOJI_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onSelect(emoji)
                setOpen(false)
              }}
              className="text-lg hover:bg-muted p-1 rounded transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Message Reactions Display
 * Shows reactions on a message with counts
 */
interface MessageReactionsProps {
  reactions: Record<string, string[]>  // emoji -> userId[]
  currentUserId?: string
  onToggle: (emoji: string) => void
  disabled?: boolean
}

export function MessageReactions({ reactions, currentUserId, onToggle, disabled }: MessageReactionsProps) {
  const entries = Object.entries(reactions).filter(([_, users]) => users.length > 0)
  
  if (entries.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {entries.map(([emoji, users]) => {
        const hasReacted = currentUserId ? users.includes(currentUserId) : false
        return (
          <button
            key={emoji}
            onClick={() => !disabled && onToggle(emoji)}
            disabled={disabled}
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors",
              hasReacted 
                ? "bg-primary/10 border-primary/30 text-primary" 
                : "bg-muted/50 border-border/50 hover:bg-muted"
            )}
          >
            <span>{emoji}</span>
            <span className="font-medium">{users.length}</span>
          </button>
        )
      })}
    </div>
  )
}
