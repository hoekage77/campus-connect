/**
 * Audio-Only Layout
 * 
 * Used for social-hangout spaces where video is disabled.
 * Shows participant avatars in a circular arrangement with audio indicators.
 */

"use client"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MicOff, Crown, Hand } from "lucide-react"
import type { SpaceLayoutParticipant } from "@/types/spaces"

interface AudioOnlyLayoutProps {
  participants: SpaceLayoutParticipant[]
  activeSpeakerId?: string
  currentUserId?: string
  hostId?: string
  className?: string
}

export function AudioOnlyLayout({
  participants,
  activeSpeakerId,
  currentUserId,
  hostId,
  className,
}: AudioOnlyLayoutProps) {
  if (participants.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-zinc-500">Waiting for participants...</p>
      </div>
    )
  }

  return (
    <div className={cn(
      "flex flex-wrap justify-center items-center gap-8 p-8",
      className
    )}>
      {participants.map((participant) => {
        const isActive = participant.id === activeSpeakerId || participant.isSpeaking
        const isMuted = !participant.audioEnabled
        const isHost = participant.id === hostId || participant.isHost
        const isCurrentUser = participant.id === currentUserId
        
        return (
          <div 
            key={participant.id} 
            className="flex flex-col items-center gap-3 group"
          >
            <div className={cn(
              "relative transition-all duration-300",
              isActive && "scale-110"
            )}>
              {/* Outer ring - active speaker glow */}
              <div className={cn(
                "absolute -inset-2 rounded-full transition-all duration-300",
                isActive 
                  ? "bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 animate-pulse" 
                  : "bg-transparent"
              )} />
              
              {/* Avatar container */}
              <div className={cn(
                "relative w-24 h-24 rounded-full",
                "ring-4 transition-all duration-300",
                isActive 
                  ? "ring-emerald-500 shadow-lg shadow-emerald-500/30" 
                  : "ring-zinc-700/50"
              )}>
                <Avatar className="w-full h-full">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className={cn(
                    "text-2xl font-semibold",
                    isActive 
                      ? "bg-gradient-to-br from-emerald-600 to-cyan-600 text-white" 
                      : "bg-zinc-800 text-zinc-300"
                  )}>
                    {participant.name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                {/* Audio wave indicator when speaking */}
                {isActive && !isMuted && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-end gap-0.5 h-4">
                    <div className="w-1 bg-emerald-500 rounded-full animate-bounce" style={{ height: '8px', animationDelay: '0ms' }} />
                    <div className="w-1 bg-emerald-500 rounded-full animate-bounce" style={{ height: '12px', animationDelay: '150ms' }} />
                    <div className="w-1 bg-emerald-500 rounded-full animate-bounce" style={{ height: '6px', animationDelay: '300ms' }} />
                    <div className="w-1 bg-emerald-500 rounded-full animate-bounce" style={{ height: '10px', animationDelay: '450ms' }} />
                  </div>
                )}
                
                {/* Muted indicator */}
                {isMuted && (
                  <div className="absolute bottom-0 right-0 bg-red-500/90 rounded-full p-1.5 ring-2 ring-zinc-950">
                    <MicOff className="h-3 w-3 text-white" />
                  </div>
                )}
                
                {/* Host crown */}
                {isHost && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 rounded-full p-1 ring-2 ring-zinc-950">
                    <Crown className="h-3 w-3 text-black" />
                  </div>
                )}

                {/* Hand raised indicator */}
                {participant.handRaised && (
                  <div className="absolute -top-2 -right-2 bg-amber-500 rounded-full p-1 ring-2 ring-zinc-950">
                    <Hand className="h-3 w-3 text-black" />
                  </div>
                )}
              </div>
            </div>
            
            {/* Name */}
            <div className="flex flex-col items-center gap-1">
              <span className={cn(
                "text-sm font-medium transition-colors",
                isActive ? "text-emerald-400" : "text-zinc-400"
              )}>
                {isCurrentUser ? 'You' : (participant.name || 'Guest')}
              </span>
              {isHost && (
                <span className="text-[10px] uppercase tracking-wider text-amber-500/80">Host</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default AudioOnlyLayout
