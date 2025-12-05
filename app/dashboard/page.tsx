"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  Heart, MessageCircle, Share2, Bookmark, Users, Sparkles, 
  CalendarCheck, Flame, Play, UserPlus, Award, MapPin, Video, Plus, Bell, TrendingUp
} from "lucide-react"
import { Icon } from "@iconify/react"
import { useAuth } from "@/hooks/use-auth"
import { getAuthHeaders } from '@/lib/auth'
import { useAllGroups, useUserLevelStats } from "@/hooks/use-queries"
import { Skeleton } from "@/components/ui/skeleton"
import { subscribe } from "@/lib/event-emitter"
import { cn } from "@/lib/utils"

type FeedItem = {
  id: string
  type: 'live-space' | 'event' | 'squad-join' | 'achievement' | 'recommendation'
  timestamp: Date
  priority: number
  data: any
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, refresh } = useAuth()
  const { data: levelData } = useUserLevelStats(user?.id || null)
  const { data: allGroups, isLoading: groupsLoading, fetch: refetchGroups } = useAllGroups()
  
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [loadingFeed, setLoadingFeed] = useState(true)
  const [liveSpaces, setLiveSpaces] = useState<any[]>([])
  const storiesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refetchGroups()
        loadFeedData()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [refetchGroups])

  // Ensure groups are fetched again once a valid user.id is available
  useEffect(() => {
    if (user?.id) {
      if (process.env.NODE_ENV === 'development') console.debug('[Dashboard] user.id available, refetching groups')
      refetchGroups()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    const unsub1 = subscribe('groups:created', () => { refetchGroups(); loadFeedData() })
    const unsub2 = subscribe('user:joined-group', () => { refresh(); refetchGroups(); loadFeedData() })
    const unsub3 = subscribe('user:left-group', () => { refresh(); refetchGroups(); loadFeedData() })
    return () => { unsub1(); unsub2(); unsub3() }
  }, [refetchGroups, refresh])

  const userSquads = (allGroups || []).filter((group) => 
    group.ownerId === user?.id || group.members?.some((m: any) => m.userId === user?.id) || group.isMember
  )

  const loadFeedData = async () => {
    if (!user || !allGroups) return
    setLoadingFeed(true)
    
    try {
      const spacesPromises = userSquads.map((squad: any) => 
        fetch(`/api/groups/${squad.id}/spaces`, {
          headers: { ...getAuthHeaders(), 'x-user-id': user.id },
          cache: 'no-store'
        }).then(r => r.ok ? r.json() : []).catch(() => [])
      )
      const spacesResults = await Promise.all(spacesPromises)
      const allSpaces = spacesResults.flat() || []
      const activeSpaces: any[] = allSpaces.filter((s: any) => s && s.status === 'live') || []
      setLiveSpaces(activeSpaces)

      const res = await fetch('/api/sessions?upcoming=true&limit=10', {
        headers: { 'x-user-id': user.id },
        cache: 'no-store'
      })
      const sessionsData = res.ok ? await res.json() : { sessions: [] }

      const items: any[] = []
      
      // Safely iterate over activeSpaces (guaranteed to be an array)
      if (Array.isArray(activeSpaces)) {
        activeSpaces.forEach((space: any) => {
          items.push({
            id: `space-${space.id}`,
            type: 'live-space',
            timestamp: new Date(space.createdAt || Date.now()),
            priority: 100,
            data: space
          })
        })
      }

      (sessionsData.sessions || []).forEach((session: any) => {
        const startTime = new Date(session.startAt)
        const hoursUntil = (startTime.getTime() - Date.now()) / 3600000
        const priority = hoursUntil < 2 ? 90 : hoursUntil < 24 ? 70 : 50
        items.push({
          id: `event-${session.id}`,
          type: 'event',
          timestamp: startTime,
          priority,
          data: session
        })
      })

      const notJoinedSquads = (allGroups || []).filter((g: any) => 
        !userSquads.some((us: any) => us.id === g.id) && g.privacy === 'public'
      ).slice(0, 3)
      
      notJoinedSquads.forEach((squad: any) => {
        items.push({
          id: `rec-${squad.id}`,
          type: 'recommendation',
          timestamp: new Date(),
          priority: 40,
          data: squad
        })
      })

      if (levelData && levelData.loginStreak > 0) {
        items.push({
          id: 'achievement-streak',
          type: 'achievement',
          timestamp: new Date(),
          priority: 30,
          data: { type: 'streak', value: levelData.loginStreak }
        })
      }

      items.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority
        return b.timestamp.getTime() - a.timestamp.getTime()
      })

      setFeed(items as FeedItem[])
    } catch (e) {
      console.error('Failed to load feed:', e)
    } finally {
      setLoadingFeed(false)
    }
  }

  useEffect(() => {
    loadFeedData()
  }, [user, allGroups])

  // Show a single full-page skeleton until both groups and initial feed are ready
  if (isLoading || groupsLoading || (loadingFeed && feed.length === 0)) {
    return <FeedSkeleton />
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Not Authenticated</h2>
          <p className="text-muted-foreground mb-4">Please log in to access your feed.</p>
          <Link href="/login"><Button>Go to Login</Button></Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Absolute mode background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 h-64 w-64 rounded-full bg-gradient-to-br from-primary/25 to-primary/0 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-accent/25 to-accent/0 blur-3xl" />
        <div className="absolute top-16 left-1/2 h-px w-[640px] -translate-x-1/2 bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      </div>

      <div className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-9 items-center rounded-full border border-border/70 bg-background/80 px-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/30">
                <Icon icon="solar:radar-2-bold-duotone" className="h-3.5 w-3.5 text-primary" />
              </span>
              Dashboard
            </div>
            <h1 className="hidden md:block text-xl font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Campus Connect
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/groups">
              <Button variant="outline" size="sm" className="gap-2 border-border/70 bg-background/70">
                <Icon icon="solar:users-group-two-rounded-bold-duotone" className="h-4 w-4" />
                <span className="hidden sm:inline">Discover squads</span>
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="relative rounded-full border border-border/60 bg-background/70">
              <Icon icon="solar:bell-bing-bold-duotone" className="h-4 w-4" />
              <span className="absolute top-1 right-1 inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </Button>
            <Link href="/settings">
              <Avatar className="w-9 h-9 cursor-pointer ring-2 ring-primary/25">
                <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </div>

      <div className="border-b border-border/60 bg-card/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div 
            ref={storiesRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                <Plus className="w-7 h-7 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Add</span>
            </div>

            {liveSpaces.slice(0, 10).map((space: any) => {
              const squad = userSquads.find((g: any) => g.id === space.groupId)
              return (
                <Link key={space.id} href={`/groups/${space.groupId}/spaces/${space.id}`}>
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 via-purple-500 to-pink-500 p-[2.5px] animate-pulse">
                        <div className="w-full h-full rounded-full bg-background p-[2px] flex items-center justify-center">
                          <Avatar className="w-full h-full">
                            <AvatarFallback className="bg-gradient-to-br from-orange-500/20 to-pink-500/20 text-orange-500 font-bold">
                              {squad?.title.charAt(0) || 'L'}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-red-500 rounded-full border-2 border-background flex items-center justify-center">
                        <Video className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium max-w-[80px] truncate">
                      {squad?.title || 'Live'}
                    </span>
                  </div>
                </Link>
              )
            })}

            {userSquads.slice(0, 8).map((squad: any) => (
              <Link key={squad.id} href={`/groups/${squad.id}`}>
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-purple-600/30 p-[2px]">
                    <Avatar className="w-full h-full">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-600/20 text-primary font-bold">
                        {squad.title.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium max-w-[80px] truncate">
                    {squad.title}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 relative z-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Welcome back, {user.name.split(' ')[0]} 👋</h2>
          <p className="text-muted-foreground mt-1">Here's what's happening in your campus today.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2">
            {loadingFeed && feed.length > 0 ? (
              <div className="space-y-4">
                <FeedItemSkeleton />
                <FeedItemSkeleton />
                <FeedItemSkeleton />
              </div>
            ) : feed.length === 0 ? (
              <div className="p-8">
                <Card className="border border-dashed border-border/70 bg-background/80">
                  <CardContent className="py-8 flex flex-col items-center text-center gap-3">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-accent/20">
                      <Icon icon="solar:compass-bold-duotone" className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold">Your feed is waiting</h3>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Join a few squads to turn this into a live canvas of sessions, spaces, and recommendations.
                      </p>
                    </div>
                    <Link href="/groups">
                      <Button size="sm" className="mt-1 gap-2">
                        <Icon icon="solar:users-group-two-rounded-bold-duotone" className="h-4 w-4" />
                        Discover squads
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            ) : (
          <div className="space-y-4">
            {feed.map((item) => (
              <FeedItemCard key={item.id} item={item} userSquads={userSquads} />
            ))}
          </div>
        )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-4">
            <SidebarWidget title="Your Stats" icon={<Icon icon="solar:chart-square-bold-duotone" className="w-4 h-4" />}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Squads</span>
                  <span className="font-semibold">{userSquads.length}</span>
                </div>
                {levelData && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Points</span>
                      <span className="font-semibold">{levelData.totalPoints || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Streak</span>
                      <span className="font-semibold flex items-center gap-1">
                        {levelData.loginStreak || 0}
                        <Icon icon="solar:fire-bold-duotone" className="w-4 h-4 text-orange-500" />
                      </span>
                    </div>
                  </>
                )}
              </div>
            </SidebarWidget>

            {/* Quick Actions */}
            <SidebarWidget title="Quick Actions" icon={<Icon icon="solar:bolt-bold-duotone" className="w-4 h-4" />}>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/messages">
                  <Button variant="outline" size="sm" className="w-full h-auto py-3 flex flex-col gap-1 hover:bg-primary/5 hover:border-primary/30">
                    <Icon icon="solar:chat-round-dots-bold-duotone" className="w-5 h-5 text-blue-500" />
                    <span className="text-xs">Messages</span>
                  </Button>
                </Link>
                <Link href="/spaces">
                  <Button variant="outline" size="sm" className="w-full h-auto py-3 flex flex-col gap-1 hover:bg-primary/5 hover:border-primary/30">
                    <Icon icon="solar:broadcast-bold-duotone" className="w-5 h-5 text-red-500" />
                    <span className="text-xs">Spaces</span>
                  </Button>
                </Link>
                <Link href="/groups">
                  <Button variant="outline" size="sm" className="w-full h-auto py-3 flex flex-col gap-1 hover:bg-primary/5 hover:border-primary/30">
                    <Icon icon="solar:users-group-two-rounded-bold-duotone" className="w-5 h-5 text-purple-500" />
                    <span className="text-xs">Find Squads</span>
                  </Button>
                </Link>
                <Link href="/bookmarks">
                  <Button variant="outline" size="sm" className="w-full h-auto py-3 flex flex-col gap-1 hover:bg-primary/5 hover:border-primary/30">
                    <Icon icon="solar:bookmark-bold-duotone" className="w-5 h-5 text-yellow-500" />
                    <span className="text-xs">Bookmarks</span>
                  </Button>
                </Link>
              </div>
            </SidebarWidget>

            {/* Activity Pulse */}
            {liveSpaces.length > 0 && (
              <SidebarWidget title="Live Now" icon={<Icon icon="solar:pulse-2-bold-duotone" className="w-4 h-4 text-red-500" />}>
                <div className="space-y-2">
                  {liveSpaces.slice(0, 3).map((space: any) => {
                    const squad = userSquads.find((g: any) => g.id === space.groupId)
                    return (
                      <Link key={space.id} href={`/groups/${space.groupId}/spaces/${space.id}`}>
                        <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-red-500/10 transition-colors group">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center shrink-0">
                              <Video className="w-4 h-4 text-red-500" />
                            </div>
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate group-hover:text-red-500 transition-colors">{space.title}</p>
                            <p className="text-xs text-muted-foreground">{squad?.title || 'Squad'}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400 shrink-0">
                            {space.participants?.length || 0}
                          </Badge>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </SidebarWidget>
            )}

            <SidebarWidget title="Your Squads" icon={<Icon icon="solar:users-group-rounded-bold-duotone" className="w-4 h-4" />}>
              <div className="space-y-2">
                {userSquads.slice(0, 5).map((squad: any) => (
                  <Link key={squad.id} href={`/groups/${squad.id}`}>
                    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold">{squad.title.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{squad.title}</p>
                        <p className="text-xs text-muted-foreground">{squad.memberCount || 0} members</p>
                      </div>
                    </div>
                  </Link>
                ))}
                {userSquads.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No squads yet</p>
                )}
              </div>
            </SidebarWidget>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeedItemCard({ item, userSquads }: { item: FeedItem; userSquads: any[] }) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)

  if (item.type === 'live-space') {
    const space = item.data
    const squad = userSquads.find((g: any) => g.id === space.groupId)
    
    return (
      <Card className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-red-500/5 to-transparent">
        <CardContent className="p-5">
        <div className="flex gap-3 mb-3">
          <Avatar className="w-10 h-10 ring-2 ring-red-500/50">
            <AvatarFallback className="bg-gradient-to-br from-red-500/20 to-pink-500/20">
              {squad?.title.charAt(0) || 'L'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">{squad?.title || 'Squad'}</p>
              <Badge variant="destructive" className="h-4 text-[9px] px-1.5 animate-pulse">🔴 LIVE</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Streaming now</p>
          </div>
        </div>

        <Link href={`/groups/${space.groupId}/spaces/${space.id}`}>
          <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-red-500/10 to-pink-500/10 aspect-video mb-3 cursor-pointer group">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-red-500/80 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-white fill-white ml-1" />
              </div>
            </div>
            <div className="absolute top-3 left-3">
              <Badge className="bg-black/60 text-white border-0 backdrop-blur-sm">
                <Users className="w-3 h-3 mr-1" />
                {space.activeParticipantCount || 0} watching
              </Badge>
            </div>
          </div>
        </Link>

        <div className="mb-2">
          <h3 className="font-bold text-sm mb-1">{space.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{space.description}</p>
        </div>

        <FeedActions liked={liked} setLiked={setLiked} saved={saved} setSaved={setSaved} />
        </CardContent>
      </Card>
    )
  }

  if (item.type === 'event') {
    const session = item.data
    const startTime = new Date(session.startAt)
    const hoursUntil = Math.floor((startTime.getTime() - Date.now()) / 3600000)
    const isToday = startTime.toDateString() === new Date().toDateString()
    const timeStr = startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    
    return (
      <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
        <CardContent className="p-5">
        <div className="flex gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">Upcoming Event</p>
              {isToday && hoursUntil < 2 && (
                <Badge variant="secondary" className="h-4 text-[9px] px-1.5">Starting Soon</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isToday ? 'Today' : startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {timeStr}
            </p>
          </div>
        </div>

        <div className="mb-2">
          <h3 className="font-bold text-sm mb-1">{session.title}</h3>
          {session.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{session.description}</p>
          )}
          {session.location && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {session.location}
            </div>
          )}
        </div>

        <Button size="sm" className="w-full mb-2">
          <CalendarCheck className="w-4 h-4 mr-2" />RSVP to Event
        </Button>

        <FeedActions liked={liked} setLiked={setLiked} saved={saved} setSaved={setSaved} />
        </CardContent>
      </Card>
    )
  }

  if (item.type === 'recommendation') {
    const squad = item.data
    
    return (
      <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-5">
        <div className="flex gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Recommended for you</p>
            <p className="text-xs text-muted-foreground">Based on your interests</p>
          </div>
        </div>

        <Link href={`/groups/${squad.id}`}>
          <Card className="mb-3 hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold">{squad.title.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm mb-1">{squad.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{squad.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {squad.memberCount || 0}
                    </span>
                    {squad.topics && squad.topics.length > 0 && (
                      <span>· {squad.topics.slice(0, 2).join(', ')}</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Button variant="outline" size="sm" className="w-full mb-2">
          <UserPlus className="w-4 h-4 mr-2" />Join Squad
        </Button>

        <FeedActions liked={liked} setLiked={setLiked} saved={saved} setSaved={setSaved} hideLike />
        </CardContent>
      </Card>
    )
  }

  if (item.type === 'achievement') {
    const { type, value } = item.data
    
    return (
      <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
        <CardContent className="p-5">
        <div className="flex gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
            {type === 'streak' ? <Flame className="w-5 h-5 text-orange-500" /> : <Award className="w-5 h-5 text-yellow-500" />}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">You're on fire! 🔥</p>
            <p className="text-xs text-muted-foreground">Keep the momentum going</p>
          </div>
        </div>

        <Card className="mb-3 border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                <Flame className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-2xl">{value} Day Streak!</h3>
                <p className="text-sm text-muted-foreground">Come back tomorrow to keep it going</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <FeedActions liked={liked} setLiked={setLiked} saved={saved} setSaved={setSaved} />
        </CardContent>
      </Card>
    )
  }

  return null
}

function SidebarWidget({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          <h3 className="font-semibold">{title}</h3>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

function FeedActions({ liked, setLiked, saved, setSaved, hideLike }: { 
  liked: boolean; 
  setLiked: (v: boolean) => void;
  saved: boolean;
  setSaved: (v: boolean) => void;
  hideLike?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <div className="flex items-center gap-4">
        {!hideLike && (
          <button 
            onClick={() => setLiked(!liked)}
            className={cn(
              "flex items-center gap-1.5 transition-colors hover:text-red-500",
              liked && "text-red-500"
            )}
          >
            <Heart className={cn("w-5 h-5", liked && "fill-current")} />
            <span className="text-xs font-medium">{liked ? '1' : ''}</span>
          </button>
        )}
        <button className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
          <MessageCircle className="w-5 h-5" />
        </button>
        <button className="flex items-center gap-1.5 hover:text-green-500 transition-colors">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
      <button 
        onClick={() => setSaved(!saved)}
        className={cn(
          "hover:text-yellow-500 transition-colors",
          saved && "text-yellow-500"
        )}
      >
        <Bookmark className={cn("w-5 h-5", saved && "fill-current")} />
      </button>
    </div>
  )
}

function FeedItemSkeleton() {
  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

function FeedSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto">
        <div className="h-14 border-b border-border flex items-center justify-between px-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
        <div className="p-4 space-y-4">
          <FeedItemSkeleton />
          <FeedItemSkeleton />
          <FeedItemSkeleton />
        </div>
      </div>
    </div>
  )
}
