"use client"

/**
 * Mention Autocomplete Component
 * Shows dropdown of users when typing @
 */

import { useState, useEffect, useRef } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface User {
  id: string
  name: string
  username: string
}

interface MentionAutocompleteProps {
  members: User[]
  searchTerm: string
  position: { top: number; left: number }
  onSelect: (user: User) => void
  onClose: () => void
}

export function MentionAutocomplete({ 
  members, 
  searchTerm, 
  position, 
  onSelect, 
  onClose 
}: MentionAutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  // Filter members by search term
  const filtered = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.username.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 8)

  // Reset selection when filtered list changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchTerm])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        if (filtered[selectedIndex]) {
          onSelect(filtered[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filtered, selectedIndex, onSelect, onClose])

  if (filtered.length === 0) return null

  return (
    <div 
      ref={listRef}
      className="absolute z-50 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
      style={{ 
        bottom: position.top,
        left: position.left,
        minWidth: '200px',
        maxWidth: '300px',
      }}
    >
      <div className="py-1">
        {filtered.map((user, index) => (
          <button
            key={user.id}
            onClick={() => onSelect(user)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
              index === selectedIndex ? "bg-muted" : "hover:bg-muted/50"
            )}
          >
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start overflow-hidden">
              <span className="font-medium truncate">{user.name}</span>
              <span className="text-xs text-muted-foreground truncate">@{user.username}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Parse mentions from text
 * Returns array of mentioned userIds
 */
export function parseMentions(text: string, members: User[]): string[] {
  const mentionRegex = /@(\w+)/g
  const mentions: string[] = []
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    const username = match[1].toLowerCase()
    const user = members.find(m => 
      m.username.toLowerCase() === username ||
      m.name.toLowerCase().replace(/\s+/g, '') === username
    )
    if (user && !mentions.includes(user.id)) {
      mentions.push(user.id)
    }
  }

  return mentions
}

/**
 * Render text with highlighted mentions
 */
interface HighlightedTextProps {
  text: string
  className?: string
}

export function HighlightedText({ text, className }: HighlightedTextProps) {
  // Split by @mentions
  const parts = text.split(/(@\w+)/g)

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          return (
            <span 
              key={i} 
              className="text-primary font-medium bg-primary/10 rounded px-0.5"
            >
              {part}
            </span>
          )
        }
        return part
      })}
    </span>
  )
}
