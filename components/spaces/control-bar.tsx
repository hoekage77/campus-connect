/**
 * Space Control Bar
 * 
 * Bottom control bar for space actions (audio, video, screen share, etc.)
 */

"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Hand,
  PhoneOff,
  Pin,
  Settings,
  MoreHorizontal,
  Users,
  MessageSquare,
} from "lucide-react"

interface SpaceControlBarProps {
  // Media state
  audioEnabled: boolean
  videoEnabled: boolean
  screenSharing: boolean
  handRaised: boolean
  
  // Callbacks
  onToggleAudio: () => void
  onToggleVideo: () => void
  onToggleScreenShare: () => void
  onToggleHand: () => void
  onOpenPin?: () => void
  onOpenParticipants?: () => void
  onOpenChat?: () => void
  onOpenSettings?: () => void
  onLeave: () => void
  
  // Permissions
  isHost: boolean
  canShare?: boolean
  canRaiseHand?: boolean
  
  // Features
  showPinButton?: boolean
  showChatButton?: boolean
  
  className?: string
}

export function SpaceControlBar({
  audioEnabled,
  videoEnabled,
  screenSharing,
  handRaised,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHand,
  onOpenPin,
  onOpenParticipants,
  onOpenChat,
  onOpenSettings,
  onLeave,
  isHost,
  canShare = true,
  canRaiseHand = true,
  showPinButton = true,
  showChatButton = true,
  className,
}: SpaceControlBarProps) {
  return (
    <div className={cn(
      "absolute bottom-6 left-1/2 -translate-x-1/2 z-50",
      className
    )}>
      <div className={cn(
        "flex items-center gap-2 p-2 rounded-2xl",
        "bg-zinc-900/90 backdrop-blur-xl",
        "border border-white/10 shadow-2xl shadow-black/50"
      )}>
        <TooltipProvider delayDuration={300}>
          {/* Audio Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={audioEnabled ? "ghost" : "destructive"}
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-xl transition-all",
                  audioEnabled 
                    ? "bg-zinc-800 hover:bg-zinc-700 text-white" 
                    : "bg-red-500/90 hover:bg-red-600 text-white"
                )}
                onClick={onToggleAudio}
              >
                {audioEnabled ? (
                  <Mic className="h-5 w-5" />
                ) : (
                  <MicOff className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{audioEnabled ? 'Mute' : 'Unmute'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Video Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={videoEnabled ? "ghost" : "destructive"}
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-xl transition-all",
                  videoEnabled 
                    ? "bg-zinc-800 hover:bg-zinc-700 text-white" 
                    : "bg-red-500/90 hover:bg-red-600 text-white"
                )}
                onClick={onToggleVideo}
              >
                {videoEnabled ? (
                  <Video className="h-5 w-5" />
                ) : (
                  <VideoOff className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{videoEnabled ? 'Turn off camera' : 'Turn on camera'}</p>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-8 bg-white/10 mx-1" />

          {/* Hand Raise */}
          {canRaiseHand && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={handRaised ? "default" : "ghost"}
                  size="icon"
                  className={cn(
                    "h-12 w-12 rounded-xl transition-all",
                    handRaised 
                      ? "bg-amber-500 hover:bg-amber-600 text-black" 
                      : "text-zinc-400 hover:text-white hover:bg-white/10"
                  )}
                  onClick={onToggleHand}
                >
                  <Hand className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{handRaised ? 'Lower hand' : 'Raise hand'}</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Screen Share */}
          {canShare && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={screenSharing ? "default" : "ghost"}
                  size="icon"
                  className={cn(
                    "h-12 w-12 rounded-xl transition-all",
                    screenSharing 
                      ? "bg-blue-500 hover:bg-blue-600 text-white" 
                      : "text-zinc-400 hover:text-white hover:bg-white/10"
                  )}
                  onClick={onToggleScreenShare}
                >
                  <Monitor className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{screenSharing ? 'Stop sharing' : 'Share screen'}</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Pin Content (Host only) */}
          {isHost && showPinButton && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-xl text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                  onClick={onOpenPin}
                >
                  <Pin className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Pin content</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Chat */}
          {showChatButton && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10"
                  onClick={onOpenChat}
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Chat</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Participants */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10"
                onClick={onOpenParticipants}
              >
                <Users className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Participants</p>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-8 bg-white/10 mx-1" />

          {/* Leave */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="lg"
                className="h-12 px-6 rounded-xl bg-red-500/90 hover:bg-red-600"
                onClick={onLeave}
              >
                <PhoneOff className="h-5 w-5 mr-2" />
                Leave
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Leave space</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}

export default SpaceControlBar
