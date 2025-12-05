/**
 * Stage-Audience Layout
 * 
 * Used for lecture and debate spaces.
 * Shows speakers on a prominent stage with audience members below.
 */

"use client"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MicOff, VideoOff, Crown, Hand, Users, MessageSquare, BarChart3 } from "lucide-react"
import { useState } from "react"
import type { SpaceLayoutParticipant } from "@/types/spaces"

interface StageAudienceLayoutProps {
  participants: SpaceLayoutParticipant[]
  activeSpeakerId?: string
  currentUserId?: string
  hostId?: string
  speakerIds?: string[] // Users with speaking privileges
  pollsEnabled?: boolean
  qaEnabled?: boolean
  onRaiseHand?: () => void
  className?: string
}

export function StageAudienceLayout({
  participants,
  activeSpeakerId,
  currentUserId,
  hostId,
  speakerIds = [],
  pollsEnabled = false,
  qaEnabled = false,
  onRaiseHand,
  className,
}: StageAudienceLayoutProps) {
  const [showQA, setShowQA] = useState(false)
  
  // Separate speakers (host + co-hosts + promoted speakers) from audience
  const allSpeakerIds = new Set([hostId, ...speakerIds].filter(Boolean))
  const speakers = participants.filter(p => allSpeakerIds.has(p.id) || p.isHost)
  const audience = participants.filter(p => !allSpeakerIds.has(p.id) && !p.isHost)

  if (participants.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-zinc-500">Waiting for participants...</p>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full gap-4 p-4", className)}>
      {/* Stage - Top Section (Speakers) */}
      <div className="h-2/3 min-h-0">
        <div className="h-full flex gap-4 justify-center">
          {speakers.length === 0 ? (
            <div className="flex items-center justify-center w-full bg-zinc-900/50 rounded-2xl border border-white/5">
              <p className="text-zinc-500">No speakers yet</p>
            </div>
          ) : (
            speakers.map((speaker, index) => {
              const isActive = speaker.id === activeSpeakerId || speaker.isSpeaking
              const isHost = speaker.id === hostId || speaker.isHost
              const isMuted = !speaker.audioEnabled
              
              return (
                <div 
                  key={speaker.id}
                  className={cn(
                    "relative flex-1 max-w-lg bg-zinc-900 rounded-2xl overflow-hidden",
                    "ring-2 transition-all",
                    isActive 
                      ? "ring-emerald-500 shadow-lg shadow-emerald-500/20" 
                      : "ring-white/5"
                  )}
                >
                  {/* Video / Avatar */}
                  {speaker.videoEnabled ? (
                    <div className="w-full h-full bg-zinc-800" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                      <Avatar className="h-24 w-24 ring-4 ring-white/10">
                        <AvatarFallback className="bg-zinc-700 text-zinc-200 text-3xl font-semibold">
                          {speaker.name?.[0]?.toUpperCase() || 'U'}
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

                  {/* Speaker Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                    <div className="flex items-center gap-2">
                      {isHost && (
                        <div className="flex items-center gap-1 bg-amber-500/90 text-black text-xs font-medium px-2 py-0.5 rounded-full">
                          <Crown className="h-3 w-3" />
                          Host
                        </div>
                      )}
                      <span className="text-white font-medium">
                        {speaker.id === currentUserId ? 'You' : (speaker.name || 'Speaker')}
                      </span>
                      {isMuted && <MicOff className="h-4 w-4 text-red-400" />}
                    </div>
                  </div>

                  {/* Speaking indicator */}
                  {isActive && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full backdrop-blur">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      Speaking
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Audience - Bottom Section */}
      <div className="h-1/3 bg-zinc-900/50 rounded-xl border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
          <div className="flex items-center gap-2 text-zinc-400">
            <Users className="h-4 w-4" />
            <span className="text-sm">Audience ({audience.length})</span>
          </div>
          <div className="flex items-center gap-2">
            {qaEnabled && (
              <Button 
                variant={showQA ? "secondary" : "ghost"} 
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowQA(!showQA)}
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                Q&A
              </Button>
            )}
            {pollsEnabled && (
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                <BarChart3 className="h-3.5 w-3.5 mr-1" />
                Polls
              </Button>
            )}
            {!allSpeakerIds.has(currentUserId) && (
              <Button 
                variant="outline" 
                size="sm"
                className="h-7 text-xs"
                onClick={onRaiseHand}
              >
                <Hand className="h-3.5 w-3.5 mr-1" />
                Raise Hand
              </Button>
            )}
          </div>
        </div>
        
        {/* Audience Grid */}
        <div className="p-3 overflow-y-auto max-h-[calc(100%-40px)]">
          {audience.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-4">No audience members yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {audience.map((member) => {
                const isMuted = !member.audioEnabled
                const hasRaisedHand = member.handRaised
                
                return (
                  <div 
                    key={member.id}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-full bg-zinc-800/50",
                      "border border-white/5 hover:border-white/10 transition-colors"
                    )}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-zinc-700 text-zinc-300 text-xs">
                        {member.name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-zinc-300 max-w-[80px] truncate">
                      {member.id === currentUserId ? 'You' : (member.name || 'Guest')}
                    </span>
                    {hasRaisedHand && <Hand className="h-3 w-3 text-amber-400" />}
                    {isMuted && <MicOff className="h-3 w-3 text-zinc-600" />}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StageAudienceLayout
