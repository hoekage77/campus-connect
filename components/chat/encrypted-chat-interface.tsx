"use client"

/**
 * EncryptedChatInterface
 * 
 * Chat interface with full E2EE support + reactions, replies, mentions, typing indicators,
 * GIFs, polls, voice messages, and space launching.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { useCrypto } from '@/hooks/use-crypto'
import { useChatFeatures } from '@/hooks/use-chat-features'
import { getAuthHeaders } from '@/lib/auth'
import { 
  Loader2, Send, MoreVertical, Phone, Video, Lock, LockOpen, 
  Shield, ShieldCheck, ShieldOff, Key, Reply, Pin, Radio, BarChart3, ImageIcon, Mic
} from 'lucide-react'
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SetupEncryptionDialog } from '@/components/crypto/setup-encryption-dialog'
import { UnlockKeysDialog } from '@/components/crypto/unlock-keys-dialog'
import { KeyBackupDialog } from '@/components/crypto/key-backup-dialog'
import { ReactionPicker, MessageReactions } from './reaction-picker'
import { TypingIndicator } from './typing-indicator'
import { ReplyPreview, InlineReply } from './reply-preview'
import { PinnedMessages } from './pinned-messages'
import { MentionAutocomplete, parseMentions, HighlightedText } from './mention-autocomplete'
import { GifPicker, GifMessage } from './gif-picker'
import { CreatePollDialog, PollDisplay, Poll } from './poll'
import { StartSpaceDialog, SpaceLink } from './start-space'
import { VoiceRecorder, VoicePlayer } from './voice-message'
import {
  initSodium,
  isSodiumReady,
  encryptMessage,
  decryptMessage,
  generateGroupKey,
  sealGroupKey,
  unsealGroupKey,
  base64ToPublicKey,
  cacheGroupKey,
  getCachedGroupKey,
} from '@/lib/crypto'

interface EncryptedChatInterfaceProps {
  roomId: string
  groupId: string
  title: string
  subtitle?: string
  avatar?: string
  onBack?: () => void
}

interface ChatMessage {
  id: string
  content: string
  senderId: string
  senderName: string
  createdAt: string
  encrypted?: boolean
  nonce?: string
  keyVersion?: number
  pending?: boolean
  decryptionFailed?: boolean
  reactions?: Record<string, string[]>
  replyToId?: string | null
  replyTo?: {
    id: string
    senderId: string
    senderName: string
    content: string
    encrypted?: boolean
  } | null
  // Media fields
  mediaType?: 'gif' | 'image' | 'video' | 'audio' | 'file' | 'poll' | 'space'
  mediaUrl?: string
  mediaThumbnail?: string
  mediaWidth?: number
  mediaHeight?: number
  mediaProvider?: string
  pollId?: string
}

interface GroupMember {
  id: string
  name: string
  username: string
}

export function EncryptedChatInterface({
  roomId,
  groupId,
  title, 
  subtitle, 
  avatar, 
  onBack 
}: EncryptedChatInterfaceProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const crypto = useCrypto(user?.id || null)
  
  // Chat features hook
  const {
    typingUsers,
    startTyping,
    stopTyping,
    addReaction,
    removeReaction,
    pinnedMessages,
    pinMessage,
    unpinMessage,
    unreadCount,
    markAsRead,
  } = useChatFeatures({
    roomId,
    userId: user?.id || null,
    enabled: true,
  })
  
  // Toggle reaction helper
  const toggleReaction = async (messageId: string, emoji: string) => {
    const msg = messages.find(m => m.id === messageId)
    if (!msg || !user?.id) return
    
    const currentReactions = msg.reactions || {}
    const hasReacted = currentReactions[emoji]?.includes(user.id)
    
    if (hasReacted) {
      await removeReaction(messageId, emoji)
      // Optimistic update
      setMessages(prev => prev.map(m => {
        if (m.id === messageId && m.reactions) {
          const updated = { ...m.reactions }
          updated[emoji] = (updated[emoji] || []).filter(id => id !== user.id)
          if (updated[emoji].length === 0) delete updated[emoji]
          return { ...m, reactions: updated }
        }
        return m
      }))
    } else {
      await addReaction(messageId, emoji)
      // Optimistic update
      setMessages(prev => prev.map(m => {
        if (m.id === messageId) {
          const updated = m.reactions ? { ...m.reactions } : {}
          updated[emoji] = [...(updated[emoji] || []), user.id]
          return { ...m, reactions: updated }
        }
        return m
      }))
    }
  }

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [content, setContent] = useState('')
  const [roomEncrypted, setRoomEncrypted] = useState(false)
  const [keyVersion, setKeyVersion] = useState(1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reply state
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  
  // Mention state
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })

  // Poll state
  const [showCreatePoll, setShowCreatePoll] = useState(false)
  const [creatingPoll, setCreatingPoll] = useState(false)
  const [polls, setPolls] = useState<Poll[]>([])

  // Space state
  const [showStartSpace, setShowStartSpace] = useState(false)

  // Voice message state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false)

  // Dialogs
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const [showUnlockDialog, setShowUnlockDialog] = useState(false)
  const [showBackupDialog, setShowBackupDialog] = useState(false)

  // Group key cache
  const groupKeyRef = useRef<Uint8Array | null>(null)

  // Initialize sodium on mount
  useEffect(() => {
    if (!isSodiumReady()) {
      initSodium().catch(console.error)
    }
  }, [])

  // Get group key for this room
  const getGroupKey = useCallback(async (): Promise<Uint8Array | null> => {
    if (!roomId || !crypto.isUnlocked) return null

    // Check cache
    const cached = getCachedGroupKey(roomId)
    if (cached && cached.version === keyVersion) {
      groupKeyRef.current = cached.key
      return cached.key
    }

    try {
      // Fetch wrapped key from server
      const response = await fetch(`/api/crypto/group-keys/${roomId}`, {
        headers: { ...getAuthHeaders() }
      })
      if (!response.ok) return null
      
      const data = await response.json()
      if (!data.wrappedKey) return null

      // Get our keys
      const privateKey = crypto.getPrivateKey()
      const publicKey = crypto.publicKey ? base64ToPublicKey(crypto.publicKey) : null
      if (!privateKey || !publicKey) return null

      // Unseal the group key
      const groupKey = unsealGroupKey(data.wrappedKey, publicKey, privateKey)
      
      // Cache it
      cacheGroupKey(roomId, groupKey, data.keyVersion || 1)
      groupKeyRef.current = groupKey
      
      return groupKey
    } catch (err) {
      console.error('[EncryptedChat] Failed to get group key:', err)
      return null
    }
  }, [roomId, crypto.isUnlocked, crypto.publicKey, crypto.getPrivateKey, keyVersion])

  // Decrypt a single message
  const decryptMessageContent = useCallback((msg: ChatMessage): ChatMessage => {
    if (!msg.encrypted || !msg.nonce) return msg
    
    const groupKey = groupKeyRef.current
    if (!groupKey) {
      return { ...msg, content: '🔒 Encrypted (unlock to view)', decryptionFailed: true }
    }

    try {
      const decrypted = decryptMessage(
        { ciphertext: msg.content, nonce: msg.nonce },
        groupKey
      )
      return { ...msg, content: decrypted }
    } catch (err) {
      console.error('[EncryptedChat] Decryption failed:', err)
      return { ...msg, content: '🔒 Failed to decrypt', decryptionFailed: true }
    }
  }, [])

  // Load members for mentions
  const loadMembers = useCallback(async () => {
    if (!groupId) return
    
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        headers: { ...getAuthHeaders() }
      })
      if (res.ok) {
        const data = await res.json()
        setMembers(data.map((m: any) => ({
          id: m.userId || m.id,
          name: m.name || m.username || 'Unknown',
          username: m.username || m.name || 'unknown',
        })))
      }
    } catch (err) {
      console.error('[EncryptedChat] Failed to load members:', err)
    }
  }, [groupId])

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!roomId) return
    
    setLoading(true)
    try {
      // Get room details
      const roomRes = await fetch(`/api/chat/rooms/${roomId}`, {
        headers: { ...getAuthHeaders() }
      })
      if (roomRes.ok) {
        const roomData = await roomRes.json()
        setRoomEncrypted(roomData.encryptionEnabled || false)
        setKeyVersion(roomData.currentKeyVersion || 1)
      }

      // Get group key if needed
      await getGroupKey()

      // Fetch messages
      const res = await fetch(`/api/chat/${roomId}/messages?limit=100`, {
        headers: { ...getAuthHeaders() }
      })
      if (!res.ok) throw new Error('Failed to fetch messages')
      
      const data = await res.json()
      
      // Sort and decrypt
      const sorted = [...data].sort((a, b) => {
        const ta = new Date(a.createdAt).getTime()
        const tb = new Date(b.createdAt).getTime()
        return ta - tb
      })

      const decrypted = sorted.map(msg => decryptMessageContent(msg))
      setMessages(decrypted)
      
      scrollToBottom()
      
      // Mark last message as read
      if (data.length > 0) {
        const lastMsg = sorted[sorted.length - 1]
        if (lastMsg) {
          markAsRead(lastMsg.id)
        }
      }
    } catch (err) {
      console.error('[EncryptedChat] Load error:', err)
      toast({ title: 'Error', description: 'Failed to load messages', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [roomId, getGroupKey, decryptMessageContent, toast, markAsRead])

  // Load polls
  const loadPolls = useCallback(async () => {
    if (!roomId) return
    try {
      const res = await fetch(`/api/chat/${roomId}/polls`, {
        headers: { ...getAuthHeaders() }
      })
      if (res.ok) {
        const data = await res.json()
        setPolls(data)
      }
    } catch (err) {
      console.error('[EncryptedChat] Failed to load polls:', err)
    }
  }, [roomId])

  // Load members on mount
  useEffect(() => {
    loadMembers()
    loadPolls()
  }, [loadMembers, loadPolls])

  // Scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, 100)
  }

  // Handle GIF selection
  const handleGifSelect = async (gif: { url: string; thumbnailUrl: string; width: number; height: number; provider: string }) => {
    if (!user?.id) return

    const tempId = Date.now().toString()
    
    // Optimistic update
    const tempMsg: ChatMessage = {
      id: tempId,
      content: '',
      senderId: user.id,
      senderName: user.name || 'You',
      createdAt: new Date().toISOString(),
      pending: true,
      mediaType: 'gif',
      mediaUrl: gif.url,
      mediaThumbnail: gif.thumbnailUrl,
      mediaWidth: gif.width,
      mediaHeight: gif.height,
      mediaProvider: gif.provider,
    }
    setMessages(prev => [...prev, tempMsg])
    scrollToBottom()

    try {
      const res = await fetch(`/api/chat/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          content: '',
          mediaType: 'gif',
          mediaUrl: gif.url,
          mediaThumbnail: gif.thumbnailUrl,
          mediaWidth: gif.width,
          mediaHeight: gif.height,
          mediaProvider: gif.provider,
        }),
      })

      if (!res.ok) throw new Error('Failed to send')
      
      const msg = await res.json()
      setMessages(prev => prev.map(m => m.id === tempId ? { ...msg, mediaType: 'gif' } : m))
    } catch (err) {
      console.error('[EncryptedChat] GIF send error:', err)
      toast({ title: 'Error', description: 'Failed to send GIF', variant: 'destructive' })
      setMessages(prev => prev.filter(m => m.id !== tempId))
    }
  }

  // Handle poll creation
  const handleCreatePoll = async (pollData: {
    question: string
    options: string[]
    type: 'single' | 'multiple'
    anonymous: boolean
    endsAt?: string
  }) => {
    setCreatingPoll(true)
    try {
      const res = await fetch(`/api/chat/${roomId}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(pollData),
      })

      if (!res.ok) throw new Error('Failed to create poll')
      
      const poll = await res.json()
      setPolls(prev => [poll, ...prev])
      setShowCreatePoll(false)
      
      // Send a message about the poll
      await fetch(`/api/chat/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          content: `📊 Created a poll: "${pollData.question}"`,
          mediaType: 'poll',
          mediaUrl: poll.id,
        }),
      })
      
      toast({ title: 'Poll Created', description: 'Your poll is now live!' })
    } catch (err) {
      console.error('[EncryptedChat] Poll creation error:', err)
      toast({ title: 'Error', description: 'Failed to create poll', variant: 'destructive' })
    } finally {
      setCreatingPoll(false)
    }
  }

  // Handle poll vote
  const handlePollVote = async (pollId: string, optionId: string) => {
    try {
      await fetch(`/api/chat/${roomId}/polls/${pollId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ optionId }),
      })
      
      // Refresh polls
      loadPolls()
    } catch (err) {
      console.error('[EncryptedChat] Vote error:', err)
      toast({ title: 'Error', description: 'Failed to vote', variant: 'destructive' })
    }
  }

  // Handle poll close
  const handleClosePoll = async (pollId: string) => {
    try {
      await fetch(`/api/chat/${roomId}/polls/${pollId}`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders() },
      })
      
      loadPolls()
      toast({ title: 'Poll Closed' })
    } catch (err) {
      console.error('[EncryptedChat] Close poll error:', err)
    }
  }

  // Handle voice message recording complete
  const handleVoiceRecordingComplete = async (audioBlob: Blob, duration: number) => {
    if (!user?.id) return

    const tempId = Date.now().toString()
    
    // Optimistic update with temporary message
    const tempMsg: ChatMessage = {
      id: tempId,
      content: '🎤 Voice message',
      senderId: user.id,
      senderName: user.name || 'You',
      createdAt: new Date().toISOString(),
      pending: true,
      mediaType: 'audio',
      mediaUrl: URL.createObjectURL(audioBlob),
    }
    setMessages(prev => [...prev, tempMsg])
    scrollToBottom()
    setIsRecordingVoice(false)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob)
      formData.append('duration', duration.toString())

      const res = await fetch(`/api/chat/${roomId}/voice`, {
        method: 'POST',
        headers: { ...getAuthHeaders() },
        body: formData,
      })

      if (!res.ok) throw new Error('Failed to send voice message')
      
      const msg = await res.json()
      console.log('[EncryptedChat] Voice message response:', { 
        id: msg.id, 
        mediaType: msg.mediaType, 
        hasMediaUrl: !!msg.mediaUrl,
        mediaUrlLength: msg.mediaUrl?.length,
        mediaUrlPrefix: msg.mediaUrl?.substring(0, 50)
      })
      setMessages(prev => prev.map(m => m.id === tempId ? { ...msg, mediaType: 'audio' } : m))
      toast({ title: 'Voice message sent' })
    } catch (err) {
      console.error('[EncryptedChat] Voice message error:', err)
      toast({ title: 'Error', description: 'Failed to send voice message', variant: 'destructive' })
      setMessages(prev => prev.filter(m => m.id !== tempId))
    }
  }

  // Handle input change for typing indicator and mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setContent(value)
    
    // Typing indicator
    if (value.length > 0) {
      startTyping()
    } else {
      stopTyping()
    }
    
    // Check for @mention trigger
    const lastAtIndex = value.lastIndexOf('@')
    if (lastAtIndex !== -1) {
      const afterAt = value.slice(lastAtIndex + 1)
      // Show mention dropdown if @ is followed by letters/nothing
      if (/^[a-zA-Z0-9]*$/.test(afterAt) && afterAt.length < 20) {
        setMentionSearch(afterAt)
        setShowMentions(true)
        // Position near input
        setMentionPosition({ top: 50, left: 0 })
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }

  // Handle mention selection
  const handleMentionSelect = (member: GroupMember) => {
    const lastAtIndex = content.lastIndexOf('@')
    if (lastAtIndex !== -1) {
      const newContent = content.slice(0, lastAtIndex) + `@${member.username} `
      setContent(newContent)
    }
    setShowMentions(false)
    inputRef.current?.focus()
  }

  // Send message
  const onSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !content.trim()) return

    const plaintext = content.trim()
    const tempId = Date.now().toString()
    
    // Parse mentions
    const mentionedUserIds = parseMentions(plaintext, members)
    
    // Optimistic update
    const tempMsg: ChatMessage = {
      id: tempId,
      content: plaintext,
      senderId: user.id,
      senderName: user.name || 'You',
      createdAt: new Date().toISOString(),
      encrypted: roomEncrypted,
      pending: true,
      replyToId: replyingTo?.id,
      replyTo: replyingTo ? {
        id: replyingTo.id,
        senderId: replyingTo.senderId,
        senderName: replyingTo.senderName,
        content: replyingTo.content,
        encrypted: replyingTo.encrypted,
      } : null,
      reactions: {},
    }
    setMessages(prev => [...prev, tempMsg])
    setContent('')
    setReplyingTo(null)
    stopTyping()
    scrollToBottom()

    try {
      setSending(true)
      
      let body: any = { 
        content: plaintext,
        replyToId: replyingTo?.id,
        mentions: mentionedUserIds,
      }
      
      // Encrypt if room has E2EE enabled and we have the key
      if (roomEncrypted && crypto.isUnlocked) {
        const groupKey = await getGroupKey()
        if (groupKey) {
          const encrypted = encryptMessage(plaintext, groupKey)
          body = {
            ...body,
            content: encrypted.ciphertext,
            encrypted: true,
            nonce: encrypted.nonce,
            keyVersion,
          }
        }
      }

      const res = await fetch(`/api/chat/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Failed to send')
      
      const msg = await res.json()
      // Replace temp with real (already decrypted since we know the content)
      setMessages(prev => prev.map(m => 
        m.id === tempId ? { ...msg, content: plaintext } : m
      ))
    } catch (err) {
      console.error('[EncryptedChat] Send error:', err)
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' })
      setMessages(prev => prev.filter(m => m.id !== tempId))
    } finally {
      setSending(false)
    }
  }

  // Enable encryption for room
  const enableEncryption = async () => {
    if (!crypto.isUnlocked) {
      toast({ title: 'Unlock Required', description: 'Please unlock your encryption keys first' })
      return
    }

    try {
      // Generate new group key
      const groupKey = generateGroupKey()

      // Get all member public keys
      const keysRes = await fetch(`/api/crypto/room-keys/${roomId}`, {
        headers: { ...getAuthHeaders() }
      })
      if (!keysRes.ok) throw new Error('Failed to get member keys')
      
      const memberKeys = await keysRes.json()
      if (memberKeys.length === 0) {
        toast({ 
          title: 'Cannot Enable', 
          description: 'No members have encryption set up yet',
          variant: 'destructive'
        })
        return
      }

      // Wrap for each member
      const wrappedKeys = memberKeys.map((mk: { userId: string; publicKey: string }) => {
        const pubKey = base64ToPublicKey(mk.publicKey)
        const wrapped = sealGroupKey(groupKey, pubKey)
        return { userId: mk.userId, wrappedKey: wrapped }
      })

      // Upload wrapped keys
      const uploadRes = await fetch(`/api/crypto/group-keys/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ wrappedKeys, keyVersion: 1 }),
      })

      if (!uploadRes.ok) throw new Error('Failed to upload keys')

      // Enable encryption on room
      await fetch(`/api/chat/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ encryptionEnabled: true, currentKeyVersion: 1 }),
      })

      // Cache our key
      cacheGroupKey(roomId, groupKey, 1)
      groupKeyRef.current = groupKey
      
      setRoomEncrypted(true)
      setKeyVersion(1)
      
      toast({ title: 'Encryption Enabled', description: 'Messages in this room are now end-to-end encrypted' })
    } catch (err) {
      console.error('[EncryptedChat] Enable encryption error:', err)
      toast({ title: 'Error', description: 'Failed to enable encryption', variant: 'destructive' })
    }
  }

  // Upload public key to server
  const uploadPublicKey = useCallback(async () => {
    if (!crypto.publicKey || !crypto.fingerprint) return
    
    try {
      await fetch('/api/crypto/public-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          publicKey: crypto.publicKey,
          keyId: crypto.fingerprint,
        }),
      })
    } catch (err) {
      console.error('[EncryptedChat] Failed to upload public key:', err)
    }
  }, [crypto.publicKey, crypto.fingerprint])

  // Upload public key after setup/unlock
  useEffect(() => {
    if (crypto.isUnlocked && crypto.publicKey) {
      uploadPublicKey()
    }
  }, [crypto.isUnlocked, crypto.publicKey, uploadPublicKey])

  // Load messages on mount and when crypto state changes
  useEffect(() => {
    if (roomId) {
      loadMessages()
    }
  }, [roomId, crypto.isUnlocked, loadMessages])

  // Render encryption status in header
  const renderEncryptionStatus = () => {
    if (!roomEncrypted) {
      return (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <ShieldOff className="h-3 w-3" />
          Not encrypted
        </span>
      )
    }

    if (!crypto.isUnlocked) {
      return (
        <span className="flex items-center gap-1 text-xs text-amber-500">
          <Lock className="h-3 w-3" />
          Encrypted (locked)
        </span>
      )
    }

    return (
      <span className="flex items-center gap-1 text-xs text-green-500">
        <ShieldCheck className="h-3 w-3" />
        End-to-end encrypted
      </span>
    )
  }

  return (
    <div className="flex flex-col h-full max-h-full bg-background/50 backdrop-blur-sm rounded-2xl border border-border/50 shadow-sm overflow-hidden">
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
            {renderEncryptionStatus()}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Encryption controls */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <Shield className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!crypto.hasKeys ? (
                <DropdownMenuItem onClick={() => setShowSetupDialog(true)}>
                  <Key className="h-4 w-4 mr-2" />
                  Set Up Encryption
                </DropdownMenuItem>
              ) : !crypto.isUnlocked ? (
                <DropdownMenuItem onClick={() => setShowUnlockDialog(true)}>
                  <LockOpen className="h-4 w-4 mr-2" />
                  Unlock Keys
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => crypto.lock()}>
                    <Lock className="h-4 w-4 mr-2" />
                    Lock Keys
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowBackupDialog(true)}>
                    <Key className="h-4 w-4 mr-2" />
                    Backup Keys
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {!roomEncrypted && (
                    <DropdownMenuItem onClick={enableEncryption}>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Enable E2EE for Room
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
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

      {/* Pinned Messages */}
      {pinnedMessages.length > 0 && (
        <PinnedMessages
          messages={pinnedMessages}
          onUnpin={(messageId) => unpinMessage(messageId)}
          onJumpToMessage={(messageId) => {
            const el = document.getElementById(`message-${messageId}`)
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }}
          canUnpin={true} // TODO: Check if user is moderator
        />
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent" ref={scrollRef}>
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
            const prevMsg = messages[i - 1]
            const nextMsg = messages[i + 1]
            const showAvatar = !isMe && (!prevMsg || prevMsg.senderId !== m.senderId)
            const isLastInGroup = !nextMsg || nextMsg.senderId !== m.senderId
            const isFirstInGroup = !prevMsg || prevMsg.senderId !== m.senderId
            
            // Date separator logic
            const msgDate = new Date(m.createdAt)
            const prevMsgDate = prevMsg ? new Date(prevMsg.createdAt) : null
            const showDateSeparator = !prevMsgDate || 
              msgDate.toDateString() !== prevMsgDate.toDateString()
            
            const formatDate = (date: Date) => {
              const today = new Date()
              const yesterday = new Date(today)
              yesterday.setDate(yesterday.getDate() - 1)
              
              if (date.toDateString() === today.toDateString()) return 'Today'
              if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
              return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
            }
            
            return (
              <div key={m.id || i}>
                {/* Date separator */}
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-4">
                    <div className="px-3 py-1 rounded-full bg-muted/50 text-xs text-muted-foreground font-medium">
                      {formatDate(msgDate)}
                    </div>
                  </div>
                )}
                
                <div 
                  id={`message-${m.id}`}
                  className={cn(
                    "flex gap-2 max-w-[85%] group",
                    isMe ? "ml-auto flex-row-reverse" : "",
                    isFirstInGroup ? "mt-3" : "mt-0.5"
                  )}
                >
                  {!isMe && (
                    <div className="w-8 flex-shrink-0 flex flex-col justify-end">
                      {isLastInGroup ? (
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px] bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary font-semibold">
                            {m.senderName?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : <div className="w-7" />}
                    </div>
                  )}
                
                <div className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                  {!isMe && isFirstInGroup && (
                    <span className="text-[11px] font-medium text-muted-foreground ml-1 mb-0.5">{m.senderName}</span>
                  )}
                  
                  {/* Reply indicator */}
                  {m.replyTo && (
                    <InlineReply
                      replyTo={m.replyTo}
                      onClick={() => {
                        const el = document.getElementById(`message-${m.replyToId}`)
                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }}
                    />
                  )}
                  
                  <div className="relative">
                    <div
                      className={cn(
                        "px-3.5 py-2 text-[14px] relative transition-all",
                        isMe 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted/60 border border-border/30",
                        // Rounded corners based on position in group
                        isMe ? (
                          isFirstInGroup && isLastInGroup ? "rounded-2xl rounded-br-md" :
                          isFirstInGroup ? "rounded-2xl rounded-br-md" :
                          isLastInGroup ? "rounded-2xl rounded-tr-md" :
                          "rounded-2xl rounded-r-md"
                        ) : (
                          isFirstInGroup && isLastInGroup ? "rounded-2xl rounded-bl-md" :
                          isFirstInGroup ? "rounded-2xl rounded-bl-md" :
                          isLastInGroup ? "rounded-2xl rounded-tl-md" :
                          "rounded-2xl rounded-l-md"
                        ),
                        m.decryptionFailed && "opacity-70",
                        m.mediaType === 'gif' && "p-1 !rounded-2xl overflow-hidden",
                        m.mediaType === 'audio' && "p-2 min-w-[200px]"
                      )}
                    >
                      {/* GIF Message */}
                      {m.mediaType === 'gif' && m.mediaUrl ? (
                        <GifMessage
                          url={m.mediaUrl}
                          thumbnailUrl={m.mediaThumbnail}
                          width={m.mediaWidth}
                          height={m.mediaHeight}
                        />
                      ) : m.mediaType === 'audio' && m.mediaUrl ? (
                        /* Voice Message */
                        <VoicePlayer
                          src={m.mediaUrl}
                          isOwnMessage={isMe}
                        />
                      ) : m.mediaType === 'poll' && m.mediaUrl ? (
                        /* Poll Message - just show the text, poll is displayed separately */
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          <span>{m.content}</span>
                        </div>
                      ) : m.mediaType === 'space' ? (
                        /* Space Message */
                        <div className="flex items-center gap-2">
                          <Radio className="h-4 w-4" />
                          <span>{m.content}</span>
                        </div>
                      ) : (
                        /* Regular text message with highlighted mentions */
                        <HighlightedText 
                          text={m.content} 
                          className={isMe ? "text-primary-foreground" : ""}
                        />
                      )}
                    </div>
                    
                    {/* Message actions (hover) */}
                    <div className={cn(
                      "absolute -top-1 flex items-center gap-0.5 p-1 rounded-lg bg-background/90 border border-border/50 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity",
                      isMe ? "left-0 -translate-x-full mr-1" : "right-0 translate-x-full ml-1"
                    )}>
                      <ReactionPicker
                        onSelect={(emoji) => {
                          if (m.id) toggleReaction(m.id, emoji)
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full hover:bg-background/80"
                        onClick={() => setReplyingTo(m)}
                        title="Reply"
                      >
                        <Reply className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full hover:bg-background/80"
                        onClick={() => {
                          if (m.id) pinMessage(m.id)
                        }}
                        title="Pin message"
                      >
                        <Pin className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Reactions display */}
                  {m.reactions && Object.keys(m.reactions).length > 0 && (
                    <MessageReactions
                      reactions={m.reactions}
                      currentUserId={user?.id || ''}
                      onToggle={(emoji) => {
                        if (m.id) toggleReaction(m.id, emoji)
                      }}
                    />
                  )}
                  
                  {/* Timestamp - only show for last message in group */}
                  {isLastInGroup && (
                    <div className="flex items-center gap-1 px-1 mt-0.5">
                      <span className="text-[10px] text-muted-foreground/60">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {m.pending && <Loader2 className="h-2 w-2 animate-spin text-muted-foreground" />}
                      {m.encrypted && !m.decryptionFailed && (
                        <Lock className="h-2.5 w-2.5 text-muted-foreground/50" />
                      )}
                    </div>
                  )}
                </div>
              </div>
              </div>
            )
          })
        )}
      </div>

      {/* Encryption Banner (if room is encrypted but keys locked) */}
      {roomEncrypted && !crypto.isUnlocked && (
        <div className="px-4 py-2 bg-amber-500/10 border-t border-amber-500/20 flex items-center justify-between">
          <span className="text-sm text-amber-600 dark:text-amber-400">
            <Lock className="inline h-4 w-4 mr-1" />
            Messages are encrypted. Unlock to read and send.
          </span>
          <Button size="sm" variant="outline" onClick={() => {
            if (crypto.hasKeys) {
              setShowUnlockDialog(true)
            } else {
              setShowSetupDialog(true)
            }
          }}>
            {crypto.hasKeys ? 'Unlock' : 'Set Up'}
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-background/80 backdrop-blur-md border-t border-border/50">
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator users={typingUsers} />
        )}
        
        {/* Reply preview */}
        {replyingTo && (
          <ReplyPreview
            message={replyingTo}
            onCancel={() => setReplyingTo(null)}
          />
        )}
        
        {/* Voice Recording UI */}
        {isRecordingVoice && (
          <div className="mb-2">
            <VoiceRecorder
              onRecordingComplete={handleVoiceRecordingComplete}
              onCancel={() => setIsRecordingVoice(false)}
            />
          </div>
        )}
        
        <form onSubmit={onSend} className="flex items-center gap-2 relative">
          {/* Mention autocomplete */}
          {showMentions && members.length > 0 && (
            <MentionAutocomplete
              members={members}
              searchTerm={mentionSearch}
              position={mentionPosition}
              onSelect={handleMentionSelect}
              onClose={() => setShowMentions(false)}
            />
          )}
          
          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <GifPicker 
              onSelect={handleGifSelect}
              trigger={
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-full"
                  disabled={roomEncrypted && !crypto.isUnlocked}
                  title="Send GIF"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              }
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-9 w-9 rounded-full"
              onClick={() => setShowCreatePoll(true)}
              disabled={roomEncrypted && !crypto.isUnlocked}
              title="Create Poll"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-9 w-9 rounded-full"
              onClick={() => setShowStartSpace(true)}
              title="Start Space"
            >
              <Radio className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className={cn(
                "h-9 w-9 rounded-full",
                isRecordingVoice && "text-red-500 bg-red-500/10"
              )}
              onClick={() => setIsRecordingVoice(!isRecordingVoice)}
              disabled={roomEncrypted && !crypto.isUnlocked}
              title="Voice message"
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={content}
              onChange={handleInputChange}
              placeholder={roomEncrypted ? "Type an encrypted message..." : "Type a message..."}
              className="w-full h-11 pl-4 pr-12 rounded-full bg-muted/40 border-0 focus-visible:ring-1 focus-visible:ring-primary/30 placeholder:text-muted-foreground/50"
              disabled={sending || (roomEncrypted && !crypto.isUnlocked) || isRecordingVoice}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!content.trim() || sending || (roomEncrypted && !crypto.isUnlocked) || isRecordingVoice}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary hover:bg-primary/90 transition-all shadow-sm"
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </form>
      </div>

      {/* Dialogs */}
      <SetupEncryptionDialog
        open={showSetupDialog}
        onOpenChange={setShowSetupDialog}
        onSetup={crypto.setupEncryption}
      />
      
      <UnlockKeysDialog
        open={showUnlockDialog}
        onOpenChange={setShowUnlockDialog}
        onUnlock={crypto.unlock}
        fingerprint={crypto.fingerprint}
      />
      
      <KeyBackupDialog
        open={showBackupDialog}
        onOpenChange={setShowBackupDialog}
        onExport={crypto.exportKeys}
        onImport={crypto.importKeys}
        fingerprint={crypto.fingerprint}
      />
      
      {/* Poll Dialog */}
      <CreatePollDialog
        open={showCreatePoll}
        onOpenChange={setShowCreatePoll}
        onSubmit={handleCreatePoll}
        isSubmitting={creatingPoll}
      />
      
      {/* Start Space Dialog */}
      <StartSpaceDialog
        open={showStartSpace}
        onOpenChange={setShowStartSpace}
        roomName={title}
        groupId={groupId}
        roomId={roomId}
      />
    </div>
  )
}

export default EncryptedChatInterface
