/**
 * useEncryptedChat Hook
 * 
 * Wraps chat functionality with E2EE encryption/decryption.
 * Messages are encrypted before sending and decrypted after receiving.
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  encryptMessage,
  decryptMessage,
  generateGroupKey,
  sealGroupKey,
  unsealGroupKey,
  base64ToPublicKey,
  cacheGroupKey,
  getCachedGroupKey,
  type EncryptedMessage,
} from '@/lib/crypto'
import { useCrypto } from './use-crypto'

// ============================================================================
// Types
// ============================================================================

export interface DecryptedMessage {
  id: string
  chatRoomId: string
  senderId: string
  senderName: string
  content: string               // Decrypted plaintext
  encrypted: boolean
  createdAt: Date
  decryptionFailed?: boolean    // True if we couldn't decrypt
}

export interface EncryptedChatState {
  // State
  isReady: boolean              // Crypto initialized and unlocked
  isEncrypted: boolean          // Room has E2EE enabled
  messages: DecryptedMessage[]
  isLoading: boolean
  error: Error | null

  // Operations
  sendMessage: (plaintext: string) => Promise<void>
  refreshMessages: () => Promise<void>
  enableEncryption: () => Promise<void>
}

// ============================================================================
// API Helpers
// ============================================================================

async function fetchMessages(roomId: string): Promise<any[]> {
  const response = await fetch(`/api/chat/${roomId}/messages`)
  if (!response.ok) {
    throw new Error('Failed to fetch messages')
  }
  return response.json()
}

async function postMessage(roomId: string, content: string, encrypted: boolean, nonce?: string, keyVersion?: number): Promise<any> {
  const response = await fetch(`/api/chat/${roomId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      content, 
      encrypted,
      nonce,
      keyVersion,
    }),
  })
  if (!response.ok) {
    throw new Error('Failed to send message')
  }
  return response.json()
}

async function fetchRoomDetails(roomId: string): Promise<{ encryptionEnabled: boolean; currentKeyVersion: number }> {
  const response = await fetch(`/api/chat/rooms/${roomId}`)
  if (!response.ok) {
    return { encryptionEnabled: false, currentKeyVersion: 1 }
  }
  const data = await response.json()
  return {
    encryptionEnabled: data.encryptionEnabled || false,
    currentKeyVersion: data.currentKeyVersion || 1,
  }
}

async function fetchWrappedKey(roomId: string, userId: string): Promise<string | null> {
  const response = await fetch(`/api/crypto/group-keys/${roomId}`)
  if (!response.ok) return null
  const data = await response.json()
  return data.wrappedKey || null
}

async function uploadWrappedKeys(roomId: string, wrappedKeys: { userId: string; wrappedKey: string }[]): Promise<void> {
  const response = await fetch(`/api/crypto/group-keys/${roomId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wrappedKeys }),
  })
  if (!response.ok) {
    throw new Error('Failed to upload wrapped keys')
  }
}

async function fetchRoomMemberPublicKeys(roomId: string): Promise<{ userId: string; publicKey: string }[]> {
  const response = await fetch(`/api/crypto/room-keys/${roomId}`)
  if (!response.ok) return []
  return response.json()
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useEncryptedChat(
  roomId: string | null,
  userId: string | null
): EncryptedChatState {
  const crypto = useCrypto(userId)
  
  const [messages, setMessages] = useState<DecryptedMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isEncrypted, setIsEncrypted] = useState(false)
  const [keyVersion, setKeyVersion] = useState(1)

  const isReady = crypto.isInitialized && crypto.isUnlocked

  // ============================================================================
  // Get or Fetch Group Key
  // ============================================================================

  const getGroupKey = useCallback(async (): Promise<Uint8Array | null> => {
    if (!roomId || !userId || !isReady) return null

    // Check cache first
    const cached = getCachedGroupKey(roomId)
    if (cached && cached.version === keyVersion) {
      return cached.key
    }

    // Fetch wrapped key from server
    const wrappedKey = await fetchWrappedKey(roomId, userId)
    if (!wrappedKey) return null

    // Get our private key
    const privateKey = crypto.getPrivateKey()
    if (!privateKey) return null

    // Get our public key
    const publicKey = crypto.publicKey ? base64ToPublicKey(crypto.publicKey) : null
    if (!publicKey) return null

    try {
      // Unseal the group key
      const groupKey = unsealGroupKey(wrappedKey, publicKey, privateKey)
      
      // Cache it
      cacheGroupKey(roomId, groupKey, keyVersion)
      
      return groupKey
    } catch (err) {
      console.error('[useEncryptedChat] Failed to unseal group key:', err)
      return null
    }
  }, [roomId, userId, isReady, keyVersion, crypto])

  // ============================================================================
  // Decrypt Messages
  // ============================================================================

  const decryptMessages = useCallback(async (rawMessages: any[]): Promise<DecryptedMessage[]> => {
    const groupKey = await getGroupKey()

    return rawMessages.map((msg) => {
      if (!msg.encrypted) {
        // Not encrypted, return as-is
        return {
          id: msg.id,
          chatRoomId: msg.chatRoomId,
          senderId: msg.senderId,
          senderName: msg.senderName || 'Unknown',
          content: msg.content,
          encrypted: false,
          createdAt: new Date(msg.createdAt),
        }
      }

      if (!groupKey) {
        // Can't decrypt without key
        return {
          id: msg.id,
          chatRoomId: msg.chatRoomId,
          senderId: msg.senderId,
          senderName: msg.senderName || 'Unknown',
          content: '🔒 Encrypted message (unlock to view)',
          encrypted: true,
          createdAt: new Date(msg.createdAt),
          decryptionFailed: true,
        }
      }

      try {
        const decrypted = decryptMessage(
          { ciphertext: msg.content, nonce: msg.nonce },
          groupKey
        )
        return {
          id: msg.id,
          chatRoomId: msg.chatRoomId,
          senderId: msg.senderId,
          senderName: msg.senderName || 'Unknown',
          content: decrypted,
          encrypted: true,
          createdAt: new Date(msg.createdAt),
        }
      } catch (err) {
        console.error('[useEncryptedChat] Decryption failed:', err)
        return {
          id: msg.id,
          chatRoomId: msg.chatRoomId,
          senderId: msg.senderId,
          senderName: msg.senderName || 'Unknown',
          content: '🔒 Failed to decrypt message',
          encrypted: true,
          createdAt: new Date(msg.createdAt),
          decryptionFailed: true,
        }
      }
    })
  }, [getGroupKey])

  // ============================================================================
  // Fetch & Decrypt Messages
  // ============================================================================

  const refreshMessages = useCallback(async () => {
    if (!roomId) return

    setIsLoading(true)
    setError(null)

    try {
      // Get room details
      const roomDetails = await fetchRoomDetails(roomId)
      setIsEncrypted(roomDetails.encryptionEnabled)
      setKeyVersion(roomDetails.currentKeyVersion)

      // Fetch messages
      const rawMessages = await fetchMessages(roomId)
      
      // Decrypt
      const decrypted = await decryptMessages(rawMessages)
      setMessages(decrypted)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load messages'))
    } finally {
      setIsLoading(false)
    }
  }, [roomId, decryptMessages])

  // ============================================================================
  // Send Encrypted Message
  // ============================================================================

  const sendMessage = useCallback(async (plaintext: string) => {
    if (!roomId || !plaintext.trim()) return

    if (!isEncrypted) {
      // Send unencrypted
      await postMessage(roomId, plaintext, false)
      await refreshMessages()
      return
    }

    if (!isReady) {
      throw new Error('Encryption not ready. Please unlock your keys.')
    }

    const groupKey = await getGroupKey()
    if (!groupKey) {
      throw new Error('No group key available. Encryption may not be set up for this room.')
    }

    // Encrypt the message
    const encrypted = encryptMessage(plaintext, groupKey)

    // Send encrypted message
    await postMessage(roomId, encrypted.ciphertext, true, encrypted.nonce, keyVersion)
    
    // Refresh to see the new message
    await refreshMessages()
  }, [roomId, isEncrypted, isReady, getGroupKey, keyVersion, refreshMessages])

  // ============================================================================
  // Enable Encryption for Room
  // ============================================================================

  const enableEncryption = useCallback(async () => {
    if (!roomId || !isReady) {
      throw new Error('Cannot enable encryption: not ready')
    }

    // Generate new group key
    const groupKey = generateGroupKey()

    // Get all room members' public keys
    const memberKeys = await fetchRoomMemberPublicKeys(roomId)
    if (memberKeys.length === 0) {
      throw new Error('No members with encryption enabled in this room')
    }

    // Wrap the group key for each member
    const wrappedKeys = memberKeys.map(({ userId, publicKey }) => {
      const pubKey = base64ToPublicKey(publicKey)
      const wrapped = sealGroupKey(groupKey, pubKey)
      return { userId, wrappedKey: wrapped }
    })

    // Upload wrapped keys
    await uploadWrappedKeys(roomId, wrappedKeys)

    // Cache our copy
    cacheGroupKey(roomId, groupKey, 1)

    // Update room settings
    // TODO: API to enable encryption on room

    setIsEncrypted(true)
    setKeyVersion(1)
  }, [roomId, isReady])

  // ============================================================================
  // Auto-refresh on mount and when room changes
  // ============================================================================

  useEffect(() => {
    if (roomId) {
      refreshMessages()
    }
  }, [roomId, refreshMessages])

  return {
    isReady,
    isEncrypted,
    messages,
    isLoading,
    error,
    sendMessage,
    refreshMessages,
    enableEncryption,
  }
}

export default useEncryptedChat
