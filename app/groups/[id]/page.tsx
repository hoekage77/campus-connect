"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { MessageSquare, Users, Settings, ArrowLeft, Loader2, Globe, Lock, Eye, Radio, Plus, Mic, Video, Monitor, BookOpen, Coffee, Presentation, Code2, Users2, Sparkles, Scale, FileSearch, GraduationCap, Play } from "lucide-react"
import { Icon } from "@iconify/react"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { useGroup, useJoinGroup, useLeaveGroup, useChatRooms, useCreateChatRoom } from "@/hooks/use-queries"
import { getGroupSessions, createGroupSession } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"
import { events } from "@/lib/event-emitter"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SquadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const squadId = params?.id as string
  const { toast } = useToast()
  const { user, refresh: refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [joinedSuccessfully, setJoinedSuccessfully] = useState(false)

  // Fetch group data
  const { data: squad, isLoading, error, fetch: refetchSquad } = useGroup(squadId || null)
  const members = squad?.members || []
  const creator = squad?.creator

  const { data: rooms, isLoading: roomsLoading, error: roomsError, fetch: refetchRooms } = useChatRooms(squadId || null)
  const { mutate: createRoom, isLoading: isCreatingRoom } = useCreateChatRoom()
  const [newRoomName, setNewRoomName] = useState("")
  const [newRoomType, setNewRoomType] = useState<'general' | 'resources' | 'announcements' | 'custom'>('custom')
  const [sessions, setSessions] = useState<any[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [creatingSession, setCreatingSession] = useState(false)
  const [sessionForm, setSessionForm] = useState({ title: '', description: '', location: '', startAt: '', endAt: '', privacy: 'public' as 'public' | 'invite-only', capacity: '' })
  
  // Spaces state
  const [spaces, setSpaces] = useState<any[]>([])
  const [loadingSpaces, setLoadingSpaces] = useState(true)
  
  // Membership state MUST be before any early returns
  const [isCurrentUserMember, setIsCurrentUserMember] = useState(false)
  useEffect(() => {
    setIsCurrentUserMember(
      !!(user && members.some((m) => m.userId === user.id))
    )
  }, [user, members])

  // Auto-redirect to chat when openChat param is present
  useEffect(() => {
    const shouldOpenChat = searchParams.get('openChat') === 'true'
    if (shouldOpenChat && rooms && rooms.length > 0 && !roomsLoading) {
      // Find the general room or use the first room
      const preferredRoom = rooms.find((r) => r.name?.toLowerCase() === 'general') || rooms[0]
      // Redirect to the chat room and remove the query param
      router.replace(`/groups/${squadId}/chat/${preferredRoom.id}`)
    }
  }, [searchParams, rooms, roomsLoading, squadId, router])

  // Join group mutation
  const { mutate: joinSquad, isLoading: isJoining } = useJoinGroup()

  // Leave group mutation
  const { mutate: leaveSquad, isLoading: isLeaving } = useLeaveGroup()

  const handleJoinSquad = async () => {
    console.log("[UI] Join button clicked", { squadId, user, userId: user?.id })
    
    if (!user) {
      console.log("[UI] No user, redirecting to login")
      router.push("/login")
      return
    }

    if (!user.id) {
      console.error("[UI] User object missing id field:", user)
      toast({
        title: "⚠️ Error",
        description: "User session invalid. Please refresh the page.",
        variant: "destructive",
      })
      return
    }

    if (!squad) {
      console.log("[UI] Squad data not loaded")
      return
    }

    try {
      console.log("[UI] Calling joinSquad...", { squadId, userId: user.id })
      await joinSquad(squadId, user.id)
      console.log("[UI] joinSquad completed successfully")

      // Optimistic update: flip button immediately
      setIsCurrentUserMember(true)

      toast({
        title: "✨ Success",
        description: `You've joined ${squad.title}!`,
      })

      console.log("[UI] Refetching squad data...")
      const refetchedData = await refetchSquad()
      console.log("[UI] Squad data refetched:", { 
        memberCount: refetchedData?.members?.length, 
        members: refetchedData?.members,
        includesCurrentUser: refetchedData?.members?.some((m: any) => m.userId === user?.id)
      })
      
      // Refresh user to get updated squads array
      refreshUser()
      
      // Emit event to update dashboard
      events.userJoinedGroup(squadId)
    } catch (error) {
      console.error("[UI] Error joining squad:", error)
      toast({
        title: "⚠️ Error",
        description: error instanceof Error ? error.message : "Failed to join squad",
        variant: "destructive",
      })
    }
  }

  const handleLeaveSquad = async () => {
    console.log("[UI] Leave button clicked", { squadId, userId: user?.id })
    
    if (!user) {
      console.log("[UI] No user, redirecting to login")
      router.push("/login")
      return
    }

    if (!squad) {
      console.log("[UI] Squad data not loaded")
      return
    }

    try {
      console.log("[UI] Calling leaveSquad...", { squadId, userId: user.id })
      await leaveSquad(squadId, user.id)
      console.log("[UI] leaveSquad completed successfully")

      // Optimistic update: flip button immediately
      setIsCurrentUserMember(false)

      toast({
        title: "✨ Success",
        description: `You've left ${squad.title}!`,
      })

      console.log("[UI] Refetching squad data...")
      await refetchSquad()
      console.log("[UI] Squad data refetched")
      
      // Refresh user to get updated squads array
      refreshUser()
      
      // Emit event to update dashboard
      events.userLeftGroup(squadId)
    } catch (error) {
      console.error("[UI] Error leaving squad:", error)
      toast({
        title: "⚠️ Error",
        description: error instanceof Error ? error.message : "Failed to leave squad",
        variant: "destructive",
      })
    }
  }

  // Load sessions for this squad
  const loadSessions = async () => {
    if (!squadId) return
    try {
      setLoadingSessions(true)
      const data = await getGroupSessions(squadId)
      setSessions(data)
    } catch (err) {
      console.error('[UI] Failed to load sessions', err)
    } finally {
      setLoadingSessions(false)
    }
  }

  // Load spaces for this squad
  const loadSpaces = async () => {
    if (!squadId) return
    try {
      setLoadingSpaces(true)
      const response = await fetch(`/api/groups/${squadId}/spaces`, {
        headers: {
          'x-user-id': user?.id || '',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setSpaces(data)
      }
    } catch (err) {
      console.error('[UI] Failed to load spaces', err)
    } finally {
      setLoadingSpaces(false)
    }
  }

  useEffect(() => {
    if (squadId) {
      loadSessions()
      loadSpaces()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [squadId])

  // Reload spaces when user becomes available (for auth)
  useEffect(() => {
    if (squadId && user?.id) {
      loadSpaces()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  if (isLoading) {
    return <SquadDetailSkeleton />
  }

  if (error || !squad) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{error || "Squad not found"}</EmptyTitle>
            <EmptyDescription>
              The squad you are looking for does not exist or could not be loaded.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href="/groups">
              <Button variant="outline">Back to Squads</Button>
            </Link>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  // isCurrentUserMember already initialized above

  // Check if current user is a member
  const isOwner = user && squad.ownerId === user.id

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!squadId || !newRoomName.trim()) return
    try {
      await createRoom(squadId, { name: newRoomName.trim(), type: newRoomType })
      setNewRoomName("")
      await refetchRooms()
      toast({ title: "Room created", description: `#${newRoomName} is ready` })
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : 'Failed to create room', variant: 'destructive' })
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 h-64 w-64 rounded-full bg-gradient-to-br from-primary/25 to-primary/0 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-accent/25 to-accent/0 blur-3xl" />
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/groups"
            className="inline-flex items-center gap-2 mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Squads
          </Link>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-4xl font-bold">{squad.title}</h1>
                {squad.privacy && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-full">
                    {squad.privacy === 'public' ? (
                      <>
                        <Globe className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-medium text-muted-foreground">Public</span>
                      </>
                    ) : squad.privacy === 'invite-only' ? (
                      <>
                        <Eye className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-medium text-muted-foreground">Invite Only</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-medium text-muted-foreground">Private</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <p className="text-lg text-muted-foreground mb-4">{squad.description}</p>
              <div className="flex flex-wrap gap-2">
                {squad.topics.map((interest) => (
                  <Badge key={interest}>{interest}</Badge>
                ))}
              </div>
            </div>
            {isCurrentUserMember ? (
              <Button size="lg" variant="destructive" onClick={handleLeaveSquad} disabled={isLeaving} type="button">
                {isLeaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Leaving...
                  </>
                ) : (
                  "Leave Squad"
                )}
              </Button>
            ) : (
              <Button size="lg" onClick={handleJoinSquad} disabled={isJoining} type="button">
                {isJoining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Squad"
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="mb-4 flex flex-wrap gap-2">
            <TabsTrigger value="overview" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="spaces" className="gap-2">
              <Radio className="w-4 h-4" />
              <span className="hidden sm:inline">Spaces</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2">
              <span className="hidden sm:inline">Sessions</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Members</span>
            </TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-4">
            {isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle>Create a session</CardTitle>
                  <CardDescription>Organize an event for this squad</CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault()
                      if (!squadId) return
                      try {
                        setCreatingSession(true)
                        await createGroupSession(squadId, {
                          title: sessionForm.title,
                          description: sessionForm.description,
                          location: sessionForm.location,
                          startAt: sessionForm.startAt,
                          endAt: sessionForm.endAt,
                          privacy: sessionForm.privacy,
                          capacity: sessionForm.capacity ? Number(sessionForm.capacity) : undefined,
                        } as any)
                        setSessionForm({ title: '', description: '', location: '', startAt: '', endAt: '', privacy: 'public', capacity: '' })
                        await loadSessions()
                        toast({ title: 'Session created' })
                      } catch (err) {
                        toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to create session', variant: 'destructive' })
                      } finally {
                        setCreatingSession(false)
                      }
                    }}
                    className="grid md:grid-cols-2 gap-3"
                  >
                    <div>
                      <Label htmlFor="s-title">Title</Label>
                      <Input id="s-title" value={sessionForm.title} onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="s-location">Location</Label>
                      <Input id="s-location" value={sessionForm.location} onChange={(e) => setSessionForm({ ...sessionForm, location: e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="s-desc">Description</Label>
                      <Input id="s-desc" value={sessionForm.description} onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })} />
                    </div>
                    <div>
                      <Label>Start</Label>
                      <Input type="datetime-local" value={sessionForm.startAt} onChange={(e) => setSessionForm({ ...sessionForm, startAt: e.target.value })} />
                    </div>
                    <div>
                      <Label>End</Label>
                      <Input type="datetime-local" value={sessionForm.endAt} onChange={(e) => setSessionForm({ ...sessionForm, endAt: e.target.value })} />
                    </div>
                    <div>
                      <Label>Privacy</Label>
                      <select className="border rounded-md h-10 px-2 bg-background w-full" value={sessionForm.privacy} onChange={(e) => setSessionForm({ ...sessionForm, privacy: e.target.value as any })}>
                        <option value="public">Public</option>
                        <option value="invite-only">Invite Only</option>
                      </select>
                    </div>
                    <div>
                      <Label>Capacity</Label>
                      <Input type="number" placeholder="optional" value={sessionForm.capacity} onChange={(e) => setSessionForm({ ...sessionForm, capacity: e.target.value })} />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <Button type="submit" disabled={creatingSession}>{creatingSession ? 'Creating…' : 'Create Session'}</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Upcoming sessions</CardTitle>
                <CardDescription>Events scheduled for this squad</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSessions ? (
                  <p className="text-sm text-muted-foreground">Loading sessions…</p>
                ) : sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sessions yet.</p>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((s) => (
                      <div key={s.id} className="flex items-center justify-between border rounded-md p-3">
                        <div>
                          <div className="font-medium">{s.title}</div>
                          <div className="text-xs text-muted-foreground">{new Date(s.startAt).toLocaleString()} – {new Date(s.endAt).toLocaleString()} • {s.location}</div>
                        </div>
                        <Link href={`/sessions/${s.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Spaces Tab */}
          <TabsContent value="spaces" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Live Spaces</h3>
                <p className="text-sm text-muted-foreground">Real-time audio/video study rooms</p>
              </div>
              {isCurrentUserMember && (
                <Link href={`/groups/${squadId}/spaces`}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Space
                  </Button>
                </Link>
              )}
            </div>

            {loadingSpaces ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : spaces.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Radio className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h4 className="font-semibold mb-2">No Active Spaces</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start a live audio/video room for your squad
                    </p>
                    {isCurrentUserMember && (
                      <Link href={`/groups/${squadId}/spaces`}>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Space
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {spaces.map((space) => {
                  const typeIcons: Record<string, React.ReactNode> = {
                    'study-session': <BookOpen className="h-4 w-4" />,
                    'study-sprint': <Play className="h-4 w-4" />,
                    'office-hours': <GraduationCap className="h-4 w-4" />,
                    'social-hangout': <Coffee className="h-4 w-4" />,
                    'social': <Coffee className="h-4 w-4" />,
                    'lecture': <Presentation className="h-4 w-4" />,
                    'project-collab': <Code2 className="h-4 w-4" />,
                    'collaboration': <Code2 className="h-4 w-4" />,
                    'mentorship': <Sparkles className="h-4 w-4" />,
                    'tutoring': <Users2 className="h-4 w-4" />,
                    'debate': <Scale className="h-4 w-4" />,
                    'peer-review': <FileSearch className="h-4 w-4" />,
                    'general': <Radio className="h-4 w-4" />,
                  }
                  const typeLabels: Record<string, string> = {
                    'study-session': 'Study Session',
                    'study-sprint': 'Study Sprint',
                    'office-hours': 'Office Hours',
                    'social-hangout': 'Social Hangout',
                    'social': 'Social',
                    'lecture': 'Lecture',
                    'project-collab': 'Project Collab',
                    'collaboration': 'Collaboration',
                    'mentorship': 'Mentorship',
                    'tutoring': 'Tutoring',
                    'debate': 'Debate',
                    'peer-review': 'Peer Review',
                    'general': 'General',
                  }
                  return (
                    <Card key={space.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {typeIcons[space.type] || <Radio className="h-4 w-4" />}
                            <CardTitle className="text-base truncate">{space.title}</CardTitle>
                          </div>
                          <Badge variant={space.status === 'live' ? 'default' : 'secondary'}>
                            {space.status === 'live' ? 'Live' : space.status}
                          </Badge>
                        </div>
                        {space.description && (
                          <CardDescription className="line-clamp-2 text-sm">{space.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              {space.privacy === 'public' ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                              <span className="capitalize">{space.privacy}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{space.activeParticipantCount || 0}/{space.maxParticipants}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {typeLabels[space.type] || 'General'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {space.audioEnabled && <Mic className="h-3 w-3 text-green-500" />}
                          {space.videoEnabled && <Video className="h-3 w-3 text-green-500" />}
                          {space.screenShareEnabled && <Monitor className="h-3 w-3 text-green-500" />}
                        </div>
                        <Link href={`/groups/${squadId}/spaces/${space.id}`}>
                          <Button className="w-full" size="sm">
                            Join Space
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{squad.memberCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Chat Rooms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{rooms?.length ?? 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Created</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium">
                    {new Date(squad.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>About This Squad</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{squad.description}</p>
                {creator && (
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={creator.avatar} alt={creator.name} />
                      <AvatarFallback>{creator.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold">{creator.name}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            {isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle>Create a room</CardTitle>
                  <CardDescription>Only squad owners can create rooms (moderators soon)</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateRoom} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <Label htmlFor="roomName">Room name</Label>
                      <Input id="roomName" placeholder="e.g. general, homework-help" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} />
                    </div>
                    <div>
                      <Label className="sr-only">Type</Label>
                      <select
                        className="border rounded-md h-10 px-2 bg-background"
                        value={newRoomType}
                        onChange={(e) => setNewRoomType(e.target.value as any)}
                      >
                        <option value="custom">Custom</option>
                        <option value="general">General</option>
                        <option value="resources">Resources</option>
                        <option value="announcements">Announcements</option>
                      </select>
                    </div>
                    <Button type="submit" disabled={isCreatingRoom || !newRoomName.trim()}>
                      {isCreatingRoom ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Room'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {roomsLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">Loading rooms…</p>
                </CardContent>
              </Card>
            ) : (rooms && rooms.length > 0 ? (
              <div className="grid gap-4">
                {rooms.map((room: any) => (
                  <Card key={room.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">#{room.name}</CardTitle>
                          {room.topic && <CardDescription>{room.topic}</CardDescription>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{room.topic || "Chat room"}</p>
                      <Link href={`/groups/${squadId}/chat/${room.id}`}>
                        <Button variant="outline" className="w-full bg-transparent">
                          Enter Chat →
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    {isCurrentUserMember ? 'No chat rooms yet' : 'Join this squad to view or participate in chat rooms'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Squad Members ({members.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {members.map((member) => {
                  const userData = member.user
                  if (!userData) return null
                  return (
                    <Link
                      key={member.id}
                      href={`/users/${userData.id}`}
                      className="flex items-center justify-between rounded-md p-2 hover:bg-accent/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="ring-2 ring-transparent group-hover:ring-primary/40 transition-shadow">
                          <AvatarImage src={userData.avatar || ""} alt={userData.name || ""} />
                          <AvatarFallback>{userData.name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold group-hover:text-primary transition-colors">{userData.name || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">@{userData.username || "unknown"}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="group-hover:border-primary/50 group-hover:text-primary">
                        View Profile
                      </Button>
                    </Link>
                  )
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Updates and events related to the squad.</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Activity feed coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

const SquadDetailSkeleton = () => (
  <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="mb-8">
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <Skeleton className="h-10 w-3/4 mb-3" />
          <Skeleton className="h-6 w-full mb-4" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
        <Skeleton className="h-12 w-32" />
      </div>
    </div>
    <Skeleton className="h-10 w-full mb-8" />
    <div className="grid md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-1/2" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-1/2" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-24" />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
)
