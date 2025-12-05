"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { getAuthHeaders } from '@/lib/auth'
import {
  Plus,
  Users,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Hand,
  Settings,
  Play,
  Pause,
  Crown,
  User,
  Radio,
  Globe,
  Lock,
  BookOpen,
  Coffee,
  Presentation,
  Code2,
  Users2,
  Sparkles,
  Scale,
  FileSearch,
  GraduationCap,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import type { Space, SpaceType, SpacePrivacy } from "@/types"
import { useAuth } from "@/hooks/use-auth"

interface SpaceWithParticipants extends Space {
  activeParticipantCount: number
}

export default function GroupSpacesPage() {
  const params = useParams()
  const groupId = params.id as string
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  const [spaces, setSpaces] = useState<SpaceWithParticipants[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "study-session" as SpaceType,
    privacy: "public" as SpacePrivacy,
    maxParticipants: 10,
    audioEnabled: true,
    videoEnabled: false,
    screenShareEnabled: false,
  })

  // Fetch spaces for this group
  const fetchSpaces = useCallback(async () => {
    try {
      setLoading(true)
      const url = `/api/groups/${groupId}/spaces`
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Group spaces] Fetching', url, 'user', user?.id)
      }
      const response = await fetch(url, {
        headers: {
          ...getAuthHeaders(),
          'x-user-id': user?.id || '',
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch spaces')
      }

      const data = await response.json()
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Group spaces] Response:', data)
      }
      setSpaces(data)
    } catch (error) {
      console.error('Error fetching spaces:', error)
      toast({
        title: "Error",
        description: "Failed to load spaces",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [groupId, user?.id, toast])

  useEffect(() => {
    if (user?.id) {
      fetchSpaces()
    }
  }, [fetchSpaces, user?.id])

  const handleCreateSpace = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Space title is required",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/groups/${groupId}/spaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create space')
      }

      const newSpace = await response.json()

      toast({
        title: "Success",
        description: "Space created successfully!",
      })

      setCreateDialogOpen(false)
      setFormData({
        title: "",
        description: "",
        type: "study-session",
        privacy: "public",
        maxParticipants: 10,
        audioEnabled: true,
        videoEnabled: false,
        screenShareEnabled: false,
      })

      // Refresh spaces list
      fetchSpaces()

      // Navigate to the new space
      router.push(`/groups/${groupId}/spaces/${newSpace.id}`)
    } catch (error) {
      console.error('Error creating space:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create space",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Space type configuration with icons, labels, descriptions, and colors
  const SPACE_TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string; description: string; color: string; bgColor: string }> = {
    'study-session': {
      icon: <BookOpen className="h-4 w-4" />,
      label: 'Study Session',
      description: 'Focused study time with breaks',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    'study-sprint': {
      icon: <Play className="h-4 w-4" />,
      label: 'Study Sprint',
      description: 'Silent coworking with accountability',
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    },
    'office-hours': {
      icon: <GraduationCap className="h-4 w-4" />,
      label: 'Office Hours',
      description: 'Q&A and help sessions',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    'social-hangout': {
      icon: <Coffee className="h-4 w-4" />,
      label: 'Social Hangout',
      description: 'Casual conversation and hanging out',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
    'social': {
      icon: <Coffee className="h-4 w-4" />,
      label: 'Social',
      description: 'Casual hangout',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
    'lecture': {
      icon: <Presentation className="h-4 w-4" />,
      label: 'Lecture',
      description: 'One-to-many presentations',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    'project-collab': {
      icon: <Code2 className="h-4 w-4" />,
      label: 'Project Collab',
      description: 'Active group work and coding',
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    },
    'collaboration': {
      icon: <Code2 className="h-4 w-4" />,
      label: 'Collaboration',
      description: 'Active group work',
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    },
    'mentorship': {
      icon: <Sparkles className="h-4 w-4" />,
      label: 'Mentorship',
      description: '1-on-1 guidance and coaching',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    },
    'tutoring': {
      icon: <Users2 className="h-4 w-4" />,
      label: 'Tutoring',
      description: 'One teaches, others learn',
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    },
    'debate': {
      icon: <Scale className="h-4 w-4" />,
      label: 'Debate',
      description: 'Structured discussions with sides',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
    },
    'peer-review': {
      icon: <FileSearch className="h-4 w-4" />,
      label: 'Peer Review',
      description: 'Feedback and critique sessions',
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    },
    'general': {
      icon: <Radio className="h-4 w-4" />,
      label: 'General',
      description: 'Unstructured space',
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    },
  }

  const getSpaceTypeIcon = (type: SpaceType) => {
    return SPACE_TYPE_CONFIG[type]?.icon || <Radio className="h-4 w-4" />
  }

  const getSpaceTypeLabel = (type: SpaceType) => {
    return SPACE_TYPE_CONFIG[type]?.label || 'General'
  }

  const getPrivacyIcon = (privacy: SpacePrivacy) => {
    switch (privacy) {
      case 'public':
        return <Globe className="h-3 w-3" />
      case 'private':
        return <Users className="h-3 w-3" />
      case 'invite-only':
        return <Lock className="h-3 w-3" />
      default:
        return <Globe className="h-3 w-3" />
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-4 px-4 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Spaces</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Live audio/video study rooms</p>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
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
      </div>
    )
  }

  return (
    <div className="container mx-auto py-4 px-4 sm:py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Spaces</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Live audio/video study rooms</p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="sm:inline">Create Space</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-xl flex items-center gap-2">
                <Radio className="h-5 w-5 text-primary" />
                Create a Space
              </DialogTitle>
              <DialogDescription>
                Start a live audio/video room for your study group
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-2">
              {/* Title & Description */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium">
                    Space Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Quick Study Sprint"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What's this space about?"
                    rows={2}
                    className="mt-1.5 resize-none"
                  />
                </div>
              </div>

              {/* Space Type Selection - Enhanced Grid */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Space Type</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { type: 'study-session', icon: <BookOpen className="h-5 w-5" />, label: 'Study', color: 'blue' },
                    { type: 'office-hours', icon: <GraduationCap className="h-5 w-5" />, label: 'Office Hours', color: 'amber' },
                    { type: 'social-hangout', icon: <Coffee className="h-5 w-5" />, label: 'Social', color: 'pink' },
                    { type: 'lecture', icon: <Presentation className="h-5 w-5" />, label: 'Lecture', color: 'purple' },
                    { type: 'project-collab', icon: <Code2 className="h-5 w-5" />, label: 'Collab', color: 'emerald' },
                    { type: 'mentorship', icon: <Sparkles className="h-5 w-5" />, label: 'Mentorship', color: 'cyan' },
                    { type: 'debate', icon: <Scale className="h-5 w-5" />, label: 'Debate', color: 'red' },
                    { type: 'peer-review', icon: <FileSearch className="h-5 w-5" />, label: 'Review', color: 'slate' },
                  ].map(({ type, icon, label, color }) => {
                    const isSelected = formData.type === type
                    const colorClasses: Record<string, string> = {
                      blue: isSelected ? 'border-blue-500 bg-blue-500/10 text-blue-600' : 'hover:border-blue-500/50 hover:bg-blue-500/5',
                      amber: isSelected ? 'border-amber-500 bg-amber-500/10 text-amber-600' : 'hover:border-amber-500/50 hover:bg-amber-500/5',
                      pink: isSelected ? 'border-pink-500 bg-pink-500/10 text-pink-600' : 'hover:border-pink-500/50 hover:bg-pink-500/5',
                      purple: isSelected ? 'border-purple-500 bg-purple-500/10 text-purple-600' : 'hover:border-purple-500/50 hover:bg-purple-500/5',
                      emerald: isSelected ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600' : 'hover:border-emerald-500/50 hover:bg-emerald-500/5',
                      cyan: isSelected ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600' : 'hover:border-cyan-500/50 hover:bg-cyan-500/5',
                      red: isSelected ? 'border-red-500 bg-red-500/10 text-red-600' : 'hover:border-red-500/50 hover:bg-red-500/5',
                      slate: isSelected ? 'border-slate-500 bg-slate-500/10 text-slate-600' : 'hover:border-slate-500/50 hover:bg-slate-500/5',
                    }
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: type as SpaceType }))}
                        className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                          isSelected ? 'ring-2 ring-offset-2 ring-offset-background' : ''
                        } ${colorClasses[color]} ${isSelected ? `ring-${color}-500/30` : 'border-border'}`}
                      >
                        <div className={isSelected ? '' : 'text-muted-foreground'}>
                          {icon}
                        </div>
                        <span className={`text-xs font-medium ${isSelected ? '' : 'text-muted-foreground'}`}>
                          {label}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {SPACE_TYPE_CONFIG[formData.type]?.description || 'Select a space type'}
                </p>
              </div>

              {/* Settings Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="privacy" className="text-sm font-medium">Privacy</Label>
                  <Select
                    value={formData.privacy}
                    onValueChange={(value: SpacePrivacy) => setFormData(prev => ({ ...prev, privacy: value }))}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Public
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Members Only
                        </div>
                      </SelectItem>
                      <SelectItem value="invite-only">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Invite Only
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="maxParticipants" className="text-sm font-medium">Max Participants</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    min={2}
                    max={50}
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 10 }))}
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* Media Features */}
              <div className="p-4 rounded-xl bg-muted/50 border">
                <Label className="text-sm font-medium mb-3 block">Media Features</Label>
                <div className="flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, audioEnabled: !prev.audioEnabled }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      formData.audioEnabled 
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600' 
                        : 'border-border text-muted-foreground hover:border-muted-foreground/50'
                    }`}
                  >
                    {formData.audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    <span className="text-sm font-medium">Audio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, videoEnabled: !prev.videoEnabled }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      formData.videoEnabled 
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600' 
                        : 'border-border text-muted-foreground hover:border-muted-foreground/50'
                    }`}
                  >
                    {formData.videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                    <span className="text-sm font-medium">Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, screenShareEnabled: !prev.screenShareEnabled }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      formData.screenShareEnabled 
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600' 
                        : 'border-border text-muted-foreground hover:border-muted-foreground/50'
                    }`}
                  >
                    <Monitor className="h-4 w-4" />
                    <span className="text-sm font-medium">Screen Share</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateSpace} disabled={isSubmitting} className="min-w-[120px]">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Go Live
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {spaces.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <Radio className="h-12 w-12 text-muted-foreground" />
            <EmptyTitle>No spaces yet</EmptyTitle>
            <EmptyDescription>
              Create your first live audio/video study room to get started
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Space
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => {
            const typeConfig = SPACE_TYPE_CONFIG[space.type] || SPACE_TYPE_CONFIG['general']
            return (
            <Card key={space.id} className="hover:shadow-md transition-shadow overflow-hidden">
              {/* Prominent Space Type Label */}
              <div className={`px-3 py-1.5 flex items-center gap-2 ${typeConfig.bgColor} ${typeConfig.color} border-b`}>
                {typeConfig.icon}
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {typeConfig.label}
                </span>
              </div>
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg truncate flex-1">{space.title}</CardTitle>
                  <Badge variant={space.status === 'live' ? 'default' : 'secondary'} className="shrink-0">
                    {space.status}
                  </Badge>
                </div>
                {space.description && (
                  <CardDescription className="line-clamp-2 text-sm">{space.description}</CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    {getPrivacyIcon(space.privacy)}
                    <span className="capitalize">{space.privacy.replace('-', ' ')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{space.activeParticipantCount}/{space.maxParticipants}</span>
                  </div>
                  <div className="flex items-center space-x-2 ml-auto">
                    {space.audioEnabled && <Mic className="h-3 w-3 text-green-500" />}
                    {space.videoEnabled && <Video className="h-3 w-3 text-green-500" />}
                    {space.screenShareEnabled && <Monitor className="h-3 w-3 text-green-500" />}
                  </div>
                </div>

                <Button
                  className="w-full text-sm"
                  size="sm"
                  onClick={() => router.push(`/groups/${groupId}/spaces/${space.id}`)}
                >
                  Join Space
                </Button>
              </CardContent>
            </Card>
          )})}
        </div>
      )}
    </div>
  )
}