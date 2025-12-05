// User Level type
export type UserLevel = "Novice" | "Learner" | "Collaborator" | "Expert" | "Master"

// User Leveling System
export interface UserLevelData {
  userId: string
  currentLevel: UserLevel
  totalPoints: number
  totalEventsAttended: number
  totalSquadsCreated: number
  totalMessagesCount: number
  loginStreak: number
  achievements: Achievement[]
}

// Achievement
export interface Achievement {
  id: string
  name: string
  description: string
  unlockedAt: Date
}

// User Preferences
export interface UserPreferences {
  userId: string
  interests: string[]
  preferredEventTypes: string[]
  preferredSquadTopics?: string[]
  notificationFrequency: "instant" | "daily" | "weekly" | "none"
  discoveryEnabled: boolean
  lastUpdated?: Date
}

// Chat Room
export interface ChatRoom {
  id: string
  groupId: string
  name: string
  topic?: string
  members: string[]
  messageCount: number
  createdAt: Date
  lastMessageDate?: Date
  // E2EE fields
  encryptionEnabled?: boolean
  currentKeyVersion?: number
  // Unread tracking
  unreadCount?: number
  lastReadMessageId?: string
}

// Chat Message
export interface ChatMessage {
  id: string
  chatRoomId: string
  senderId: string
  senderName: string
  senderLevel: UserLevel
  content: string
  reactions: Record<string, string[]>  // emoji -> userId[]
  createdAt: Date
  // E2EE fields
  encrypted?: boolean
  nonce?: string | null
  keyVersion?: number
  // Reply/Threading
  replyToId?: string | null
  replyTo?: ChatMessageReply | null
  // Mentions
  mentions?: string[]  // userId[]
  // Media fields (GIF, image, video, etc.)
  mediaType?: 'gif' | 'image' | 'video' | 'audio' | 'file' | 'poll' | 'space' | null
  mediaUrl?: string | null
  mediaThumbnail?: string | null
  mediaWidth?: number | null
  mediaHeight?: number | null
  mediaProvider?: string | null
  pollId?: string | null
}

// Reply preview (minimal message data for displaying replies)
export interface ChatMessageReply {
  id: string
  senderId: string
  senderName: string
  content: string  // truncated
  encrypted?: boolean
}

// Message Reaction
export interface MessageReaction {
  id: string
  messageId: string
  userId: string
  emoji: string
  createdAt: Date
}

// Typing Indicator
export interface TypingIndicator {
  userId: string
  userName: string
  chatRoomId: string
  startedAt: Date
}

// Pinned Message
export interface PinnedMessage {
  id: string
  chatRoomId: string
  messageId: string
  pinnedBy: string
  pinnedAt: Date
  message?: ChatMessage
}

// Notification
export interface Notification {
  id: string
  userId: string
  type: "level-up" | "interest-match" | "event-reminder" | "squad-invite" | "message" | "mention" | "space-started" | "space-invitation" | "hand-raised"
  title: string
  message: string
  read: boolean
  actionUrl?: string
  createdAt: Date
  relatedId?: string
}

// Squad/Group
export interface Squad {
  id: string
  name: string
  description: string
  creatorId: string
  members: string[]
  interests: string[]
  image?: string
  createdAt: Date
  memberCount: number
  chatRooms: ChatRoom[]
  privacy?: GroupPrivacy
  location?: string
}

// User Profile
export interface UserProfile {
  id: string
  name: string
  username: string
  role?: "user" | "admin"
  email?: string
  studentId?: string
  avatar?: string
  bio?: string
  major?: string
  year?: string
  topics?: string[]
  squads: string[]
  createdAt: Date
  updatedAt?: Date
}

// Group/Community metadata
export type GroupPrivacy = "public" | "invite-only" | "private"

export interface Group {
  id: string
  title: string
  description: string
  ownerId: string
  privacy: GroupPrivacy
  topics: string[]
  location?: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
  memberCount: number
  activeSpaces?: Space[]          // Currently live spaces in this group
  spaceSettings?: {
    enabled: boolean              // Can members create spaces?
    whoCanCreate: "owner" | "moderators" | "all-members"
    defaultMaxParticipants: number
  }
}

export type GroupRole = "owner" | "moderator" | "member"

export interface GroupMember {
  id: string
  groupId: string
  userId: string
  role: GroupRole
  joinedAt: Date
}

export interface Session {
  id: string
  title: string
  description: string
  hostId: string
  groupId?: string
  location: string
  startAt: Date
  endAt: Date
  capacity?: number
  privacy: "public" | "invite-only"
  createdAt: Date
  updatedAt: Date
}

export interface RSVP {
  id: string
  sessionId: string
  userId: string
  status: "yes" | "no" | "maybe"
  createdAt: Date
  updatedAt: Date
}

export interface GroupMessage {
  id: string
  groupId?: string
  sessionId?: string
  senderId: string
  content: string
  replyToId?: string
  createdAt: Date
  updatedAt: Date
}

// Re-export all space types from spaces.ts
export * from './spaces'
