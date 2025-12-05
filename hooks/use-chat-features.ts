"use client"

/**
 * useChatFeatures Hook
 * 
 * Manages chat feature state: reactions, typing indicators, read receipts, etc.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { getAuthHeaders } from '@/lib/auth'

interface TypingUser {
  userId: string
  userName: string
  startedAt: string
}

interface PinnedMessage {
  id: string
  messageId: string
  pinnedBy: string
  pinnedAt: string
  message: any
}

interface UseChatFeaturesOptions {
  roomId: string
  userId: string | null
  enabled?: boolean
}

export function useChatFeatures({ roomId, userId, enabled = true }: UseChatFeaturesOptions) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // ============================================================================
  // TYPING INDICATORS
  // ============================================================================

  const startTyping = useCallback(async () => {
    if (!enabled || !userId || !roomId) return
    
    // Don't send if already typing
    if (isTypingRef.current) {
      // Reset timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping()
      }, 3000)
      return
    }

    isTypingRef.current = true

    try {
      await fetch(`/api/chat/${roomId}/typing`, { 
        method: 'POST',
        headers: { ...getAuthHeaders() }
      })
    } catch (err) {
      console.error('[useChatFeatures] Failed to start typing:', err)
    }

    // Auto-stop after 3 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, 3000)
  }, [enabled, userId, roomId])

  const stopTyping = useCallback(async () => {
    if (!enabled || !userId || !roomId) return
    if (!isTypingRef.current) return

    isTypingRef.current = false

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    try {
      await fetch(`/api/chat/${roomId}/typing`, { 
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      })
    } catch (err) {
      console.error('[useChatFeatures] Failed to stop typing:', err)
    }
  }, [enabled, userId, roomId])

  const fetchTypingUsers = useCallback(async () => {
    if (!enabled || !roomId) return

    try {
      const res = await fetch(`/api/chat/${roomId}/typing`, {
        headers: { ...getAuthHeaders() }
      })
      if (res.ok) {
        const data = await res.json()
        // Filter out current user
        setTypingUsers(data.filter((u: TypingUser) => u.userId !== userId))
      }
    } catch (err) {
      // Silently fail - typing indicators are not critical
    }
  }, [enabled, roomId, userId])

  // ============================================================================
  // REACTIONS
  // ============================================================================

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!enabled || !userId || !roomId) return false

    try {
      const res = await fetch(`/api/chat/${roomId}/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ emoji }),
      })
      return res.ok
    } catch (err) {
      console.error('[useChatFeatures] Failed to add reaction:', err)
      return false
    }
  }, [enabled, userId, roomId])

  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!enabled || !userId || !roomId) return false

    try {
      const res = await fetch(
        `/api/chat/${roomId}/messages/${messageId}/reactions?emoji=${encodeURIComponent(emoji)}`,
        { method: 'DELETE', headers: { ...getAuthHeaders() } }
      )
      return res.ok
    } catch (err) {
      console.error('[useChatFeatures] Failed to remove reaction:', err)
      return false
    }
  }, [enabled, userId, roomId])

  const toggleReaction = useCallback(async (
    messageId: string, 
    emoji: string, 
    currentReactions: Record<string, string[]>
  ) => {
    if (!userId) return false
    
    const hasReacted = currentReactions[emoji]?.includes(userId)
    if (hasReacted) {
      return removeReaction(messageId, emoji)
    } else {
      return addReaction(messageId, emoji)
    }
  }, [userId, addReaction, removeReaction])

  // ============================================================================
  // PINNED MESSAGES
  // ============================================================================

  const fetchPinnedMessages = useCallback(async () => {
    if (!enabled || !roomId) return

    try {
      const res = await fetch(`/api/chat/${roomId}/pinned`, {
        headers: { ...getAuthHeaders() }
      })
      if (res.ok) {
        const data = await res.json()
        setPinnedMessages(data)
      }
    } catch (err) {
      console.error('[useChatFeatures] Failed to fetch pinned messages:', err)
    }
  }, [enabled, roomId])

  const pinMessage = useCallback(async (messageId: string) => {
    if (!enabled || !userId || !roomId) return false

    try {
      const res = await fetch(`/api/chat/${roomId}/pinned`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ messageId }),
      })
      if (res.ok) {
        await fetchPinnedMessages()
        return true
      }
      return false
    } catch (err) {
      console.error('[useChatFeatures] Failed to pin message:', err)
      return false
    }
  }, [enabled, userId, roomId, fetchPinnedMessages])

  const unpinMessage = useCallback(async (messageId: string) => {
    if (!enabled || !userId || !roomId) return false

    try {
      const res = await fetch(`/api/chat/${roomId}/pinned/${messageId}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      })
      if (res.ok) {
        await fetchPinnedMessages()
        return true
      }
      return false
    } catch (err) {
      console.error('[useChatFeatures] Failed to unpin message:', err)
      return false
    }
  }, [enabled, userId, roomId, fetchPinnedMessages])

  // ============================================================================
  // READ RECEIPTS / UNREAD COUNT
  // ============================================================================

  const markAsRead = useCallback(async (messageId: string) => {
    if (!enabled || !userId || !roomId) return

    try {
      await fetch(`/api/chat/${roomId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ messageId }),
      })
      setUnreadCount(0)
    } catch (err) {
      console.error('[useChatFeatures] Failed to mark as read:', err)
    }
  }, [enabled, userId, roomId])

  const fetchUnreadCount = useCallback(async () => {
    if (!enabled || !userId || !roomId) return

    try {
      const res = await fetch(`/api/chat/${roomId}/read`, {
        headers: { ...getAuthHeaders() }
      })
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (err) {
      console.error('[useChatFeatures] Failed to fetch unread count:', err)
    }
  }, [enabled, userId, roomId])

  // ============================================================================
  // POLLING & CLEANUP
  // ============================================================================

  useEffect(() => {
    if (!enabled || !roomId) return

    // Initial fetch
    fetchTypingUsers()
    fetchPinnedMessages()
    fetchUnreadCount()

    // Poll typing indicators every 2 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchTypingUsers()
    }, 2000)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      // Stop typing on unmount
      if (isTypingRef.current && userId) {
        fetch(`/api/chat/${roomId}/typing`, { 
          method: 'DELETE',
          headers: { ...getAuthHeaders() }
        }).catch(() => {})
      }
    }
  }, [enabled, roomId, userId, fetchTypingUsers, fetchPinnedMessages, fetchUnreadCount])

  return {
    // Typing
    typingUsers,
    startTyping,
    stopTyping,
    
    // Reactions
    addReaction,
    removeReaction,
    toggleReaction,
    
    // Pinned
    pinnedMessages,
    pinMessage,
    unpinMessage,
    refreshPinnedMessages: fetchPinnedMessages,
    
    // Unread
    unreadCount,
    markAsRead,
    refreshUnreadCount: fetchUnreadCount,
  }
}
