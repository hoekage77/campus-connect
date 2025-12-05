"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/use-auth"
import { Users, MessageSquare, Shield, Lock } from "lucide-react"
import { getAuthHeaders } from "@/lib/auth"

interface ProfilePayload {
  id: string
  name: string
  username?: string
  email?: string
  major?: string
  year?: string
  topics?: string[]
  squads?: Array<{
    id: string
    title: string
    privacy: string
    memberCount: number
  }>
  level?: {
    currentLevel: string
    totalPoints: number
  }
}

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: viewer } = useAuth()
  const userId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string | undefined)

  const [profile, setProfile] = useState<ProfilePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/users/${userId}`, { headers: { ...getAuthHeaders(), "cache-control": "no-store" } })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload.error || `Failed to load user ${userId}`)
      }
      const data = await res.json()
      setProfile(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load profile")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const isOwn = viewer?.id === profile?.id
  const canSeeEmail = isOwn || (viewer && viewer.id === profile?.id) // placeholder for admin privilege

  const sharedSquads = useMemo(() => {
    if (!profile?.squads || !viewer?.squads) return []
    const set = new Set(viewer.squads)
    return profile.squads.filter((s) => set.has(s.id))
  }, [profile, viewer])

  if (!userId) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <Alert>
          <AlertDescription>Invalid user identifier.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-40" />
          </div>
        ) : error ? (
          <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
        ) : profile ? (
          <div className="space-y-8">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold">{profile.name}</h1>
                <p className="text-muted-foreground">@{profile.username || profile.id}</p>
                {profile.major || profile.year ? (
                  <p className="text-sm text-muted-foreground">
                    {profile.major && <span>{profile.major}</span>} {profile.major && profile.year && <span>•</span>} {profile.year && <span>{profile.year}</span>}
                  </p>
                ) : null}
                {canSeeEmail && profile.email && (
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                )}
              </div>
              <div className="flex gap-2">
                {!isOwn && (
                  <Button variant="outline" size="sm" onClick={() => router.push(`/messages?squad=${sharedSquads[0]?.id || ''}`)}>
                    <MessageSquare className="w-4 h-4 mr-1" /> Message
                  </Button>
                )}
                {sharedSquads.length > 0 && (
                  <Button variant="secondary" size="sm" onClick={() => router.push(`/groups/${sharedSquads[0].id}`)}>
                    <Users className="w-4 h-4 mr-1" /> View Shared Squad
                  </Button>
                )}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Interests & Topics</CardTitle>
                <CardDescription>User-selected areas of focus</CardDescription>
              </CardHeader>
              <CardContent>
                {profile.topics && profile.topics.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.topics.map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No topics listed.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Squads</CardTitle>
                <CardDescription>Groups this user belongs to</CardDescription>
              </CardHeader>
              <CardContent>
                {profile.squads && profile.squads.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {profile.squads.map((g) => (
                      <Link key={g.id} href={`/groups/${g.id}`} className="group block border rounded-lg p-3 hover:bg-accent/40 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">{g.title}</span>
                          {g.privacy === 'private' ? (
                            <Lock className="w-3.5 h-3.5 text-red-500" />
                          ) : g.privacy === 'invite-only' ? (
                            <Shield className="w-3.5 h-3.5 text-amber-500" />
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Users className="w-3.5 h-3.5" /> {g.memberCount} member{g.memberCount !== 1 && 's'}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not a member of any squads yet.</p>
                )}
              </CardContent>
            </Card>

          </div>
        ) : null}
      </div>
    </div>
  )
}
