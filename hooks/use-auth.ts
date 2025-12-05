import { useCallback, useEffect, useState } from "react"
import type { UserProfile } from "@/types"
import { store } from "@/lib/data/store"
import { createClient } from "@/lib/supabase/client"

export interface AuthUser {
  id: string
  username: string
  name: string
  email?: string
  studentId?: string
  squads?: string[]
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize auth state from Supabase (fall back to localStorage for dev)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (typeof window === "undefined") {
          setIsLoading(false)
          return
        }

        // Small delay to ensure localStorage or Supabase client is ready
        await new Promise((resolve) => setTimeout(resolve, 50))

        const supabase = createClient()
        // Prefer Supabase Auth session
        const { data: sessionData } = await supabase!.auth.getSession()
        const session = sessionData?.session
        let userId = session?.user?.id ?? null
        let userName = session?.user?.user_metadata?.username ?? null
        let userEmail = session?.user?.email ?? null

        // Fallback: localStorage dev-only auth
        if (!userId) {
          userId = localStorage.getItem("userId")
          userName = localStorage.getItem("userName")
          userEmail = localStorage.getItem("userEmail")
        }

        if (!userId) {
          setUser(null)
          setIsLoading(false)
          return
        }

        // Try Supabase profile lookup
        let userProfile: UserProfile | null = null
        try {
          const { data: profile } = await supabase!.from('user_profiles').select('*').eq('user_id', userId).single()
          if (profile) userProfile = profile as unknown as UserProfile
        } catch {
          // ignore and fallback to local store
        }

        // Fallback to in-memory store for dev
        if (!userProfile) {
          userProfile = store.getUser(userId) || null
        }

        if (userProfile) {
          const finalUserId = userProfile.id || userId
          setUser({
            id: finalUserId, // Use userId if profile.id is missing
            username: userProfile.username,
            name: userProfile.name,
            email: userProfile.email,
            studentId: userProfile.studentId,
            squads: userProfile.squads,
          })
          // Persist to localStorage for compatibility with legacy code paths
          try {
            if (finalUserId) localStorage.setItem('userId', finalUserId)
            if (userProfile.name) localStorage.setItem('userName', userProfile.name)
            if (userProfile.email) localStorage.setItem('userEmail', userProfile.email)
          } catch (e) {
            // ignore localStorage errors
          }
          if (process.env.NODE_ENV === 'development') console.debug('[useAuth] initialized user from profile', userProfile.id)
        } else if (userId) {
          // Fallback: if we have userId but no profile, create a minimal user object
          console.warn('[useAuth] No user profile found, using minimal user object from localStorage/session')
          setUser({
            id: userId,
            username: userName || 'user',
            name: userName || 'User',
            email: userEmail || undefined,
            studentId: undefined,
            squads: [],
          })
        } else {
          setUser(null)
        }

        setIsLoading(false)
      } catch (err) {
        console.error("Failed to initialize auth", err)
        setError(err instanceof Error ? err.message : "Failed to initialize auth")
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen for storage changes (from other tabs/windows)
    const handleStorageChange = () => {
      initializeAuth()
    }

    window.addEventListener("storage", handleStorageChange)
    // Subscribe to Supabase auth changes and refresh local state
    const supabase = createClient()
    const { data: listener } = supabase!.auth.onAuthStateChange(() => {
      initializeAuth()
    })
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      ;(listener as any)?.unsubscribe?.()
    }
  }, [])

  const logout = useCallback(() => {
    try {
      // Sign out from Supabase if possible, and clear local dev storage
      const supabase = createClient()
      supabase!.auth.signOut().catch(() => {})
      localStorage.removeItem("userId")
      localStorage.removeItem("userName")
      localStorage.removeItem("userEmail")
      localStorage.removeItem("studentId")
      setUser(null)
    } catch (err) {
      console.error("Failed to logout", err)
      setError(err instanceof Error ? err.message : "Failed to logout")
    }
  }, [])

  const refresh = useCallback(() => {
    const userId = localStorage.getItem("userId")
    if (userId) {
      const userProfile = store.getUser(userId)
      if (userProfile) {
        setUser({
          id: userProfile.id,
          username: userProfile.username,
          name: userProfile.name,
          email: userProfile.email,
          studentId: userProfile.studentId,
          squads: userProfile.squads,
        })
      }
    }
  }, [])

  return {
    user,
    isLoading,
    error,
    isAuthenticated: user !== null,
    logout,
    refresh,
  }
}
