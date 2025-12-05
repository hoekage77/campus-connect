import { useCallback, useEffect, useState } from "react"
import { store } from "@/lib/data/store"

export interface AdminAuthUser {
  id: string
  username: string
  name: string
  email?: string
}

export function useAdminAuth() {
  const [user, setUser] = useState<AdminAuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initialize = async () => {
      try {
        if (typeof window === "undefined") {
          setIsLoading(false)
          return
        }

        // Small delay to allow localStorage updates to settle
        await new Promise((r) => setTimeout(r, 30))

        const adminId = localStorage.getItem("adminId")
        const adminName = localStorage.getItem("adminName")
        const adminEmail = localStorage.getItem("adminEmail")

        if (!adminId) {
          setUser(null)
          setIsLoading(false)
          return
        }

        const profile = store.getUser(adminId)
        if (profile && profile.role === "admin") {
          setUser({ id: profile.id, username: profile.username, name: profile.name, email: profile.email })
        } else if (adminName) {
          // Fallback to local-only identity; admin APIs will still enforce role
          setUser({ id: adminId, username: adminName.toLowerCase(), name: adminName, email: adminEmail || undefined })
        } else {
          setUser(null)
        }

        setIsLoading(false)
      } catch (e) {
        console.error("Failed to init admin auth", e)
        setError(e instanceof Error ? e.message : "Failed to init admin auth")
        setIsLoading(false)
      }
    }

    initialize()

    const onStorage = () => initialize()
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const logout = useCallback(() => {
    try {
      localStorage.removeItem("adminId")
      localStorage.removeItem("adminName")
      localStorage.removeItem("adminEmail")
      setUser(null)
    } catch (e) {
      console.error("Failed to logout admin", e)
      setError(e instanceof Error ? e.message : "Failed to logout admin")
    }
  }, [])

  const refresh = useCallback(() => {
    const adminId = localStorage.getItem("adminId")
    if (!adminId) return
    const profile = store.getUser(adminId)
    if (profile) {
      setUser({ id: profile.id, username: profile.username, name: profile.name, email: profile.email })
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
