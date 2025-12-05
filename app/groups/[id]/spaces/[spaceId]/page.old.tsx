"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Hand,
  PhoneOff,
  Settings,
  Crown,
  User,
  Users,
  Radio,
  ArrowLeft,
  Volume2,
  VolumeX,
  Loader2
} from "lucide-react"
import type { Space, SpaceParticipant } from "@/types"
import { useAuth } from "@/hooks/use-auth"
import DailyIframe from "@daily-co/daily-js"

interface SpaceWithParticipants extends Space {
  participants: SpaceParticipant[]
}

export default function SpacePage() {
  const params = useParams()
  const groupId = params.id as string
  const spaceId = params.spaceId as string
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  const [space, setSpace] = useState<SpaceWithParticipants | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [currentParticipant, setCurrentParticipant] = useState<SpaceParticipant | null>(null)
  const [access, setAccess] = useState<{ roomName: string; roomUrl: string; token?: string } | null>(null)

  // Daily call frame and media state
  const callContainerRef = useRef<HTMLDivElement | null>(null)
  const callFrameRef = useRef<any>(null)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(false)
  const [handRaised, setHandRaised] = useState(false)
  const [connected, setConnected] = useState(false)

  // Fetch space details
  const fetchSpace = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/spaces/${spaceId}`, {
        headers: {
          'x-user-id': user?.id || '',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Space not found",
            description: "This space may have ended",
            variant: "destructive",
          })
          router.push(`/groups/${groupId}/spaces`)
          return
        }
        throw new Error('Failed to fetch space')
      }

      const data = await response.json()
      setSpace(data)

      // Check if current user is a participant
      const participant = data.participants.find((p: SpaceParticipant) => p.userId === user?.id && !p.leftAt)
      setCurrentParticipant(participant || null)
      setConnected(!!participant)
    } catch (error) {
      console.error('Error fetching space:', error)
      toast({
        title: "Error",
        description: "Failed to load space",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [spaceId, user?.id, toast, router, groupId])

  useEffect(() => {
    if (user?.id) {
      fetchSpace()
    }

    return () => {
      // Cleanup Daily on unmount
      try { callFrameRef.current?.leave?.() } catch {}
      try { callFrameRef.current?.destroy?.() } catch {}
      callFrameRef.current = null
    }
  }, [fetchSpace, user?.id])

  const handleJoinSpace = async () => {
    try {
      setJoining(true)
      const response = await fetch(`/api/spaces/${spaceId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          role: 'listener' // Default role
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to join space')
      }

      const result = await response.json()

      toast({
        title: "Joined space",
        description: "Welcome to the space!",
      })

      // API returns { space, participant, participantCount, access }
      setCurrentParticipant(result.participant || null)
      setAccess(result.access || null)
      setConnected(true)

      // Spin up Daily call frame
      if (result.access?.roomUrl) {
        // Clean up any existing frame
        try { await callFrameRef.current?.leave?.(); } catch {}
        try { callFrameRef.current?.destroy?.(); } catch {}

        const cf = DailyIframe.createFrame(callContainerRef.current!, {
          showLeaveButton: false,
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: '0',
            borderRadius: '0.5rem',
            backgroundColor: 'transparent',
          },
        })

        // Register key events
        cf.on('joined-meeting', () => setConnected(true))
        cf.on('left-meeting', () => setConnected(false))
        cf.on('error', async (ev: any) => {
          // Basic token refresh + rejoin strategy on auth errors
          if (ev?.error?.type?.includes('token') || ev?.error?.type?.includes('auth')) {
            try {
              const fresh = await fetch(`/api/spaces/${spaceId}/token`, {
                method: 'POST',
                headers: { 'x-user-id': user?.id || '' },
              })
              if (fresh.ok) {
                const json = await fresh.json()
                const next = json?.access
                if (next?.token) {
                  try { await cf.leave() } catch {}
                  await cf.join({ url: next.roomUrl, token: next.token })
                  setAccess(next)
                }
              }
            } catch (e) {
              console.warn('[Daily] token refresh failed', e)
            }
          }
        })

        callFrameRef.current = cf
        await cf.join({ url: result.access.roomUrl, token: result.access.token })
      }

      // Refresh space data
      fetchSpace()
    } catch (error) {
      console.error('Error joining space:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join space",
        variant: "destructive",
      })
    } finally {
      setJoining(false)
    }
  }

  const handleLeaveSpace = async () => {
    try {
      // Leave Daily call first
      try { await callFrameRef.current?.leave?.() } catch {}
      try { callFrameRef.current?.destroy?.() } catch {}
      callFrameRef.current = null

      const response = await fetch(`/api/spaces/${spaceId}/leave`, {
        method: 'POST',
        headers: {
          'x-user-id': user?.id || '',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to leave space')
      }

      toast({
        title: "Left space",
        description: "You have left the space",
      })

      setCurrentParticipant(null)
      setConnected(false)

      // Refresh space data
      fetchSpace()
    } catch (error) {
      console.error('Error leaving space:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to leave space",
        variant: "destructive",
      })
    }
  }

  const handleRaiseHand = async () => {
    try {
      const newHandRaised = !handRaised
      const response = await fetch(`/api/spaces/${spaceId}/hand`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          handRaised: newHandRaised
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update hand raise')
      }

      setHandRaised(newHandRaised)

      toast({
        title: newHandRaised ? "Hand raised" : "Hand lowered",
        description: newHandRaised ? "The host will see your raised hand" : "Hand lowered",
      })

      // Refresh space data
      fetchSpace()
    } catch (error) {
      console.error('Error updating hand raise:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update hand raise",
        variant: "destructive",
      })
    }
  }

  const getRoleIcon = (role: SpaceParticipant['role']) => {
    switch (role) {
      case 'host':
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 'co-host':
        return <Settings className="h-4 w-4 text-blue-500" />
      case 'speaker':
        return <Mic className="h-4 w-4 text-green-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleLabel = (role: SpaceParticipant['role']) => {
    switch (role) {
      case 'host':
        return 'Host'
      case 'co-host':
        return 'Co-Host'
      case 'speaker':
        return 'Speaker'
      default:
        return 'Listener'
    }
  }

  if (loading) {
    return (
      <div className="h-screen w-full bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          <p className="text-zinc-400 animate-pulse">Connecting to space...</p>
        </div>
      </div>
    )
  }

  if (!space) {
    return (
      <div className="h-screen w-full bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto">
            <Radio className="h-8 w-8 text-zinc-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Space not found</h1>
          <Button variant="outline" onClick={() => router.push(`/groups/${groupId}/spaces`)}>
            Return to Spaces
          </Button>
        </div>
      </div>
    )
  }

  const activeParticipants = space.participants.filter(p => !p.leftAt)

  return (
    <div className="fixed inset-0 w-full h-full bg-zinc-950 flex flex-col overflow-hidden z-50">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
            onClick={() => router.push(`/groups/${groupId}/spaces`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-white font-semibold text-lg flex items-center gap-2">
              {space.title}
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs px-2 py-0.5 h-5">
                LIVE
              </Badge>
            </h1>
            <p className="text-white/50 text-xs">{activeParticipants.length} participants</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 pointer-events-auto">
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10 rounded-full">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex relative">
        {/* Video Grid / Stage */}
        <div className="flex-1 bg-zinc-900/50 relative flex items-center justify-center p-4">
          {connected ? (
            <div className="w-full h-full max-w-6xl mx-auto relative rounded-2xl overflow-hidden bg-zinc-950 shadow-2xl ring-1 ring-white/10">
              <div ref={callContainerRef} className="w-full h-full" />
              
              {/* Overlay info if needed */}
              {!videoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Avatar className="h-32 w-32 ring-4 ring-zinc-800">
                    <AvatarFallback className="bg-zinc-800 text-zinc-400 text-4xl">
                      {user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-6 max-w-md mx-auto p-8 rounded-3xl bg-zinc-900/50 backdrop-blur border border-white/5">
              <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                <div className="relative bg-zinc-950 rounded-full w-24 h-24 flex items-center justify-center border border-emerald-500/30">
                  <Radio className="h-10 w-10 text-emerald-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Ready to join?</h2>
                <p className="text-zinc-400">You are about to enter the live space. Your mic and camera will be off by default.</p>
              </div>
              <Button 
                size="lg" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-full h-12 text-base font-medium shadow-lg shadow-emerald-900/20"
                onClick={handleJoinSpace}
                disabled={joining}
              >
                {joining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Join Space"
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Right Sidebar (Chat/Participants) - Hidden on mobile by default in future */}
        <div className="w-80 bg-zinc-950 border-l border-white/10 flex flex-col hidden lg:flex">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-white font-medium text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-zinc-400" />
              Participants
              <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-0.5 rounded-full ml-auto">
                {activeParticipants.length}
              </span>
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {activeParticipants.map((participant) => (
              <div key={participant.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 group">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 ring-1 ring-white/10">
                    <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs">
                      {participant.userId.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm text-zinc-200 font-medium flex items-center gap-1.5">
                      {participant.userId === user?.id ? 'You' : `User ${participant.userId.slice(-4)}`}
                      {participant.role === 'host' && <Crown className="h-3 w-3 text-amber-400" />}
                    </span>
                    <span className="text-[10px] text-zinc-500 capitalize">{participant.role}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {participant.handRaised && <Hand className="h-3 w-3 text-amber-400" />}
                  {!participant.audioMuted ? (
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  ) : (
                    <MicOff className="h-3 w-3 text-zinc-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Control Bar */}
      {connected && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 p-2 rounded-2xl bg-zinc-900/90 backdrop-blur border border-white/10 shadow-2xl">
            <Button
              variant={audioEnabled ? "secondary" : "destructive"}
              size="icon"
              className={`rounded-xl h-12 w-12 transition-all ${audioEnabled ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : ''}`}
              onClick={() => setAudioEnabled(!audioEnabled)}
            >
              {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>

            <Button
              variant={videoEnabled ? "secondary" : "destructive"}
              size="icon"
              className={`rounded-xl h-12 w-12 transition-all ${videoEnabled ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : ''}`}
              onClick={() => setVideoEnabled(!videoEnabled)}
            >
              {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>

            <div className="w-px h-8 bg-white/10 mx-1" />

            <Button
              variant={handRaised ? "default" : "ghost"}
              size="icon"
              className={`rounded-xl h-12 w-12 transition-all ${handRaised ? 'bg-amber-500 hover:bg-amber-600 text-black' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
              onClick={handleRaiseHand}
            >
              <Hand className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl h-12 w-12 text-zinc-400 hover:text-white hover:bg-white/10"
            >
              <Monitor className="h-5 w-5" />
            </Button>

            <div className="w-px h-8 bg-white/10 mx-1" />

            <Button
              variant="destructive"
              size="lg"
              className="rounded-xl h-12 px-6 bg-red-500/90 hover:bg-red-600"
              onClick={handleLeaveSpace}
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              Leave
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}