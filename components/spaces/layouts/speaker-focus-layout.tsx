/**
 * Speaker Focus Layout
 * 
 * Used for office-hours spaces.
 * Shows main speaker prominently with smaller participant thumbnails and optional queue.
 */

"use client"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MicOff, VideoOff, Crown, Hand, Users, ChevronRight } from "lucide-react"
import { useState } from "react"
import type { SpaceLayoutParticipant } from "@/types/spaces"

interface SpeakerFocusLayoutProps {
  participants: SpaceLayoutParticipant[]
  activeSpeakerId?: string
  currentUserId?: string
  hostId?: string
  queueEnabled?: boolean
  queue?: { userId: string; position: number; joinedAt: Date }[]
  onPromoteToSpeaker?: (userId: string) => void
  className?: string
}

export function SpeakerFocusLayout({
  participants,
  activeSpeakerId,
  currentUserId,
  hostId,
  queueEnabled = false,
  queue = [],
  onPromoteToSpeaker,
  className,
}: SpeakerFocusLayoutProps) {
  const [showQueue, setShowQueue] = useState(queueEnabled)
  
  // Find the main speaker (active speaker, host, or first participant)
  const mainSpeaker = participants.find(p => p.id === activeSpeakerId || p.isSpeaking) 
    || participants.find(p => p.id === hostId || p.isHost)
    || participants[0]
  
  const otherParticipants = participants.filter(p => p.id !== mainSpeaker?.id)

  if (participants.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-zinc-500">Waiting for participants...</p>
      </div>
    )
  }

  return (
    <div className={cn("flex h-full gap-4 p-4", className)}>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Main Speaker - Large */}
        <div className="flex-1 relative">
          <div className={cn(
            "w-full h-full bg-zinc-900 rounded-2xl overflow-hidden",
            "ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/10"
          )}>
            {mainSpeaker?.videoEnabled ? (
              <div className="w-full h-full bg-zinc-800">
                {/* Daily handles video rendering */}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                <Avatar className="h-32 w-32 ring-4 ring-white/10">
                  <AvatarFallback className="bg-zinc-700 text-zinc-200 text-4xl font-semibold">
                    {mainSpeaker?.name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
            
            {/* Speaker Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <div className="flex items-center gap-3">
                {(mainSpeaker?.id === hostId || mainSpeaker?.isHost) && (
                  <div className="flex items-center gap-1 bg-amber-500/90 text-black text-xs font-medium px-2 py-1 rounded-full">
                    <Crown className="h-3 w-3" />
                    Host
                  </div>
                )}
                <span className="text-white font-medium">
                  {mainSpeaker?.id === currentUserId ? 'You' : (mainSpeaker?.name || 'Guest')}
                </span>
                <span className="text-emerald-400 text-sm">(Speaking)</span>
              </div>
            </div>

            {/* Active speaker indicator */}
            {(activeSpeakerId === mainSpeaker?.id || mainSpeaker?.isSpeaking) && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-emerald-500/20 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Speaking
              </div>
            )}
          </div>
        </div>

        {/* Participant Thumbnails - Bottom Row */}
        {otherParticipants.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {otherParticipants.map((participant) => {
              const isActive = participant.id === activeSpeakerId || participant.isSpeaking
              const isMuted = !participant.audioEnabled
              
              return (
                <div 
                  key={participant.id}
                  className={cn(
                    "relative flex-shrink-0 w-32 aspect-video bg-zinc-900 rounded-lg overflow-hidden cursor-pointer",
                    "ring-2 transition-all hover:ring-emerald-500/50",
                    isActive ? "ring-emerald-500" : "ring-white/5"
                  )}
                >
                  {participant.videoEnabled ? (
                    <div className="w-full h-full bg-zinc-800" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-zinc-700 text-zinc-300 text-sm">
                          {participant.name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                  
                  {/* Name & Status */}
                  <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white truncate">
                        {participant.id === currentUserId ? 'You' : (participant.name || 'Guest')}
                      </span>
                      {isMuted && <MicOff className="h-2.5 w-2.5 text-red-400" />}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Queue Sidebar - Right */}
      {queueEnabled && (
        <div className={cn(
          "bg-zinc-900 rounded-xl border border-white/10 overflow-hidden transition-all",
          showQueue ? "w-64" : "w-12"
        )}>
          {showQueue ? (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                  <Hand className="h-4 w-4 text-amber-400" />
                  Queue
                  {queue.length > 0 && (
                    <span className="bg-amber-500/20 text-amber-400 text-xs px-1.5 py-0.5 rounded-full">
                      {queue.length}
                    </span>
                  )}
                </h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setShowQueue(false)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
                {queue.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-4">No one in queue</p>
                ) : (
                  queue.map((item, index) => {
                    const participant = participants.find(p => p.id === item.userId)
                    return (
                      <div 
                        key={item.userId}
                        className="flex items-center gap-3 p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800"
                      >
                        <span className="text-lg font-bold text-zinc-500 w-6">
                          {index + 1}
                        </span>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-zinc-700 text-xs">
                            {participant?.name?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-200 truncate">
                            {participant?.name || 'Guest'}
                          </p>
                        </div>
                        {hostId === currentUserId && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => onPromoteToSpeaker?.(item.userId)}
                          >
                            Invite
                          </Button>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </>
          ) : (
            <Button 
              variant="ghost" 
              className="w-full h-full flex flex-col items-center justify-center gap-2"
              onClick={() => setShowQueue(true)}
            >
              <Hand className="h-5 w-5 text-amber-400" />
              {queue.length > 0 && (
                <span className="text-xs text-amber-400">{queue.length}</span>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default SpeakerFocusLayout
