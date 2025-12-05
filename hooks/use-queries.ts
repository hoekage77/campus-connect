import { useCallback, useState, useEffect } from "react"
import {
  getAllGroups,
  getGroup,
  createGroup,
  joinGroup,
  leaveGroup,
  // createGroupChatRoom, // replaced by chat API below
  getChatRooms,
  createChatRoom,
  getUserLevelStats,
  getUserPreferences,
  updateUserPreferences,
  getLeaderboard,
  getUserNotifications,
  type GroupData,
} from "@/lib/api-client"

// ============================================================================
// QUERY HOOKS - Reusable hooks for common queries
// ============================================================================

export interface UseQueryState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
}

/**
 * Hook to fetch all groups
 */
export function useAllGroups() {
  const [state, setState] = useState<UseQueryState<GroupData[]>>({
    data: null,
    isLoading: false,
    error: null,
  })

  const fetch = useCallback(async () => {
    setState({ data: null, isLoading: true, error: null })
    try {
  const data = await getAllGroups()
  if (process.env.NODE_ENV === 'development') console.debug('[useAllGroups] groups fetched', data)
      setState({ data, isLoading: false, error: null })
      return data
    } catch (err) {
      const error = err instanceof Error ? err.message : "Failed to fetch groups"
      setState({ data: null, isLoading: false, error })
      throw err
    }
  }, [])

  // Automatically fetch on mount
  useEffect(() => {
    fetch()
  }, [fetch])

  return { ...state, fetch }
}

/**
 * Hook to fetch a single group
 */
export function useGroup(groupId: string | null) {
  const [state, setState] = useState<UseQueryState<GroupData>>({
    data: null,
    isLoading: false,
    error: null,
  })

  const fetch = useCallback(async () => {
    if (!groupId) {
      setState({ data: null, isLoading: false, error: null })
      return
    }

    setState({ data: null, isLoading: true, error: null })
    try {
      const data = await getGroup(groupId)
      setState({ data, isLoading: false, error: null })
      return data
    } catch (err) {
      const error = err instanceof Error ? err.message : "Failed to fetch group"
      setState({ data: null, isLoading: false, error })
      throw err
    }
  }, [groupId])

  // Automatically fetch when groupId changes
  useEffect(() => {
    fetch()
  }, [groupId, fetch])

  return { ...state, fetch }
}

/**
 * Hook to create a group
 */
export function useCreateGroup() {
  const [state, setState] = useState<UseQueryState<GroupData>>({
    data: null,
    isLoading: false,
    error: null,
  })

  const mutate = useCallback(
    async (input: {
      title: string
      description: string
      topics: string[]
      privacy?: string
      location?: string
    }) => {
      setState({ data: null, isLoading: true, error: null })
      try {
        const data = await createGroup(input)
        setState({ data, isLoading: false, error: null })
        return data
      } catch (err) {
        const error = err instanceof Error ? err.message : "Failed to create group"
        setState({ data: null, isLoading: false, error })
        throw err
      }
    },
    []
  )

  return { ...state, mutate }
}

/**
 * Hook to join a group
 */
export function useJoinGroup() {
  const [state, setState] = useState<UseQueryState<GroupData>>({
    data: null,
    isLoading: false,
    error: null,
  })

  const mutate = useCallback(async (groupId: string, userId?: string) => {
    setState({ data: null, isLoading: true, error: null })
    try {
      const data = await joinGroup(groupId, userId)
      setState({ data, isLoading: false, error: null })
      return data
    } catch (err) {
      const error = err instanceof Error ? err.message : "Failed to join group"
      setState({ data: null, isLoading: false, error })
      throw err
    }
  }, [])

  return { ...state, mutate }
}

/**
 * Hook to leave a group
 */
export function useLeaveGroup() {
  const [state, setState] = useState<UseQueryState<{ success: boolean }>>({
    data: null,
    isLoading: false,
    error: null,
  })

  const mutate = useCallback(async (groupId: string, userId?: string) => {
    setState({ data: null, isLoading: true, error: null })
    try {
      const data = await leaveGroup(groupId, userId)
      setState({ data, isLoading: false, error: null })
      return data
    } catch (err) {
      const error = err instanceof Error ? err.message : "Failed to leave group"
      setState({ data: null, isLoading: false, error })
      throw err
    }
  }, [])

  return { ...state, mutate }
}

/**
 * Hook to create a chat room
 */
export function useCreateChatRoom() {
  const [state, setState] = useState<UseQueryState<any>>({
    data: null,
    isLoading: false,
    error: null,
  })

  const mutate = useCallback(
    async (groupId: string, input: { name: string; type?: 'general' | 'resources' | 'announcements' | 'custom' }) => {
      setState({ data: null, isLoading: true, error: null })
      try {
        const data = await createChatRoom(groupId, input.name, input.type ?? 'custom')
        setState({ data, isLoading: false, error: null })
        return data
      } catch (err) {
        const error = err instanceof Error ? err.message : "Failed to create chat room"
        setState({ data: null, isLoading: false, error })
        throw err
      }
    },
    []
  )

  return { ...state, mutate }
}

/**
 * Hook to fetch chat rooms for a group
 */
export function useChatRooms(groupId: string | null) {
  const [state, setState] = useState<UseQueryState<any[]>>({
    data: null,
    isLoading: false,
    error: null,
  })

  const fetch = useCallback(async () => {
    if (!groupId) {
      setState({ data: null, isLoading: false, error: null })
      return
    }

    setState({ data: null, isLoading: true, error: null })
    try {
      const rooms = await getChatRooms(groupId)
      setState({ data: rooms, isLoading: false, error: null })
      return rooms
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to fetch chat rooms'
      console.error('useChatRooms error:', error)
      setState({ data: null, isLoading: false, error })
      // Don't re-throw - error is captured in state
    }
  }, [groupId])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { ...state, fetch }
}

/**
 * Hook to fetch user level stats
 */
export function useUserLevelStats(userId: string | null) {
  const [state, setState] = useState<UseQueryState<any>>({
    data: null,
    isLoading: true,
    error: null,
  })

  const fetch = useCallback(async () => {
    if (!userId) {
      setState({ data: null, isLoading: false, error: null })
      return
    }

    setState((prev) => ({ ...prev, isLoading: true }))
    try {
      const data = await getUserLevelStats(userId)
      setState({ data, isLoading: false, error: null })
      return data
    } catch (err) {
      const error = err instanceof Error ? err.message : "Failed to fetch level stats"
      setState({ data: null, isLoading: false, error })
      throw err
    }
  }, [userId])

  // Auto-fetch on mount and when userId changes
  useEffect(() => {
    fetch()
  }, [userId, fetch])

  return { ...state, fetch }
}

/**
 * Hook to fetch user preferences
 */
export function useUserPreferences(userId: string | null) {
  const [state, setState] = useState<UseQueryState<any>>({
    data: null,
    isLoading: true,
    error: null,
  })

  const fetch = useCallback(async () => {
    if (!userId) {
      setState({ data: null, isLoading: false, error: null })
      return
    }

    setState((prev) => ({ ...prev, isLoading: true }))
    try {
      const data = await getUserPreferences(userId)
      setState({ data, isLoading: false, error: null })
      return data
    } catch (err) {
      const error = err instanceof Error ? err.message : "Failed to fetch preferences"
      setState({ data: null, isLoading: false, error })
      throw err
    }
  }, [userId])

  // Auto-fetch on mount and when userId changes
  useEffect(() => {
    fetch()
  }, [userId, fetch])

  return { ...state, fetch }
}

/**
 * Hook to update user preferences
 */
export function useUpdateUserPreferences() {
  const [state, setState] = useState<UseQueryState<any>>({
    data: null,
    isLoading: false,
    error: null,
  })

  const mutate = useCallback(async (userId: string, preferences: any) => {
    setState({ data: null, isLoading: true, error: null })
    try {
      const data = await updateUserPreferences(userId, preferences)
      setState({ data, isLoading: false, error: null })
      return data
    } catch (err) {
      const error = err instanceof Error ? err.message : "Failed to update preferences"
      setState({ data: null, isLoading: false, error })
      throw err
    }
  }, [])

  return { ...state, mutate }
}

/**
 * Hook to fetch leaderboard
 */
export function useLeaderboard(limit = 50) {
  const [state, setState] = useState<UseQueryState<any[]>>({
    data: null,
    isLoading: false,
    error: null,
  })

  const fetch = useCallback(async () => {
    setState({ data: null, isLoading: true, error: null })
    try {
      const data = await getLeaderboard(limit)
      setState({ data, isLoading: false, error: null })
      return data
    } catch (err) {
      const error = err instanceof Error ? err.message : "Failed to fetch leaderboard"
      setState({ data: null, isLoading: false, error })
      throw err
    }
  }, [limit])

  return { ...state, fetch }
}

/**
 * Hook to fetch user notifications
 */
export function useUserNotifications(userId: string | null, limit = 50) {
  const [state, setState] = useState<UseQueryState<any[]>>({
    data: null,
    isLoading: true,
    error: null,
  })

  const fetch = useCallback(async () => {
    if (!userId) {
      setState({ data: null, isLoading: false, error: null })
      return
    }

    setState((prev) => ({ ...prev, isLoading: true }))
    try {
      const data = await getUserNotifications(userId, limit)
      setState({ data, isLoading: false, error: null })
      return data
    } catch (err) {
      const error = err instanceof Error ? err.message : "Failed to fetch notifications"
      setState({ data: null, isLoading: false, error })
      throw err
    }
  }, [userId, limit])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { ...state, fetch }
}
