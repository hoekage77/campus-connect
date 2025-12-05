"use client"

/**
 * Typing Indicator Component
 * Shows who is currently typing in the chat
 */

import { cn } from '@/lib/utils'

interface TypingIndicatorProps {
  users: Array<{ userId: string; userName: string }>
  className?: string
}

export function TypingIndicator({ users, className }: TypingIndicatorProps) {
  if (users.length === 0) return null

  const names = users.map(u => u.userName)
  let text = ''
  
  if (names.length === 1) {
    text = `${names[0]} is typing`
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing`
  } else if (names.length === 3) {
    text = `${names[0]}, ${names[1]}, and ${names[2]} are typing`
  } else {
    text = `${names[0]}, ${names[1]}, and ${names.length - 2} others are typing`
  }

  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground px-4 py-1", className)}>
      <TypingDots />
      <span>{text}</span>
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex gap-0.5">
      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}
