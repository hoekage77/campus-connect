/**
 * Video Grid Layout
 * 
 * Default layout showing all participants in a responsive grid.
 * Used as fallback and for general space types.
 */

"use client"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MicOff, VideoOff, Crown, Monitor, Hand } from "lucide-react"
import type { SpaceLayoutParticipant } from "@/types/spaces"

// Extended participant interface with screen sharing support
interface LayoutParticipant extends SpaceLayoutParticipant {
  isScreenSharing?: boolean
}

interface VideoGridLayoutProps {
  participants: LayoutParticipant[]
  activeSpeakerId?: string
  currentUserId?: string
  hostId?: string
  compact?: boolean
  className?: string
}

export function VideoGridLayout({
  participants,
  activeSpeakerId,
  currentUserId,
  hostId,
  compact = false,
  className,
}: VideoGridLayoutProps) {
  const count = participants.length

  // Determine grid columns based on participant count
  const getGridCols = () => {
    if (count === 1) return 'grid-cols-1'
    if (count === 2) return 'grid-cols-2'
    if (count <= 4) return 'grid-cols-2'
    if (count <= 6) return 'grid-cols-3'
    if (count <= 9) return 'grid-cols-3'
    return 'grid-cols-4'
  }

  if (participants.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-zinc-500">Waiting for participants...</p>
      </div>
    )
  }

  return (
    <div className={cn(
      "grid gap-3 p-4 h-full w-full",
      getGridCols(),
      compact && "gap-2",
      className
    )}>
      {participants.map((participant, index) => {
        const isActive = participant.id === activeSpeakerId || participant.isSpeaking
        const hasVideo = participant.videoEnabled
        const isMuted = !participant.audioEnabled
        const isScreenSharing = participant.isScreenSharing
        const isHost = participant.isHost || participant.id === hostId
        const isCurrentUser = participant.id === currentUserId
        
        return (
          <div 
            key={participant.id || `participant-${index}`}
            className={cn(
              "relative aspect-video bg-zinc-900 rounded-xl overflow-hidden",
              "ring-2 transition-all duration-200",
              isActive 
                ? "ring-emerald-500 shadow-lg shadow-emerald-500/20" 
                : "ring-white/5",
              compact && "rounded-lg"
            )}
          >
            {/* Video or Avatar */}
            {hasVideo ? (
              <div className="w-full h-full bg-zinc-800">
                {/* Daily.co handles the actual video rendering in the iframe */}
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                <Avatar className={cn(
                  "ring-2 ring-white/10",
                  compact ? "h-12 w-12" : "h-20 w-20"
                )}>
                  {participant.avatarUrl && (
                    <AvatarImage src={participant.avatarUrl} alt={participant.name} />
                  )}
                  <AvatarFallback className={cn(
                    "bg-zinc-700 text-zinc-300 font-semibold",
                    compact ? "text-lg" : "text-2xl"
                  )}>
                    {participant.name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}

            {/* Speaking indicator border animation */}
            {isActive && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 ring-2 ring-emerald-500 rounded-xl animate-pulse" />
              </div>
            )}

            {/* Top badges */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5">
              {isHost && (
                <div className="flex items-center gap-1 bg-amber-500/90 text-black text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                  <Crown className="h-2.5 w-2.5" />
                  <span>Host</span>
                </div>
              )}
              {isScreenSharing && (
                <div className="flex items-center gap-1 bg-blue-500/90 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                  <Monitor className="h-2.5 w-2.5" />
                  <span>Screen</span>
                </div>
              )}
              {participant.handRaised && (
                <div className="flex items-center gap-1 bg-amber-500/90 text-black text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                  <Hand className="h-2.5 w-2.5" />
                </div>
              )}
            </div>

            {/* Bottom info bar */}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-xs font-medium text-white truncate",
                  compact && "text-[10px]"
                )}>
                  {isCurrentUser ? 'You' : (participant.name || 'Guest')}
                </span>
                <div className="flex items-center gap-1.5">
                  {isMuted && (
                    <div className="bg-red-500/80 rounded-full p-1">
                      <MicOff className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                  {!hasVideo && (
                    <div className="bg-zinc-600/80 rounded-full p-1">
                      <VideoOff className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default VideoGridLayout
