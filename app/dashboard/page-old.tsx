"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  Heart, MessageCircle, Share2, Bookmark, Users, Sparkles, 
  MessageSquare, CalendarCheck, Flame, TrendingUp, Play,
  UserPlus, Award, ChevronRight, Clock, MapPin, Video, Send
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { getAuthHeaders } from '@/lib/auth'
import { useAllGroups, useUserLevelStats, useUserNotifications } from "@/hooks/use-queries"
import { Skeleton } from "@/components/ui/skeleton"
import { subscribe } from "@/lib/event-emitter"
import { cn } from "@/lib/utils"

type FeedItem = {
  id: string
  type: 'live-space' | 'event' | 'squad-join' | 'achievement' | 'recommendation' | 'post'
  timestamp: Date
  priority: number
  data: any
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, refresh } = useAuth()
  const { data: levelData, isLoading: levelLoading } = useUserLevelStats(user?.id || null)
  const { data: allGroups, isLoading: groupsLoading, fetch: refetchGroups } = useAllGroups()
  const { data: notifications, isLoading: notifsLoading } = useUserNotifications(user?.id || null, 50)
  
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [loadingFeed, setLoadingFeed] = useState(true)
  const [liveSpaces, setLiveSpaces] = useState<any[]>([])
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([])
  const storiesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only redirect if we're done loading AND user is not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  // Refetch groups when page becomes visible (user returns from another tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refetchGroups()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [refetchGroups])

  // Listen for group creation/join/leave events and refresh
  useEffect(() => {
    const unsubscribeCreated = subscribe('groups:created', () => {
      console.log("[Dashboard] Group created event received, refetching groups...")
      refetchGroups()
    })

    const unsubscribeJoined = subscribe('user:joined-group', () => {
      console.log("[Dashboard] User joined group, refreshing user and refetching groups...")
      refresh()
      refetchGroups()
    })

    const unsubscribeLeft = subscribe('user:left-group', () => {
      console.log("[Dashboard] User left group, refreshing user and refetching groups...")
      refresh()
      refetchGroups()
    })

    return () => {
      unsubscribeCreated()
      unsubscribeJoined()
      unsubscribeLeft()
    }
  }, [refetchGroups, refresh])

  // Load live spaces and upcoming sessions for "For You" tab
  useEffect(() => {
    const loadForYouData = async () => {
      if (!user || !allGroups) return
      
      // Calculate user's squads - check membership via members array or ownership
      const userSquadsData = (allGroups || []).filter((group) =>
        group.ownerId === user.id || group.members?.some((m) => m.userId === user.id) || group.isMember
      )
      
      // Load live spaces from user's groups
      setLoadingSpaces(true)
      try {
        const spacesPromises = userSquadsData.map(squad => 
          fetch(`/api/groups/${squad.id}/spaces`, {
            headers: { ...getAuthHeaders(), 'x-user-id': user.id },
            cache: 'no-store'
          }).then(r => r.ok ? r.json() : [])
        )
        const spacesResults = await Promise.all(spacesPromises)
        const allSpaces = spacesResults.flat()
        const activeSpaces = allSpaces.filter((s: any) => s.status === 'live')
        setLiveSpaces(activeSpaces)
      } catch (e) {
        console.error('Failed to load spaces:', e)
        setLiveSpaces([])
      } finally {
        setLoadingSpaces(false)
      }

      // Load upcoming sessions
      setLoadingSessions(true)
      try {
        const res = await fetch('/api/sessions?upcoming=true&limit=5', {
          headers: { 'x-user-id': user.id },
          cache: 'no-store'
        })
        if (res.ok) {
          const data = await res.json()
          setUpcomingSessions(data.sessions || [])
        } else {
          setUpcomingSessions([])
        }
      } catch (e) {
        console.error('Failed to load sessions:', e)
        setUpcomingSessions([])
      } finally {
        setLoadingSessions(false)
      }
    }

    loadForYouData()
  }, [user, allGroups])

  if (isLoading || levelLoading || groupsLoading || notifsLoading) {
    return <DashboardSkeleton />
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Not Authenticated</EmptyTitle>
            <EmptyDescription>Please log in to access your dashboard.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href="/login">
              <Button>Go to Login</Button>
            </Link>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  // Get user's squads - this now filters to the groups the user actually belongs to
  const userSquads = (allGroups || []).filter((group) => group.isMember)

  // Get all groups for the squads tab (user can see all available squads)
  const allAvailableSquads = allGroups || []

  // Fallback values if data doesn't exist
  const displayLevelData = levelData || {
    userId: user.id,
    currentLevel: "Novice" as const,
    totalPoints: 0,
    totalEventsAttended: 0,
    totalSquadsCreated: 0,
    totalMessagesCount: 0,
    loginStreak: 0,
    achievements: [],
  }

  const levelThresholds: Record<string, number> = {
    Novice: 100,
    Learner: 300,
    Collaborator: 700,
    Expert: 1500,
    Master: Number.POSITIVE_INFINITY,
  }

  const nextLevelThreshold = levelThresholds[displayLevelData.currentLevel || "Novice"]
  const currentPoints = displayLevelData.totalPoints || 0
  const progressPercent = Math.min((currentPoints / nextLevelThreshold) * 100, 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border/50 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 supports-[backdrop-filter]:backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto">
              <div className="relative shrink-0">
                <Avatar className="w-12 h-12 sm:w-16 sm:h-16 ring-2 sm:ring-4 ring-primary/30 ring-offset-1 sm:ring-offset-2 ring-offset-background shadow-md">
                  <AvatarFallback className="text-lg sm:text-2xl bg-gradient-to-br from-primary via-primary to-secondary text-white font-bold">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1.5 sm:-right-1.5 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full border-2 border-background" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight truncate">{user.name}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary" className="text-xs sm:text-sm px-2 sm:px-2.5 py-0.5 font-semibold">
                    <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {displayLevelData.currentLevel}
                  </Badge>
                  <span className="text-sm sm:text-base text-muted-foreground truncate">@{user.username}</span>
                </div>
              </div>
            </div>
            <Link href="/groups" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto rounded-full px-4 sm:px-5 py-2 sm:py-2.5 shadow-sm hover:shadow-md transition-shadow">
                <Users className="w-4 h-4 mr-2" />
                Find Squads
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section (collapsible) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <Collapsible open={showAnalytics} onOpenChange={setShowAnalytics}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground">Insights</h2>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-xs sm:text-sm h-8 sm:h-9">
                <span className="hidden sm:inline">{showAnalytics ? 'Hide' : 'Show'} Analytics</span>
                <span className="sm:hidden">{showAnalytics ? 'Hide' : 'Show'}</span>
                <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${showAnalytics ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
              <div className="bg-card/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center border border-border/50 hover:border-primary/50 transition-colors">
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-2 sm:mb-3">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div className="text-xl sm:text-2xl font-bold tracking-tight mb-1">{userSquads.length}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">Squads</div>
              </div>
              
              <div className="bg-card/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center border border-border/50 hover:border-secondary/50 transition-colors">
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-secondary/20 to-secondary/5 mb-2 sm:mb-3">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
                </div>
                <div className="text-xl sm:text-2xl font-bold tracking-tight mb-1">{displayLevelData.totalPoints}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">Points</div>
              </div>
              
              <div className="bg-card/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center border border-border/50 hover:border-accent/50 transition-colors">
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 mb-2 sm:mb-3">
                  <CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                </div>
                <div className="text-xl sm:text-2xl font-bold tracking-tight mb-1">{displayLevelData.totalEventsAttended}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">Events</div>
              </div>
              
              <div className="bg-card/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center border border-border/50 hover:border-orange-500/50 transition-colors">
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-500/5 mb-2 sm:mb-3">
                  <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                </div>
                <div className="text-xl sm:text-2xl font-bold tracking-tight mb-1">{displayLevelData.totalMessagesCount}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">Messages</div>
              </div>
              
              <div className="bg-card/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center border border-border/50 hover:border-pink-500/50 transition-colors col-span-2 sm:col-span-1">
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-pink-500/20 to-pink-500/5 mb-2 sm:mb-3">
                  <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500" />
                </div>
                <div className="text-xl sm:text-2xl font-bold tracking-tight mb-1">{displayLevelData.loginStreak}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">Streak</div>
              </div>
            </div>

            {/* Level Progress Card */}
            <Card className="mb-6 border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                      <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <span className="text-sm sm:text-base font-semibold">Level Progress</span>
                  </div>
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                    {currentPoints} / {nextLevelThreshold} XP
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2 sm:h-2.5 mb-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium">{displayLevelData.currentLevel}</span>
                  <span className="truncate ml-2">{nextLevelThreshold - currentPoints} XP to next level</span>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Dashboard Tabs */}
        <div className="w-full max-w-4xl mx-auto mb-10">
          <Tabs value={activeTab} onValueChange={(v)=> setActiveTab(v as any)}>
            <TabsList className="grid grid-cols-3 w-full mb-4">
              <TabsTrigger value="for-you" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4"/> 
                <span>For You</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4"/> 
                <span className="hidden sm:inline">Activity</span>
                <span className="sm:hidden">Stats</span>
              </TabsTrigger>
              <TabsTrigger value="squads" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4"/> 
                <span>Squads</span>
              </TabsTrigger>
            </TabsList>
            {/* FOR YOU TAB */}
            <TabsContent value="for-you" className="space-y-6">
              {/* Active Now Section */}
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
                <CardHeader className="pb-3 sm:pb-4 border-b border-border/50">
                  <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                    <div className="relative">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                    </div>
                    Active Now
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Live study sessions in your squads</CardDescription>
                </CardHeader>
                <CardContent className="pt-3 sm:pt-4">
                  {loadingSpaces ? (
                    <div className="text-xs sm:text-sm text-muted-foreground">Finding active spaces...</div>
                  ) : liveSpaces && liveSpaces.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3">
                      {liveSpaces.map((space: any) => {
                        const squad = userSquads.find(g => g.id === space.groupId)
                        return (
                          <div key={space.id} className="flex gap-2 sm:gap-3 p-3 rounded-lg sm:rounded-xl border-2 border-orange-500/30 bg-orange-500/5 hover:border-orange-500/50 transition-colors">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500/30 to-orange-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="destructive" className="h-5 text-[10px] px-2 animate-pulse">LIVE</Badge>
                                <p className="text-xs sm:text-sm font-bold truncate">{space.title}</p>
                              </div>
                              <p className="text-xs text-muted-foreground truncate mb-1">
                                {squad?.title} · {(space.activeParticipantCount ?? space.participants?.length ?? space.participantIds?.length ?? 0)} studying
                              </p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">{space.description}</p>
                            </div>
                            <Link href={`/groups/${space.groupId}/spaces/${space.id}`} className="shrink-0">
                              <Button size="sm" className="h-8 sm:h-9 px-3 sm:px-4 bg-orange-500 hover:bg-orange-600">
                                <span className="text-xs sm:text-sm">Join</span>
                              </Button>
                            </Link>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex gap-2 sm:gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-muted/60 to-muted/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-semibold mb-0.5">No live spaces right now</p>
                        <p className="text-xs text-muted-foreground">Be the first to start a study session!</p>
                        <Link href="/groups" className="inline-block mt-2">
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Start Space
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Today's Opportunities */}
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
                <CardHeader className="pb-3 sm:pb-4 border-b border-border/50">
                  <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-emerald-500" />
                    Upcoming Today
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Events and study sessions</CardDescription>
                </CardHeader>
                <CardContent className="pt-3 sm:pt-4">
                  {loadingSessions ? (
                    <div className="text-xs sm:text-sm text-muted-foreground">Loading events...</div>
                  ) : upcomingSessions && upcomingSessions.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3">
                      {upcomingSessions.map((session: any) => {
                        const startTime = new Date(session.startAt)
                        const hoursUntil = Math.floor((startTime.getTime() - Date.now()) / 3600000)
                        const isToday = startTime.toDateString() === new Date().toDateString()
                        const timeStr = startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                        
                        return (
                          <div key={session.id} className="flex gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-border/50 hover:border-emerald-500/30 transition-colors">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-full flex items-center justify-center flex-shrink-0">
                              <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {isToday && hoursUntil < 2 && (
                                  <Badge variant="secondary" className="h-4 text-[9px] px-1.5">SOON</Badge>
                                )}
                                <p className="text-xs sm:text-sm font-semibold truncate">{session.title}</p>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {isToday ? 'Today' : startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {timeStr}
                              </p>
                              {session.location && (
                                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">📍 {session.location}</p>
                              )}
                            </div>
                            <Button variant="outline" size="sm" className="h-7 sm:h-8 px-2 sm:px-3 text-xs shrink-0">
                              RSVP
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex gap-2 sm:gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-muted/60 to-muted/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-semibold mb-0.5">No events today</p>
                        <p className="text-xs text-muted-foreground">Check back tomorrow or create an event!</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Your Squads Activity */}
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
                <CardHeader className="pb-3 sm:pb-4 border-b border-border/50">
                  <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    Your Squads
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Quick access to your communities</CardDescription>
                </CardHeader>
                <CardContent className="pt-3 sm:pt-4">
                  {userSquads.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      {userSquads.slice(0, 6).map((squad) => (
                        <Link key={squad.id} href={`/groups/${squad.id}`}>
                          <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-sm sm:text-base font-bold">{squad.title.charAt(0)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-semibold truncate">{squad.title}</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                {squad.memberCount || 0} members
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="flex gap-2 sm:gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-semibold mb-0.5">Join your first squad!</p>
                        <p className="text-xs text-muted-foreground">Find study groups matching your interests.</p>
                        <Link href="/groups" className="inline-block mt-2">
                          <Button variant="default" size="sm" className="h-7 text-xs">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Discover Squads
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ACTIVITY TAB */}
            <TabsContent value="activity">
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
                <CardHeader className="pb-3 sm:pb-4 border-b border-border/50">
                  <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Your Activity Stats
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Your progress and contributions</CardDescription>
                </CardHeader>
                <CardContent className="pt-3 sm:pt-4 space-y-4">
                  {/* This Week Summary */}
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold mb-3">This Week</h3>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="p-3 rounded-lg border border-border/50 bg-card">
                        <p className="text-xs text-muted-foreground mb-1">Messages</p>
                        <p className="text-xl sm:text-2xl font-bold">{displayLevelData.totalMessagesCount}</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border/50 bg-card">
                        <p className="text-xs text-muted-foreground mb-1">Events</p>
                        <p className="text-xl sm:text-2xl font-bold">{displayLevelData.totalEventsAttended}</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border/50 bg-card">
                        <p className="text-xs text-muted-foreground mb-1">Squads</p>
                        <p className="text-xl sm:text-2xl font-bold">{userSquads.length}</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border/50 bg-card">
                        <p className="text-xs text-muted-foreground mb-1">Streak</p>
                        <p className="text-xl sm:text-2xl font-bold flex items-center gap-1">
                          {displayLevelData.loginStreak}
                          <Flame className="w-4 h-4 text-orange-500" />
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Achievements */}
                  {displayLevelData.achievements && displayLevelData.achievements.length > 0 && (
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold mb-3">Recent Achievements</h3>
                      <div className="space-y-2">
                        {displayLevelData.achievements.slice(0, 5).map((achievement: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 sm:gap-3 p-2.5 rounded-lg border border-border/50 bg-card">
                            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 rounded-full flex items-center justify-center">
                              <Award className="w-4 h-4 text-yellow-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-semibold truncate">{achievement.title || 'Achievement'}</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{achievement.description || 'Well done!'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {(!displayLevelData.achievements || displayLevelData.achievements.length === 0) && (
                    <div className="flex gap-2 sm:gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-muted/60 to-muted/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <Award className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-semibold mb-0.5">Start earning achievements!</p>
                        <p className="text-xs text-muted-foreground">Join squads, attend events, and stay active to unlock badges.</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            {/* SQUADS TAB */}
            <TabsContent value="squads">
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
                <CardHeader className="pb-3 sm:pb-4 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary"/> 
                        Your Squads
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">All your study communities</CardDescription>
                    </div>
                    <Link href="/groups">
                      <Button size="sm" className="h-7 sm:h-8 text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Discover</span>
                        <span className="sm:hidden">+</span>
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 sm:pt-4">
                  {userSquads.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3">
                      {userSquads.map((squad) => {
                        const isOwner = squad.ownerId === user?.id
                        return (
                          <Link key={squad.id} href={`/groups/${squad.id}`}>
                            <div className="flex gap-2 sm:gap-3 p-3 rounded-lg sm:rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all">
                              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center flex-shrink-0">
                                <span className="text-lg sm:text-xl font-bold">{squad.title.charAt(0)}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm sm:text-base font-semibold truncate">{squad.title}</p>
                                  {isOwner && (
                                    <Badge variant="secondary" className="h-4 text-[9px] px-1.5">Owner</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{squad.description}</p>
                                <div className="flex items-center gap-3 text-[10px] sm:text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {squad.memberCount || 0} members
                                  </span>
                                  {squad.category && (
                                    <span className="flex items-center gap-1">
                                      <Target className="w-3 h-3" />
                                      {squad.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col justify-center gap-2 shrink-0">
                                <Button variant="outline" size="sm" className="h-7 px-2 sm:px-3 text-xs">
                                  <span className="hidden sm:inline">Open</span>
                                  <span className="sm:hidden">→</span>
                                </Button>
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mb-4">
                        <Users className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold mb-2">No squads yet</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground text-center max-w-sm mb-4">
                        Join study groups to connect with classmates, find study partners, and ace your courses together.
                      </p>
                      <Link href="/groups">
                        <Button className="h-8 sm:h-9 text-xs sm:text-sm">
                          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          Discover Squads
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

const DashboardSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-24" />
      </div>

      <div className="mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-7 w-24" />
            </div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Skeleton className="h-10 w-full mb-8" />
    </div>
  </div>
)
