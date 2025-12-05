"use client"

/**
 * Start Space from Chat Component
 * Quick action to launch an audio/video space from a chat room
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Radio, Mic, Video, Users, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { getAuthHeaders } from '@/lib/auth'

interface StartSpaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  roomId: string
  roomName?: string
}

export function StartSpaceDialog({ 
  open, 
  onOpenChange, 
  groupId,
  roomId,
  roomName 
}: StartSpaceDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  
  const [title, setTitle] = useState(`${roomName || 'Chat'} Space`)
  const [spaceType, setSpaceType] = useState<string>('social-hangout')
  const [mediaType, setMediaType] = useState<'audio' | 'video'>('audio')
  const [maxParticipants, setMaxParticipants] = useState('10')
  const [isPrivate, setIsPrivate] = useState(false)
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!title.trim()) return

    setCreating(true)
    try {
      // Build request body with type-specific requirements
      const requestBody: any = {
        title: title.trim(),
        groupId,
        type: spaceType,
        maxParticipants: parseInt(maxParticipants) || 10,
        privacy: isPrivate ? 'private' : 'public',
        audioEnabled: true,
        videoEnabled: mediaType === 'video',
        screenShareEnabled: true,
        sourceChatRoomId: roomId,
      }

      // Add type-specific config
      if (spaceType === 'lecture') {
        requestBody.scheduledStart = new Date().toISOString()
        requestBody.recordingEnabled = true
      } else if (spaceType === 'office-hours') {
        requestBody.scheduledStart = new Date().toISOString()
        requestBody.queueEnabled = true
      } else if (spaceType === 'debate') {
        requestBody.debateTopic = title.trim()
        requestBody.moderatorId = user?.id
      }

      const res = await fetch('/api/spaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(requestBody),
      })

      if (!res.ok) {
        const errorData = await res.json()
        console.error('Space creation failed:', res.status, errorData)
        throw new Error(errorData.error || errorData.message || 'Failed to create space')
      }

      const result = await res.json()
      const space = result.data || result
      
      toast({
        title: '🎙️ Space Created!',
        description: 'Redirecting you to the space...',
      })

      // Post a message to the chat about the new space
      await fetch(`/api/chat/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          content: `🎙️ Started a ${mediaType} space: "${title}"`,
          mediaType: 'space',
          mediaUrl: `/groups/${groupId}/spaces/${space.id}`,
        }),
      })

      onOpenChange(false)
      
      // Navigate to the new space
      router.push(`/groups/${groupId}/spaces/${space.id}`)
    } catch (err) {
      console.error('Failed to create space:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create space',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            Start a Space
          </DialogTitle>
          <DialogDescription>
            Create a live audio or video room for this chat
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="space-title">Space Title</Label>
            <Input
              id="space-title"
              placeholder="What's this space about?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Media Type (Audio/Video) */}
          <div className="space-y-2">
            <Label>Media Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMediaType('audio')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                  mediaType === 'audio'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Mic className="h-5 w-5" />
                <span className="font-medium">Audio</span>
              </button>
              <button
                type="button"
                onClick={() => setMediaType('video')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                  mediaType === 'video'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Video className="h-5 w-5" />
                <span className="font-medium">Video</span>
              </button>
            </div>
          </div>

          {/* Space Type (Activity) */}
          <div className="space-y-2">
            <Label>Activity Type</Label>
            <Select value={spaceType} onValueChange={setSpaceType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="social-hangout">Social Hangout</SelectItem>
                <SelectItem value="study-session">Study Session</SelectItem>
                <SelectItem value="office-hours">Office Hours</SelectItem>
                <SelectItem value="project-collab">Project Collab</SelectItem>
                <SelectItem value="lecture">Lecture</SelectItem>
                <SelectItem value="debate">Debate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Max Participants */}
          <div className="space-y-2">
            <Label htmlFor="max-participants">Max Participants</Label>
            <Select value={maxParticipants} onValueChange={setMaxParticipants}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 people</SelectItem>
                <SelectItem value="10">10 people</SelectItem>
                <SelectItem value="20">20 people</SelectItem>
                <SelectItem value="50">50 people</SelectItem>
                <SelectItem value="100">100 people</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Privacy */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Private Space</Label>
              <p className="text-xs text-muted-foreground">
                Only squad members can join
              </p>
            </div>
            <Switch
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!title.trim() || creating}
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Radio className="h-4 w-4 mr-2" />
                Start Space
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Space Link Message
 * Displays a space invitation in chat
 */
interface SpaceLinkProps {
  title: string
  url: string
  type?: 'audio' | 'video'
  participantCount?: number
  isLive?: boolean
  className?: string
}

export function SpaceLink({ 
  title, 
  url, 
  type = 'audio',
  participantCount = 0,
  isLive = true,
  className 
}: SpaceLinkProps) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push(url)}
      className={`flex items-center gap-3 p-3 bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-lg hover:border-primary/40 transition-all ${className}`}
    >
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          {type === 'video' ? (
            <Video className="h-5 w-5 text-primary" />
          ) : (
            <Mic className="h-5 w-5 text-primary" />
          )}
        </div>
        {isLive && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </div>
      <div className="flex-1 text-left">
        <div className="font-medium text-sm">{title}</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isLive && <span className="text-red-500 font-medium">LIVE</span>}
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {participantCount} {participantCount === 1 ? 'person' : 'people'}
          </span>
        </div>
      </div>
      <Radio className="h-4 w-4 text-primary" />
    </button>
  )
}
