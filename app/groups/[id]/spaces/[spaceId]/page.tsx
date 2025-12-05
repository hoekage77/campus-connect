"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Crown,
  Hand,
  Radio,
  ArrowLeft,
  Users,
  Loader2,
  Settings,
  MessageSquare,
  Pin,
  PhoneOff,
  Sparkles,
  Zap,
  BookOpen,
  Coffee,
  Presentation,
  Code2,
  Users2,
  Scale,
  FileSearch,
  Volume2,
  Share2,
  Maximize2,
  ChevronUp,
  ChevronDown,
  Minimize2,
  X,
} from "lucide-react"
import type { Space, SpaceParticipant } from "@/types"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

// Import new components
import { useDailyCall } from "@/hooks/use-daily-call"
import { SPACE_LAYOUT_CONFIG, type SpaceLayoutConfig } from "@/components/spaces/layouts"
import { AudioOnlyLayout } from "@/components/spaces/layouts/audio-only-layout"
import { VideoGridLayout } from "@/components/spaces/layouts/video-grid-layout"
import { SplitScreenLayout } from "@/components/spaces/layouts/split-screen-layout"
import { SpeakerFocusLayout } from "@/components/spaces/layouts/speaker-focus-layout"
import { StageAudienceLayout } from "@/components/spaces/layouts/stage-audience-layout"
import { OneOnOneLayout } from "@/components/spaces/layouts/one-on-one-layout"
import { SpaceJumbotron, type FeaturedContent } from "@/components/spaces/jumbotron"
import { PinContentDialog } from "@/components/spaces/pin-content-dialog"

// Space type icons
const SPACE_TYPE_ICONS: Record<string, React.ReactNode> = {
  'study-session': <BookOpen className="h-4 w-4" />,
  'study-sprint': <BookOpen className="h-4 w-4" />,
  'office-hours': <Users2 className="h-4 w-4" />,
  'social-hangout': <Coffee className="h-4 w-4" />,
  'social': <Coffee className="h-4 w-4" />,
  'lecture': <Presentation className="h-4 w-4" />,
  'project-collab': <Code2 className="h-4 w-4" />,
  'collaboration': <Code2 className="h-4 w-4" />,
  'mentorship': <Sparkles className="h-4 w-4" />,
  'tutoring': <Sparkles className="h-4 w-4" />,
  'debate': <Scale className="h-4 w-4" />,
  'peer-review': <FileSearch className="h-4 w-4" />,
  'general': <Zap className="h-4 w-4" />,
}

// Gradient backgrounds per space type
const SPACE_GRADIENTS: Record<string, string> = {
  'study-session': 'from-blue-600/20 via-indigo-600/10 to-transparent',
  'study-sprint': 'from-blue-600/20 via-indigo-600/10 to-transparent',
  'office-hours': 'from-amber-600/20 via-orange-600/10 to-transparent',
  'social-hangout': 'from-pink-600/20 via-rose-600/10 to-transparent',
  'social': 'from-pink-600/20 via-rose-600/10 to-transparent',
  'lecture': 'from-purple-600/20 via-violet-600/10 to-transparent',
  'project-collab': 'from-emerald-600/20 via-teal-600/10 to-transparent',
  'collaboration': 'from-emerald-600/20 via-teal-600/10 to-transparent',
  'mentorship': 'from-cyan-600/20 via-sky-600/10 to-transparent',
  'tutoring': 'from-cyan-600/20 via-sky-600/10 to-transparent',
  'debate': 'from-red-600/20 via-orange-600/10 to-transparent',
  'peer-review': 'from-slate-600/20 via-gray-600/10 to-transparent',
  'general': 'from-zinc-600/20 via-neutral-600/10 to-transparent',
}

const SPACE_ACCENT_COLORS: Record<string, string> = {
  'study-session': 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  'study-sprint': 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  'office-hours': 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  'social-hangout': 'text-pink-400 border-pink-500/30 bg-pink-500/10',
  'social': 'text-pink-400 border-pink-500/30 bg-pink-500/10',
  'lecture': 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  'project-collab': 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  'collaboration': 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  'mentorship': 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  'tutoring': 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  'debate': 'text-red-400 border-red-500/30 bg-red-500/10',
  'peer-review': 'text-slate-400 border-slate-500/30 bg-slate-500/10',
  'general': 'text-zinc-400 border-zinc-500/30 bg-zinc-500/10',
}

interface SpaceWithParticipants extends Omit<Space, 'participants'> {
  participants: SpaceParticipant[]
  pinnedContent?: FeaturedContent | null
}

export default function SpacePage() {
  const params = useParams()
  const groupId = params.id as string
  const spaceId = params.spaceId as string
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  // Space data
  const [space, setSpace] = useState<SpaceWithParticipants | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [currentParticipant, setCurrentParticipant] = useState<SpaceParticipant | null>(null)
  const [access, setAccess] = useState<{ roomName: string; roomUrl: string; token?: string } | null>(null)
  const [connected, setConnected] = useState(false)

  // UI state
  const [pinnedContent, setPinnedContent] = useState<FeaturedContent | null>(null)
  const [showPinDialog, setShowPinDialog] = useState(false)
  const [showParticipants, setShowParticipants] = useState(true)
  const [showChat, setShowChat] = useState(false)
  const [handRaised, setHandRaised] = useState(false)
  const [controlsMinimized, setControlsMinimized] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Daily call hook
  const callContainerRef = useRef<HTMLDivElement>(null)
  const {
    isConnected: dailyConnected,
    audioEnabled,
    videoEnabled,
    screenSharing,
    participants: dailyParticipants,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    error: dailyError,
  } = useDailyCall({
    roomUrl: access?.roomUrl || '',
    token: access?.token,
    containerRef: callContainerRef,
    autoJoin: false,
    userName: user?.name || 'User',
  })

  // Get layout configuration based on space type
  const getLayoutConfig = (): SpaceLayoutConfig => {
    if (!space) return SPACE_LAYOUT_CONFIG['study-session'] || SPACE_LAYOUT_CONFIG['general']
    return SPACE_LAYOUT_CONFIG[space.type] || SPACE_LAYOUT_CONFIG['general']
  }

  const layoutConfig = getLayoutConfig()
  const layoutMode = layoutConfig.defaultLayout
  const spaceGradient = space ? SPACE_GRADIENTS[space.type] || SPACE_GRADIENTS['general'] : SPACE_GRADIENTS['general']
  const spaceAccent = space ? SPACE_ACCENT_COLORS[space.type] || SPACE_ACCENT_COLORS['general'] : SPACE_ACCENT_COLORS['general']
  const spaceIcon = space ? SPACE_TYPE_ICONS[space.type] || SPACE_TYPE_ICONS['general'] : SPACE_TYPE_ICONS['general']

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

      // Set pinned content if exists
      if (data.pinnedContent) {
        setPinnedContent(data.pinnedContent)
      }

      // Check if current user is a participant
      const participant = data.participants.find((p: SpaceParticipant) => p.userId === user?.id && !p.leftAt)
      setCurrentParticipant(participant || null)
      setConnected(!!participant)
      if (participant?.handRaised) {
        setHandRaised(participant.handRaised)
      }
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
          role: 'listener'
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

      setCurrentParticipant(result.participant || null)
      setAccess(result.access || null)
      setConnected(true)

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
      router.push(`/groups/${groupId}/spaces`)
    } catch (error) {
      console.error('Error leaving space:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to leave space",
        variant: "destructive",
      })
    }
  }

  const handleEndSpace = async () => {
    if (!space || space.hostId !== user?.id) return
    
    try {
      const response = await fetch(`/api/spaces/${spaceId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || '',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to end space')
      }

      toast({
        title: "Space ended",
        description: "The space has been ended for all participants",
      })

      router.push(`/groups/${groupId}/spaces`)
    } catch (error) {
      console.error('Error ending space:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to end space",
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

  const handlePinContent = async (content: { type: string; content: string; title?: string; metadata?: any }) => {
    try {
      const response = await fetch(`/api/spaces/${spaceId}/pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...content,
          userId: user?.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to pin content')
      }

      const data = await response.json()
      setPinnedContent(data.pinnedContent)
      setShowPinDialog(false)

      toast({
        title: "Content pinned",
        description: "The content is now visible to all participants",
      })
    } catch (error) {
      console.error('Error pinning content:', error)
      toast({
        title: "Error",
        description: "Failed to pin content",
        variant: "destructive",
      })
    }
  }

  const handleDismissPinned = async () => {
    try {
      const response = await fetch(`/api/spaces/${spaceId}/pin`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to unpin content')
      }

      setPinnedContent(null)

      toast({
        title: "Content unpinned",
        description: "The pinned content has been removed",
      })
    } catch (error) {
      console.error('Error unpinning content:', error)
      toast({
        title: "Error",
        description: "Failed to unpin content",
        variant: "destructive",
      })
    }
  }

  // Share space
  const handleShare = async () => {
    const shareUrl = window.location.href
    const shareData = {
      title: space?.title || 'Join my Space',
      text: `Join "${space?.title}" on Campus Connect`,
      url: shareUrl,
    }

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl)
        toast({
          title: "Link copied",
          description: "Space link copied to clipboard",
        })
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        // Copy to clipboard as fallback
        await navigator.clipboard.writeText(shareUrl)
        toast({
          title: "Link copied",
          description: "Space link copied to clipboard",
        })
      }
    }
  }

  // Toggle fullscreen
  const handleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
      toast({
        title: "Fullscreen unavailable",
        description: "Your browser doesn't support fullscreen mode",
        variant: "destructive",
      })
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Check if current user is host
  const isHost = currentParticipant?.role === 'host' || currentParticipant?.role === 'co-host'

  // Render loading state
  if (loading) {
    return (
      <div className="h-screen w-full bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Radio className="h-6 w-6 text-emerald-500 animate-pulse" />
            </div>
          </div>
          <p className="text-zinc-400 animate-pulse">Connecting to space...</p>
        </div>
      </div>
    )
  }

  // Render not found state
  if (!space) {
    return (
      <div className="h-screen w-full bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-20 w-20 bg-zinc-900/50 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto border border-white/10">
            <Radio className="h-10 w-10 text-zinc-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Space not found</h1>
          <p className="text-zinc-500">This space may have ended or doesn't exist</p>
          <Button 
            variant="outline" 
            onClick={() => router.push(`/groups/${groupId}/spaces`)}
            className="mt-4 bg-white/5 border-white/10 hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Spaces
          </Button>
        </div>
      </div>
    )
  }

  const activeParticipants = space.participants.filter(p => !p.leftAt)

  // Render layout based on space type
  const renderLayout = () => {
    // Transform Daily participants to unified interface
    const transformedDailyParticipants = dailyParticipants.map(p => ({
      id: p.user_id || p.session_id || 'unknown',
      name: p.user_name || 'Guest',
      audioEnabled: !!p.audio,
      videoEnabled: !!p.video,
      isHost: false,
      isSpeaking: false,
      handRaised: false,
    }))

    const transformedActiveParticipants = activeParticipants.map(p => ({
      id: p.id,
      name: p.userId === user?.id ? 'You' : `User ${p.userId.slice(-4)}`,
      audioEnabled: !p.audioMuted,
      videoEnabled: !p.videoMuted,
      isHost: p.role === 'host',
      isSpeaking: false,
      handRaised: p.handRaised || false,
    }))

    const commonProps = {
      participants: dailyParticipants.length > 0 ? transformedDailyParticipants : transformedActiveParticipants,
      activeSpeakerId: undefined,
      currentUserId: user?.id,
      hostId: space?.hostId,
      className: "h-full",
    }

    switch (layoutMode) {
      case 'audio-only':
        return <AudioOnlyLayout {...commonProps} />
      case 'video-grid':
        return <VideoGridLayout {...commonProps} />
      case 'split-screen':
        // Determine content panel based on space type
        const getContentPanel = (): 'whiteboard' | 'board' | 'pdf-viewer' | 'files' => {
          switch (space?.type) {
            case 'study-session':
            case 'study-sprint':
              return 'whiteboard'
            case 'project-collab':
            case 'collaboration':
              return 'board'
            case 'peer-review':
              return 'pdf-viewer'
            default:
              return 'whiteboard'
          }
        }
        return <SplitScreenLayout {...commonProps} contentPanel={getContentPanel()} />
      case 'speaker-focus':
        return <SpeakerFocusLayout {...commonProps} queueEnabled={space?.type === 'office-hours'} />
      case 'stage-audience':
        return <StageAudienceLayout {...commonProps} qaEnabled pollsEnabled />
      case 'one-on-one':
        return <OneOnOneLayout {...commonProps} />
      default:
        return <VideoGridLayout {...commonProps} />
    }
  }

  // Get space-type specific feature hints
  const getSpaceFeatureHint = () => {
    switch (space?.type) {
      case 'study-session':
        return { icon: <BookOpen className="h-3.5 w-3.5" />, text: 'Focus Mode', color: 'blue' }
      case 'office-hours':
        return { icon: <Users2 className="h-3.5 w-3.5" />, text: 'Queue Active', color: 'amber' }
      case 'social-hangout':
        return { icon: <Coffee className="h-3.5 w-3.5" />, text: 'Audio Only', color: 'pink' }
      case 'lecture':
        return { icon: <Presentation className="h-3.5 w-3.5" />, text: 'Stage Mode', color: 'purple' }
      case 'project-collab':
        return { icon: <Code2 className="h-3.5 w-3.5" />, text: 'Collaboration', color: 'emerald' }
      case 'mentorship':
        return { icon: <Sparkles className="h-3.5 w-3.5" />, text: '1-on-1 Mode', color: 'cyan' }
      case 'debate':
        return { icon: <Scale className="h-3.5 w-3.5" />, text: 'Debate Mode', color: 'red' }
      case 'peer-review':
        return { icon: <FileSearch className="h-3.5 w-3.5" />, text: 'Review Mode', color: 'slate' }
      default:
        return null
    }
  }

  const featureHint = getSpaceFeatureHint()

  return (
    <div className="fixed inset-0 w-full h-full bg-zinc-950 flex flex-col overflow-hidden z-50">
      {/* Animated gradient background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none transition-all duration-1000",
        spaceGradient
      )} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none" />

      {/* Glassmorphism Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="m-4 p-3 rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl h-10 w-10"
                onClick={() => router.push(`/groups/${groupId}/spaces`)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <div className="h-8 w-px bg-white/10" />
              
              <div className={cn("p-2 rounded-xl border", spaceAccent)}>
                {spaceIcon}
              </div>
              
              <div>
                <h1 className="text-white font-semibold text-base flex items-center gap-2">
                  {space.title}
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0 h-4 uppercase tracking-wider font-medium">
                    Live
                  </Badge>
                  {featureHint && (
                    <span className={cn(
                      "flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border",
                      featureHint.color === 'blue' && "bg-blue-500/10 text-blue-400 border-blue-500/30",
                      featureHint.color === 'amber' && "bg-amber-500/10 text-amber-400 border-amber-500/30",
                      featureHint.color === 'pink' && "bg-pink-500/10 text-pink-400 border-pink-500/30",
                      featureHint.color === 'purple' && "bg-purple-500/10 text-purple-400 border-purple-500/30",
                      featureHint.color === 'emerald' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
                      featureHint.color === 'cyan' && "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
                      featureHint.color === 'red' && "bg-red-500/10 text-red-400 border-red-500/30",
                      featureHint.color === 'slate' && "bg-slate-500/10 text-slate-400 border-slate-500/30"
                    )}>
                      {featureHint.icon}
                      {featureHint.text}
                    </span>
                  )}
                </h1>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {activeParticipants.length}
                  </span>
                  <span>•</span>
                  <span>{layoutConfig.label}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white/50 hover:text-white hover:bg-white/10 rounded-xl h-9 w-9"
                onClick={handleShare}
                title="Share space"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "rounded-xl h-9 w-9 transition-colors",
                  isFullscreen 
                    ? "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20" 
                    : "text-white/50 hover:text-white hover:bg-white/10"
                )}
                onClick={handleFullscreen}
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "rounded-xl h-9 w-9 transition-colors",
                  showSettings 
                    ? "text-white bg-white/10" 
                    : "text-white/50 hover:text-white hover:bg-white/10"
                )}
                onClick={() => setShowSettings(!showSettings)}
                title="Space settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex relative pt-20 pb-24">
        {/* Jumbotron - Fixed at top below header, not overlapping content */}
        {connected && (pinnedContent || isHost) && (
          <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-2">
            <div className="max-w-2xl mx-auto">
              <SpaceJumbotron
                content={pinnedContent}
                isHost={isHost}
                onDismiss={isHost ? handleDismissPinned : undefined}
                onAddContent={() => setShowPinDialog(true)}
              />
            </div>
          </div>
        )}

        {/* Layout Container */}
        <div className={cn(
          "flex-1 relative flex items-center justify-center p-4 transition-all duration-300",
          connected && (pinnedContent || isHost) && "pt-20" // Add padding when jumbotron visible
        )}>
          {connected ? (
            <>
              {/* Main layout */}
              <div className="w-full h-full max-w-7xl mx-auto">
                {renderLayout()}
              </div>
            </>
          ) : (
            // Glassmorphism Join prompt
            <div className="relative max-w-md mx-auto">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-emerald-500/20 rounded-[2rem] blur-2xl opacity-50" />
              
              <div className="relative text-center space-y-6 p-8 rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/10 shadow-2xl">
                <div className="relative mx-auto w-24 h-24">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                  <div className="absolute inset-2 bg-emerald-500/10 rounded-full animate-pulse" />
                  <div className="relative bg-zinc-900/80 backdrop-blur rounded-full w-24 h-24 flex items-center justify-center border border-emerald-500/30">
                    <Radio className="h-10 w-10 text-emerald-400" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">Ready to join?</h2>
                  <p className="text-zinc-400">
                    {layoutConfig.description}
                  </p>
                </div>

                {/* Pre-join settings */}
                <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-11 w-11 rounded-xl transition-all",
                      audioEnabled 
                        ? "bg-zinc-800 hover:bg-zinc-700 text-white" 
                        : "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                    )}
                    onClick={toggleAudio}
                  >
                    {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-11 w-11 rounded-xl transition-all",
                      videoEnabled 
                        ? "bg-zinc-800 hover:bg-zinc-700 text-white" 
                        : "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                    )}
                    onClick={toggleVideo}
                  >
                    {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>
                  <div className="h-8 w-px bg-white/10" />
                  <span className="text-xs text-zinc-500">
                    {audioEnabled ? 'Mic on' : 'Mic off'} • {videoEnabled ? 'Camera on' : 'Camera off'}
                  </span>
                </div>
                
                <Button 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl h-12 text-base font-medium shadow-lg shadow-emerald-900/30 border border-emerald-400/20"
                  onClick={handleJoinSpace}
                  disabled={joining}
                >
                  {joining ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Join {layoutConfig.label}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Glassmorphism Right Sidebar (Participants) 
            Hidden for layouts that already display participants inline:
            - split-screen: video grid shows participants (study-session, project-collab, peer-review)
            - stage-audience: audience panel shows participants (lecture, debate)
            - one-on-one: only 2 participants shown in layout (mentorship)
        */}
        {showParticipants && connected && 
          !['split-screen', 'stage-audience', 'one-on-one'].includes(layoutConfig.defaultLayout) && (
          <div className="w-80 m-4 ml-0 rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 flex flex-col hidden lg:flex overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-medium text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-zinc-400" />
                Participants
              </h3>
              <Badge variant="outline" className="bg-white/5 border-white/10 text-zinc-400 text-xs">
                {activeParticipants.length}
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {activeParticipants.map((participant) => (
                <div 
                  key={participant.id} 
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-9 w-9 ring-2 ring-white/10">
                        <AvatarFallback className="bg-gradient-to-br from-zinc-700 to-zinc-800 text-zinc-300 text-xs font-medium">
                          {participant.userId.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {!participant.audioMuted && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-zinc-900 flex items-center justify-center">
                          <Volume2 className="h-1.5 w-1.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-zinc-200 font-medium flex items-center gap-1.5">
                        {participant.userId === user?.id ? 'You' : `User ${participant.userId.slice(-4)}`}
                        {participant.role === 'host' && (
                          <Crown className="h-3 w-3 text-amber-400" />
                        )}
                      </span>
                      <span className="text-[10px] text-zinc-500 capitalize">{participant.role}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {participant.handRaised && (
                      <div className="p-1 rounded bg-amber-500/20 border border-amber-500/30">
                        <Hand className="h-3 w-3 text-amber-400" />
                      </div>
                    )}
                    {participant.audioMuted && (
                      <MicOff className="h-3.5 w-3.5 text-zinc-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Panel - Slides in from right */}
        {showChat && connected && (
          <div className="w-80 m-4 ml-0 rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 flex flex-col hidden lg:flex overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-medium text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-zinc-400" />
                Chat
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-400 hover:text-white"
                onClick={() => setShowChat(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* Sample messages - replace with real chat integration */}
              <div className="text-center text-xs text-zinc-500 py-4">
                Chat messages will appear here
              </div>
            </div>
            <div className="p-3 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50"
                />
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 px-3">
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Panel - Slides in from right */}
        {showSettings && connected && (
          <div className="w-80 m-4 ml-0 rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 flex flex-col hidden lg:flex overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-medium text-sm flex items-center gap-2">
                <Settings className="h-4 w-4 text-zinc-400" />
                Space Settings
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-400 hover:text-white"
                onClick={() => setShowSettings(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Audio Settings */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Audio</h4>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-sm text-zinc-300">Microphone</span>
                  <Button
                    size="sm"
                    variant={audioEnabled ? "default" : "destructive"}
                    className="h-7 text-xs"
                    onClick={toggleAudio}
                  >
                    {audioEnabled ? 'On' : 'Off'}
                  </Button>
                </div>
              </div>

              {/* Video Settings */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Video</h4>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-sm text-zinc-300">Camera</span>
                  <Button
                    size="sm"
                    variant={videoEnabled ? "default" : "destructive"}
                    className="h-7 text-xs"
                    onClick={toggleVideo}
                  >
                    {videoEnabled ? 'On' : 'Off'}
                  </Button>
                </div>
              </div>

              {/* Screen Share */}
              {layoutConfig.features.screenShare && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Screen Share</h4>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-sm text-zinc-300">Share Screen</span>
                    <Button
                      size="sm"
                      variant={screenSharing ? "default" : "secondary"}
                      className="h-7 text-xs"
                      onClick={toggleScreenShare}
                    >
                      {screenSharing ? 'Sharing' : 'Start'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Host Controls */}
              {isHost && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <h4 className="text-xs font-medium text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Host Controls
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-zinc-300 border-white/10 hover:bg-white/5"
                    onClick={() => {
                      setShowPinDialog(true)
                      setShowSettings(false)
                    }}
                  >
                    <Pin className="h-4 w-4 mr-2" />
                    Pin Content
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-red-400 border-red-500/30 hover:bg-red-500/10"
                    onClick={async () => {
                      // End space API call
                      try {
                        await fetch(`/api/spaces/${spaceId}`, {
                          method: 'DELETE',
                          headers: { 'x-user-id': user?.id || '' },
                        })
                        toast({ title: "Space ended", description: "The space has been closed" })
                        router.push(`/groups/${groupId}/spaces`)
                      } catch (e) {
                        toast({ title: "Error", description: "Failed to end space", variant: "destructive" })
                      }
                    }}
                  >
                    <PhoneOff className="h-4 w-4 mr-2" />
                    End Space for All
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Glassmorphism Bottom Control Bar - Minimizable */}
      {connected && (
        <div className={cn(
          "absolute left-0 right-0 z-50 pointer-events-none transition-all duration-300 ease-in-out",
          controlsMinimized ? "bottom-0" : "bottom-0"
        )}>
          <div className="flex flex-col items-center p-4 gap-2">
            {/* Minimize Toggle */}
            <button
              className="pointer-events-auto p-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-black/80 transition-all"
              onClick={() => setControlsMinimized(!controlsMinimized)}
            >
              {controlsMinimized ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {/* Full Controls */}
            <div className={cn(
              "flex items-center gap-2 p-2 rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/10 shadow-2xl pointer-events-auto transition-all duration-300",
              controlsMinimized ? "scale-90 opacity-0 translate-y-4 pointer-events-none h-0 p-0 overflow-hidden" : "scale-100 opacity-100 translate-y-0"
            )}>
              {/* Audio Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-xl transition-all",
                  audioEnabled 
                    ? "bg-zinc-800/80 hover:bg-zinc-700 text-white" 
                    : "bg-red-500/90 hover:bg-red-600 text-white"
                )}
                onClick={toggleAudio}
              >
                {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>

              {/* Video Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-xl transition-all",
                  videoEnabled 
                    ? "bg-zinc-800/80 hover:bg-zinc-700 text-white" 
                    : "bg-red-500/90 hover:bg-red-600 text-white"
                )}
                onClick={toggleVideo}
              >
                {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>

              <div className="w-px h-8 bg-white/10 mx-1" />

              {/* Hand Raise */}
              {layoutConfig.features.handRaise && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-12 w-12 rounded-xl transition-all",
                    handRaised 
                      ? "bg-amber-500 hover:bg-amber-600 text-black" 
                      : "text-zinc-400 hover:text-white hover:bg-white/10"
                  )}
                  onClick={handleRaiseHand}
                >
                  <Hand className="h-5 w-5" />
                </Button>
              )}

              {/* Screen Share */}
              {layoutConfig.features.screenShare && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-12 w-12 rounded-xl transition-all",
                    screenSharing 
                      ? "bg-blue-500 hover:bg-blue-600 text-white" 
                      : "text-zinc-400 hover:text-white hover:bg-white/10"
                  )}
                  onClick={toggleScreenShare}
                >
                  {screenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                </Button>
              )}

              {/* Pin Content (Host only) */}
              {isHost && layoutConfig.features.pinContent && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-xl text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                  onClick={() => setShowPinDialog(true)}
                >
                  <Pin className="h-5 w-5" />
                </Button>
              )}

              {/* Chat */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-xl transition-all",
                  showChat 
                    ? "bg-white/10 text-white" 
                    : "text-zinc-400 hover:text-white hover:bg-white/10"
                )}
                onClick={() => setShowChat(!showChat)}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>

              {/* Participants */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-xl transition-all",
                  showParticipants 
                    ? "bg-white/10 text-white" 
                    : "text-zinc-400 hover:text-white hover:bg-white/10"
                )}
                onClick={() => setShowParticipants(!showParticipants)}
              >
                <Users className="h-5 w-5" />
              </Button>

              <div className="w-px h-8 bg-white/10 mx-1" />

              {/* Leave / End Space */}
              {isHost ? (
                <Button
                  className="h-12 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium"
                  onClick={handleEndSpace}
                >
                  <PhoneOff className="h-5 w-5 mr-2" />
                  End Space
                </Button>
              ) : (
                <Button
                  className="h-12 px-5 rounded-xl bg-red-500/90 hover:bg-red-600 text-white font-medium"
                  onClick={handleLeaveSpace}
                >
                  <PhoneOff className="h-5 w-5 mr-2" />
                  Leave
                </Button>
              )}
            </div>

            {/* Minimized Controls - Compact */}
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/60 backdrop-blur-2xl border border-white/10 shadow-2xl pointer-events-auto transition-all duration-300",
              controlsMinimized ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 -translate-y-4 pointer-events-none absolute h-0 overflow-hidden"
            )}>
              {/* Compact Audio Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9 rounded-lg transition-all",
                  audioEnabled 
                    ? "bg-zinc-800/80 hover:bg-zinc-700 text-white" 
                    : "bg-red-500/90 hover:bg-red-600 text-white"
                )}
                onClick={toggleAudio}
              >
                {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>

              {/* Compact Video Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9 rounded-lg transition-all",
                  videoEnabled 
                    ? "bg-zinc-800/80 hover:bg-zinc-700 text-white" 
                    : "bg-red-500/90 hover:bg-red-600 text-white"
                )}
                onClick={toggleVideo}
              >
                {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>

              <div className="w-px h-5 bg-white/10" />

              {/* Compact Leave */}
              <Button
                size="sm"
                className="h-9 px-3 rounded-lg bg-red-500/90 hover:bg-red-600 text-white text-xs font-medium"
                onClick={handleLeaveSpace}
              >
                <PhoneOff className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pin Content Dialog */}
      <PinContentDialog
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        onSubmit={async (content) => {
          try {
            const response = await fetch(`/api/spaces/${spaceId}/pin`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: content.type,
                title: content.title,
                content: content.content,
                url: content.url,
                userId: user?.id,
              }),
            })

            if (!response.ok) {
              throw new Error('Failed to pin content')
            }

            const data = await response.json()
            setPinnedContent(data.pinnedContent)

            toast({
              title: "Content pinned",
              description: "The content is now visible to all participants",
            })
          } catch (error) {
            console.error('Error pinning content:', error)
            toast({
              title: "Error",
              description: "Failed to pin content",
              variant: "destructive",
            })
          }
        }}
      />
    </div>
  )
}
