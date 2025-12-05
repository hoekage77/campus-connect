/**
 * API Client - Centralized API calls for Campus Connect
 * All new API routes are accessible through these functions
 */

// ============================================================================
// GROUPS/SQUADS API
// ============================================================================

export interface GroupData {
  id: string
  title: string
  description: string
  ownerId: string
  privacy: string
  topics: string[]
  location?: string
  avatar?: string
  category?: string
  createdAt: string
  updatedAt: string
  memberCount: number
  members?: Array<{
    id: string
    userId: string
    role: "owner" | "member" | "moderator"
    user?: {
      id: string
      name: string
      username: string
      email?: string
      avatar?: string
    }
  }>
  creator?: {
    id: string
    name: string
    username: string
    avatar?: string
  }
  chatRooms?: Array<{
    id: string
    name: string
    topic?: string
  }>
  isMember?: boolean
}

/**
 * Get all public groups
 */
import { getAuthHeaders } from "@/lib/auth"

export async function getAllGroups(): Promise<GroupData[]> {
  const response = await fetch("/api/groups", { cache: "no-store", headers: { ...getAuthHeaders() } })
  if (!response.ok) throw new Error("Failed to fetch groups")
  const data = await response.json()
  return Array.isArray(data) ? data : data.groups || []
}

/**
 * Get a specific group by ID
 */
export async function getGroup(groupId: string): Promise<GroupData> {
  const timestamp = Date.now()
  const response = await fetch(`/api/groups/${groupId}?_t=${timestamp}`, { cache: "no-store" })
  if (!response.ok) throw new Error("Failed to fetch group")
  const data = await response.json()
  console.log('[API] getGroup response:', { groupId, memberCount: data.members?.length, members: data.members })
  return data
}

/**
 * Create a new group
 */
export async function createGroup(input: {
  title: string
  description: string
  topics: string[]
  privacy?: string
  location?: string
}): Promise<GroupData> {
  const userId = localStorage.getItem("userId")
  console.log("[API] createGroup called", { input, userId })

  if (!userId || userId === 'undefined' || userId === 'null') {
    throw new Error(`User ID not found or invalid in localStorage: ${userId}`)
  }

  try {
    const response = await fetch("/api/groups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[API] Error response:", errorData)
      
      // Parse Zod validation errors
      if (errorData.details && Array.isArray(errorData.details.issues)) {
        const issues = errorData.details.issues
        const messages = issues.map((issue: any) => {
          const field = issue.path?.[0] || 'Field'
          return `${field}: ${issue.message}`
        }).join('\n')
        throw new Error(`Validation Error:\n${messages}`)
      }
      
      throw new Error(errorData.error || errorData.message || "Failed to create group")
    }

    const data = await response.json()
    console.log("[API] createGroup success:", data)
    return data
  } catch (error) {
    console.error("[API] createGroup error:", error)
    throw error
  }
}

/**
 * Join a group
 */
export async function joinGroup(groupId: string, userId?: string): Promise<GroupData> {
  // Use provided userId or fallback to localStorage
  const effectiveUserId = userId || localStorage.getItem("userId")
  console.log("[API] joinGroup called", { groupId, userId: effectiveUserId, userIdType: typeof effectiveUserId })

  if (!effectiveUserId || effectiveUserId === 'undefined' || effectiveUserId === 'null') {
    console.error("[API] Invalid userId:", effectiveUserId)
    throw new Error("User ID not found. Please log in again.")
  }

  try {
    const authHeaders = getAuthHeaders()
    const requestBody = { userId: effectiveUserId }
    console.log("[API] Sending fetch request:", { 
      groupId, 
      userId: effectiveUserId, 
      headers: authHeaders,
      body: requestBody 
    })
    const response = await fetch(`/api/groups/${groupId}/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(requestBody),
    })
    console.log("[API] Fetch response received, status:", response.status)

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[API] Error response:", errorData)
      throw new Error(errorData.error || errorData.message || "Failed to join group")
    }

    const data = await response.json()
    console.log("[API] joinGroup success, data:", data)
    return data
  } catch (error) {
    console.error("[API] joinGroup error:", error)
    throw error
  }
}

/**
 * Leave a group
 */
export async function leaveGroup(groupId: string, userId?: string): Promise<{ success: boolean }> {
  // Use provided userId or fallback to localStorage
  const effectiveUserId = userId || localStorage.getItem("userId")
  console.log("[API] leaveGroup called", { groupId, userId: effectiveUserId })

  if (!effectiveUserId || effectiveUserId === 'undefined' || effectiveUserId === 'null') {
    throw new Error("User ID not found. Please log in again.")
  }

  try {
    console.log("[API] Sending DELETE fetch request...")
    const response = await fetch(`/api/groups/${groupId}/members`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": effectiveUserId,
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ userId: effectiveUserId }),
    })
    console.log("[API] Fetch response received, status:", response.status)

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[API] Error response:", errorData)
      throw new Error(errorData.error || errorData.message || "Failed to leave group")
    }

    const data = await response.json()
    console.log("[API] leaveGroup success, data:", data)
    return data
  } catch (error) {
    console.error("[API] leaveGroup error:", error)
    throw error
  }
}

/**
 * Create a chat room in a group (admin only)
 */
export async function createGroupChatRoom(
  groupId: string,
  input: {
    name: string
    topic?: string
  }
): Promise<{
  id: string
  groupId: string
  name: string
  topic?: string
  members: string[]
  messageCount: number
  createdAt: string
}> {
  const response = await fetch(`/api/groups/${groupId}/chatrooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || "Failed to create chat room")
  }
  return response.json()
}

// ============================================================================
// CHAT API
// ============================================================================

export interface ChatRoom {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  messageCount?: number;
  lastMessageDate?: string;
}

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName: string;
  senderLevel: string;
  content: string;
  timestamp: string;
  reactions?: Record<string, string[]>;
  edited?: boolean;
}

/**
 * Get all chat rooms for a group
 */
export async function getChatRooms(groupId: string): Promise<ChatRoom[]> {
  const response = await fetch(`/api/chat/rooms?groupId=${groupId}` , {
    headers: { ...getAuthHeaders() },
    cache: 'no-store'
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch chat rooms (${response.status})`);
  }
  return response.json();
}

/**
 * Create a new chat room in a group
 */
export async function createChatRoom(
  groupId: string,
  name: string,
  type: 'general' | 'resources' | 'announcements' | 'custom' = 'custom'
): Promise<ChatRoom> {
  const response = await fetch('/api/chat/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ groupId, name, type }),
  });
  if (!response.ok) throw new Error('Failed to create chat room');
  return response.json();
}

// ============================================================================
// GROUP SESSIONS API
// ============================================================================

export interface SessionData {
  id: string
  title: string
  description: string
  hostId: string
  groupId?: string
  location: string
  startAt: string
  endAt: string
  capacity?: number
  privacy: 'public' | 'invite-only'
  createdAt: string
  updatedAt: string
}

export async function getGroupSessions(groupId: string): Promise<SessionData[]> {
  const res = await fetch(`/api/groups/${groupId}/sessions`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch group sessions')
  return res.json()
}

export async function createGroupSession(
  groupId: string,
  input: Omit<SessionData, 'id' | 'createdAt' | 'updatedAt' | 'hostId' | 'groupId'> & { privacy?: 'public' | 'invite-only' }
): Promise<SessionData> {
  const res = await fetch(`/api/groups/${groupId}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ ...input }),
  })
  if (!res.ok) {
    let d: any = {}
    try { d = await res.json() } catch {}
    throw new Error(d?.error || 'Failed to create session')
  }
  return res.json()
}

/**
 * Get messages from a chat room
 */
export async function getChatMessages(
  roomId: string,
  limit = 50,
  offset = 0
): Promise<ChatMessage[]> {
  const response = await fetch(
    `/api/chat/${roomId}/messages?limit=${limit}&offset=${offset}`,
    { headers: { ...getAuthHeaders() }, cache: 'no-store' }
  );
  if (!response.ok) throw new Error('Failed to fetch messages');
  return response.json();
}

/**
 * Send a message to a chat room
 */
export async function sendChatMessage(
  roomId: string,
  senderId: string,
  content: string
): Promise<ChatMessage> {
  const response = await fetch(`/api/chat/${roomId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    let details: any = {}
    try { details = await response.json() } catch {}
    const msg = details?.error || details?.message || `Failed to send message (status ${response.status})`
    throw new Error(msg)
  }
  return response.json();
}

// ============================================================================
// USER LEVEL & ACTIVITY API
// ============================================================================

export interface UserLevelStats {
  userId: string;
  currentLevel: string;
  totalPoints: number;
  pointsThisWeek: number;
  totalEventsAttended?: number;
  totalSquadsCreated?: number;
  totalMessagesCount?: number;
  progress?: {
    currentLevel: string;
    currentPoints: number;
    nextLevelAt: number;
    progressPercent: number;
  };
  rank?: number;
}

/**
 * Get comprehensive level statistics for a user
 */
export async function getUserLevelStats(userId: string): Promise<UserLevelStats> {
  const response = await fetch(`/api/users/${userId}/level/stats`);
  if (!response.ok) throw new Error('Failed to fetch level stats');
  return response.json();
}

/**
 * Track user activity and award points
 */
export async function trackUserActivity(
  userId: string,
  type: string,
  points: number
): Promise<UserLevelStats> {
  const response = await fetch(`/api/users/${userId}/activity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, points }),
  });
  if (!response.ok) throw new Error('Failed to track activity');
  return response.json();
}

// ============================================================================
// LEADERBOARD API
// ============================================================================

export interface LeaderboardEntry {
  userId: string;
  currentLevel: string;
  totalPoints: number;
  pointsThisWeek: number;
  totalEventsAttended?: number;
  totalSquadsCreated?: number;
  totalMessagesCount?: number;
  rank?: number;
}

/**
 * Get global leaderboard
 */
export async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const response = await fetch(`/api/leaderboard?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch leaderboard');
  return response.json();
}

// ============================================================================
// PREFERENCES API
// ============================================================================

export interface UserPreferences {
  userId: string;
  interests: string[];
  preferredEventTypes: string[];
  preferredSquadTopics: string[];
  notificationFrequency: 'instant' | 'daily' | 'weekly' | 'none';
  discoveryEnabled: boolean;
  lastUpdated?: string;
}

/**
 * Get user preferences
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const response = await fetch(`/api/users/${userId}/preferences`);
  if (!response.ok) throw new Error('Failed to fetch preferences');
  return response.json();
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<UserPreferences> {
  const response = await fetch(`/api/users/${userId}/preferences`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'x-user-id': userId, // Authentication
    },
    body: JSON.stringify(preferences),
  });
  if (!response.ok) throw new Error('Failed to update preferences');
  return response.json();
}

// ============================================================================
// INTERESTS API
// ============================================================================

/**
 * Get list of available interests
 */
export async function getAvailableInterests(): Promise<string[]> {
  const response = await fetch('/api/interests');
  if (!response.ok) throw new Error('Failed to fetch interests');
  return response.json();
}

// ============================================================================
// NOTIFICATIONS API
// ============================================================================

import type { Notification as AppNotification } from "@/types"

/**
 * Get notifications for a user
 */
export async function getUserNotifications(userId: string, limit = 50, offset = 0): Promise<AppNotification[]> {
  if (!userId) throw new Error('User ID is required for notifications');
  const response = await fetch(`/api/notifications/${userId}?limit=${limit}&offset=${offset}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to fetch notifications');
  return response.json();
}

// ============================================================================
// ACTIVITY TRACKING HELPERS
// ============================================================================

/**
 * Track common activities with predefined point values
 */
export const ActivityTracker = {
  /**
   * Track when user sends a message (auto-tracked by sendChatMessage, but can be used separately)
   */
  messageSent: (userId: string) => trackUserActivity(userId, 'message', 1),

  /**
   * Track when user attends a study session
   */
  sessionAttended: (userId: string) => trackUserActivity(userId, 'session_attended', 10),

  /**
   * Track when user creates a group
   */
  groupCreated: (userId: string) => trackUserActivity(userId, 'group_created', 15),

  /**
   * Track when user joins a group
   */
  groupJoined: (userId: string) => trackUserActivity(userId, 'group_joined', 5),

  /**
   * Track daily login
   */
  dailyLogin: (userId: string) => trackUserActivity(userId, 'login', 2),

  /**
   * Track profile completion
   */
  profileCompleted: (userId: string) => trackUserActivity(userId, 'profile_completed', 20),

  /**
   * Custom activity tracking
   */
  custom: (userId: string, activityType: string, points: number) =>
    trackUserActivity(userId, activityType, points),
};
