/**
 * One-on-One Layout
 * 
 * Used for mentorship spaces.
 * Shows two equal-sized video panels for intimate 1:1 conversations.
 */

"use client"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MicOff, VideoOff, Crown } from "lucide-react"
import type { SpaceLayoutParticipant } from "@/types/spaces"

interface OneOnOneLayoutProps {
  participants: SpaceLayoutParticipant[]
  activeSpeakerId?: string
  currentUserId?: string
  hostId?: string
  className?: string
}

export function OneOnOneLayout({
  participants,
  activeSpeakerId,
  currentUserId,
  hostId,
  className,
}: OneOnOneLayoutProps) {
  // Get up to 2 participants (1:1 view)
  const displayParticipants = participants.slice(0, 2)
  
  if (participants.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-zinc-500">Waiting for participants...</p>
      </div>
    )
  }

  // Single participant - show larger
  if (displayParticipants.length === 1) {
    const participant = displayParticipants[0]
    const isHost = participant.id === hostId || participant.isHost
    const isMuted = !participant.audioEnabled
    const isCurrentUser = participant.id === currentUserId
    
    return (
      <div className={cn("flex items-center justify-center h-full p-8", className)}>
        <div className="relative w-full max-w-3xl aspect-video bg-zinc-900 rounded-2xl overflow-hidden ring-2 ring-emerald-500/30">
          {participant.videoEnabled ? (
            <div className="w-full h-full bg-zinc-800" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
              <Avatar className="h-32 w-32 ring-4 ring-white/10">
                <AvatarFallback className="bg-zinc-700 text-zinc-200 text-4xl font-semibold">
                  {participant.name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
          
          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center gap-2">
              {isHost && (
                <div className="flex items-center gap-1 bg-amber-500/90 text-black text-xs font-medium px-2 py-0.5 rounded-full">
                  <Crown className="h-3 w-3" />
                  Mentor
                </div>
              )}
              <span className="text-white font-medium">
                {isCurrentUser ? 'You' : (participant.name || 'Guest')}
              </span>
              {isMuted && <MicOff className="h-4 w-4 text-red-400" />}
            </div>
          </div>
          
          {/* Waiting indicator */}
          <div className="absolute top-4 right-4 text-zinc-400 text-sm">
            Waiting for other participant...
          </div>
        </div>
      </div>
    )
  }

  // Two participants - side by side
  return (
    <div className={cn("flex gap-4 h-full p-4", className)}>
      {displayParticipants.map((participant, index) => {
        const isActive = participant.id === activeSpeakerId || participant.isSpeaking
        const isHost = participant.id === hostId || participant.isHost
        const isMuted = !participant.audioEnabled
        const hasVideo = participant.videoEnabled
        const isCurrentUser = participant.id === currentUserId
        
        return (
          <div 
            key={participant.id}
            className={cn(
              "relative flex-1 bg-zinc-900 rounded-2xl overflow-hidden",
              "ring-2 transition-all",
              isActive 
                ? "ring-emerald-500 shadow-lg shadow-emerald-500/20" 
                : "ring-white/5"
            )}
          >
            {/* Video / Avatar */}
            {hasVideo ? (
              <div className="w-full h-full bg-zinc-800" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                <Avatar className="h-28 w-28 ring-4 ring-white/10">
                  <AvatarFallback className="bg-zinc-700 text-zinc-200 text-3xl font-semibold">
                    {participant.name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}

            {/* Active speaker glow */}
            {isActive && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent" />
              </div>
            )}

            {/* Role badge - top */}
            <div className="absolute top-4 left-4">
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur",
                isHost 
                  ? "bg-amber-500/90 text-black" 
                  : "bg-zinc-800/90 text-zinc-200"
              )}>
                {isHost ? (
                  <>
                    <Crown className="h-3 w-3" />
                    Mentor
                  </>
                ) : (
                  'Mentee'
                )}
              </div>
            </div>

            {/* Speaking indicator */}
            {isActive && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full backdrop-blur">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Speaking
              </div>
            )}

            {/* Info overlay - bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">
                  {isCurrentUser ? 'You' : (participant.name || 'Guest')}
                </span>
                <div className="flex items-center gap-2">
                  {isMuted && (
                    <div className="bg-red-500/80 rounded-full p-1.5">
                      <MicOff className="h-3 w-3 text-white" />
                    </div>
                  )}
                  {!hasVideo && (
                    <div className="bg-zinc-600/80 rounded-full p-1.5">
                      <VideoOff className="h-3 w-3 text-white" />
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

export default OneOnOneLayout
