# Spaces Feature: Complete Implementation Plan v2

**Date:** December 1, 2025  
**Status:** Planning  
**Goal:** Finish Daily.co integration, redesign space UI, add Jumbotron for featured/pinned content

---

## 📊 Current State Analysis

### ✅ What's Already Implemented

| Layer | Status | Details |
|-------|--------|---------|
| **Data Models** | ✅ Complete | `types/spaces.ts` - 8 space types, participants, invitations, features |
| **Backend API** | ✅ Complete | Full CRUD at `/api/spaces/[id]/*` - join, leave, hand, participants, token |
| **Daily.co Utils** | ✅ Complete | `lib/daily.ts` - createRoom, deleteRoom, createToken with mock fallback |
| **SpaceService** | ✅ Complete | `services/SpaceService.ts` - validation, feature flags, capacity limits |
| **Spaces List Page** | ✅ Complete | `/app/spaces/page.tsx` - hero carousel, live/ended space cards |
| **Space Room Page** | ⚠️ Partial | `/app/groups/[id]/spaces/[spaceId]/page.tsx` - basic Daily embed, controls |
| **Supabase Repo** | ✅ Complete | Space CRUD, participants, group-spaces queries |

### 🗄️ Data Layer: Supabase (NOT localStorage)

**Confirmed:** All Spaces CRUD operations are fully integrated with Supabase:

```typescript
// lib/supabase/repository.ts
createSpace()   → INSERT into 'spaces' table
getSpace()      → SELECT from 'spaces' table  
updateSpace()   → UPDATE 'spaces' table
deleteSpace()   → DELETE from 'spaces' table
endSpace()      → UPDATE status='ended'
joinSpace()     → INSERT into 'space_participants'
leaveSpace()    → UPDATE left_at in 'space_participants'
```

**Database Tables:**
- `spaces` - Main space records
- `space_participants` - Active/historical participants
- `space_invitations` - Private space invites

### ⚠️ Gaps & Issues Identified

1. **Daily.co Integration Gaps:**
   - Audio/video toggle buttons don't sync with Daily call frame (`setLocalAudio`/`setLocalVideo` not wired)
   - Screen share button is non-functional
   - No reconnection handling when network drops
   - Participant list doesn't sync with Daily's real-time participant events
   - No audio level indicators or speaking detection

2. **UI/UX Gaps:**
   - Space room is basic - no glassmorphism, minimal polish
   - No Jumbotron/Featured content area for hosts to pin resources
   - Participant sidebar lacks user avatars/names from API
   - No chat integration within the space
   - Mobile layout not optimized

3. **Missing Features:**
   - Pinned/Featured content (Jumbotron)
   - In-space announcements
   - Resource sharing (links, files)
   - Recording controls
   - Breakout rooms (for office-hours type)

---

## 🎯 Implementation Phases

### Phase 1: Complete Daily.co Integration (3-4 days)

#### 1.1 Wire Up Media Controls
**Files:** `app/groups/[id]/spaces/[spaceId]/page.tsx`

```typescript
// Connect state to Daily call frame
const handleToggleAudio = async () => {
  const call = callFrameRef.current
  if (!call) return
  const newState = !audioEnabled
  call.setLocalAudio(newState)
  setAudioEnabled(newState)
  // Persist to backend
  await fetch(`/api/spaces/${spaceId}/participants/${user?.id}/media`, {
    method: 'PATCH',
    body: JSON.stringify({ audioMuted: !newState })
  })
}

const handleToggleVideo = async () => {
  const call = callFrameRef.current
  if (!call) return
  const newState = !videoEnabled
  call.setLocalVideo(newState)
  setVideoEnabled(newState)
}

const handleScreenShare = async () => {
  const call = callFrameRef.current
  if (!call) return
  if (isScreenSharing) {
    call.stopScreenShare()
  } else {
    call.startScreenShare()
  }
}
```

#### 1.2 Real-time Participant Sync
**New Hook:** `hooks/use-daily-participants.ts`

```typescript
export function useDailyParticipants(callFrame: DailyCall | null) {
  const [participants, setParticipants] = useState<Map<string, DailyParticipant>>()
  
  useEffect(() => {
    if (!callFrame) return
    
    const handleParticipantJoined = (e) => {
      setParticipants(prev => new Map(prev).set(e.participant.user_id, e.participant))
    }
    const handleParticipantLeft = (e) => {
      setParticipants(prev => {
        const next = new Map(prev)
        next.delete(e.participant.user_id)
        return next
      })
    }
    const handleParticipantUpdated = (e) => {
      setParticipants(prev => new Map(prev).set(e.participant.user_id, e.participant))
    }
    
    callFrame.on('participant-joined', handleParticipantJoined)
    callFrame.on('participant-left', handleParticipantLeft)
    callFrame.on('participant-updated', handleParticipantUpdated)
    
    return () => {
      callFrame.off('participant-joined', handleParticipantJoined)
      callFrame.off('participant-left', handleParticipantLeft)
      callFrame.off('participant-updated', handleParticipantUpdated)
    }
  }, [callFrame])
  
  return participants
}
```

#### 1.3 Connection State & Reconnection
**Add to space page:**

```typescript
const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error'>('idle')

// In Daily event handlers
cf.on('joining-meeting', () => setConnectionState('connecting'))
cf.on('joined-meeting', () => setConnectionState('connected'))
cf.on('left-meeting', () => setConnectionState('idle'))
cf.on('error', (e) => {
  if (e.errorMsg?.includes('network')) {
    setConnectionState('reconnecting')
    // Auto-retry logic
  } else {
    setConnectionState('error')
  }
})
```

#### 1.4 Speaking Indicators
```typescript
// Track active speakers
cf.on('active-speaker-change', (e) => {
  setActiveSpeaker(e.activeSpeaker?.user_id)
})
```

---

### Phase 2: Jumbotron / Featured Content (2-3 days)

#### 2.1 Data Model Update
**File:** `types/spaces.ts`

```typescript
export interface SpaceFeaturedContent {
  id: string
  spaceId: string
  type: 'announcement' | 'resource' | 'poll' | 'agenda'
  title: string
  content?: string
  url?: string
  pinned: boolean
  pinnedBy: string // userId
  pinnedAt: Date
  expiresAt?: Date
  reactions?: Record<string, string[]> // emoji -> userIds
}

// Add to Space interface
interface Space {
  // ...existing
  featuredContent?: SpaceFeaturedContent[]
  pinnedAnnouncement?: string
}
```

#### 2.2 API Endpoints
**New Files:**
- `app/api/spaces/[id]/featured/route.ts` - GET, POST
- `app/api/spaces/[id]/featured/[contentId]/route.ts` - PATCH, DELETE

```typescript
// POST /api/spaces/{id}/featured - Pin content
// Only host/co-host can pin
export async function POST(request: NextRequest, { params }) {
  const { type, title, content, url } = await request.json()
  // Validate host/co-host
  // Create featured content
  // Broadcast via realtime
}
```

#### 2.3 Jumbotron UI Component
**New File:** `components/spaces/jumbotron.tsx`

```tsx
export function SpaceJumbotron({ 
  content, 
  isHost,
  onDismiss,
  onAddContent 
}: SpaceJumbotronProps) {
  if (!content && !isHost) return null
  
  return (
    <div className="absolute top-20 left-4 right-4 z-40 max-w-2xl mx-auto">
      <Card className="bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10 
                       border-emerald-500/30 backdrop-blur-xl shadow-2xl">
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div className="flex items-center gap-2">
            <Pin className="h-4 w-4 text-emerald-400" />
            <span className="text-xs uppercase tracking-wider text-emerald-400">Pinned</span>
          </div>
          {isHost && (
            <Button variant="ghost" size="icon" onClick={onDismiss}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {content ? (
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-white">{content.title}</h4>
              {content.content && (
                <p className="text-sm text-zinc-300">{content.content}</p>
              )}
              {content.url && (
                <a href={content.url} target="_blank" 
                   className="text-sm text-emerald-400 hover:underline flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> Open resource
                </a>
              )}
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={onAddContent}>
              <Plus className="h-4 w-4 mr-2" /> Pin announcement or resource
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

#### 2.4 Pin Content Dialog
**New File:** `components/spaces/pin-content-dialog.tsx`

```tsx
export function PinContentDialog({ open, onOpenChange, onSubmit }) {
  const [type, setType] = useState<'announcement' | 'resource'>('announcement')
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pin Content</DialogTitle>
          <DialogDescription>
            Share an announcement or resource with everyone in the space
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={type} onValueChange={setType}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="announcement">Announcement</TabsTrigger>
            <TabsTrigger value="resource">Resource Link</TabsTrigger>
          </TabsList>
          
          <TabsContent value="announcement">
            <Input placeholder="Title" />
            <Textarea placeholder="Message..." />
          </TabsContent>
          
          <TabsContent value="resource">
            <Input placeholder="Title" />
            <Input placeholder="URL" type="url" />
          </TabsContent>
        </Tabs>
        
        <Button onClick={handleSubmit}>Pin to Space</Button>
      </DialogContent>
    </Dialog>
  )
}
```

---

### Phase 3: Space Room UI Redesign (3-4 days)

#### 3.0 Type-Based Layout System

Each space type requires a different presentation mode based on its features:

| Space Type | Layout | Video | Key Features |
|------------|--------|-------|--------------|
| **study-session** | Grid + Whiteboard Split | ✅ Video | Whiteboard panel, timer, document sharing |
| **office-hours** | Queue + Speaker Focus | ✅ Video | Queue sidebar, breakout rooms |
| **social-hangout** | Audio-Only Grid | ❌ Audio-first | Reactions, games panel, avatars |
| **lecture** | Speaker Stage | ✅ Video | Slides panel, polls, audience view |
| **project-collab** | Split Screen | ✅ Video | Project board, file storage |
| **mentorship** | 1:1 Focus | ✅ Video | Goals panel, agenda, progress |
| **debate** | Two-Sided Stage | ✅ Video | Timer, scoring, voting |
| **peer-review** | Document + Video | ✅ Video | PDF annotate, rubrics, feedback |

**New File:** `components/spaces/layouts/index.ts`

```typescript
import { SpaceType } from '@/types/spaces'

export type SpaceLayoutMode = 
  | 'video-grid'       // Default grid of video tiles
  | 'audio-only'       // Avatar circles with audio indicators
  | 'speaker-focus'    // Large speaker + small thumbnails
  | 'split-screen'     // Video + content panel side-by-side
  | 'stage-audience'   // Speaker(s) on stage, audience below
  | 'one-on-one'       // Two equal-sized video panels

export const LAYOUT_BY_TYPE: Record<SpaceType, SpaceLayoutMode> = {
  'study-session': 'split-screen',    // Video + whiteboard
  'office-hours': 'speaker-focus',    // Current speaker highlighted
  'social-hangout': 'audio-only',     // No video, avatar grid
  'lecture': 'stage-audience',        // Instructor prominent
  'project-collab': 'split-screen',   // Video + project board
  'mentorship': 'one-on-one',         // 1:1 video panels
  'debate': 'stage-audience',         // Debaters on stage
  'peer-review': 'split-screen',      // Video + document view
}

export const FEATURES_BY_TYPE: Record<SpaceType, SpaceFeaturePanel[]> = {
  'study-session': ['whiteboard', 'timer', 'documents'],
  'office-hours': ['queue', 'breakout-rooms'],
  'social-hangout': ['reactions', 'games'],
  'lecture': ['slides', 'polls', 'qa'],
  'project-collab': ['board', 'files'],
  'mentorship': ['agenda', 'goals', 'notes'],
  'debate': ['timer', 'scoring', 'voting'],
  'peer-review': ['pdf-viewer', 'rubric', 'feedback'],
}
```

#### 3.0.1 Layout Components

**Audio-Only Layout** (`components/spaces/layouts/audio-only-layout.tsx`):
```tsx
export function AudioOnlyLayout({ participants, activeSpeaker }) {
  return (
    <div className="flex flex-wrap justify-center items-center gap-6 p-8">
      {participants.map(p => (
        <div key={p.user_id} className="flex flex-col items-center gap-2">
          <div className={cn(
            "relative w-24 h-24 rounded-full bg-zinc-800",
            "ring-4 transition-all",
            activeSpeaker === p.user_id 
              ? "ring-emerald-500 scale-110" 
              : "ring-transparent"
          )}>
            <Avatar className="w-full h-full">
              <AvatarImage src={p.avatar} />
              <AvatarFallback>{p.user_name?.[0]}</AvatarFallback>
            </Avatar>
            {/* Audio wave indicator */}
            {activeSpeaker === p.user_id && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                <AudioWaveIndicator />
              </div>
            )}
            {p.audio_muted && (
              <div className="absolute bottom-0 right-0 bg-red-500 rounded-full p-1">
                <MicOff className="h-3 w-3" />
              </div>
            )}
          </div>
          <span className="text-sm text-zinc-400">{p.user_name}</span>
        </div>
      ))}
    </div>
  )
}
```

**Split-Screen Layout** (`components/spaces/layouts/split-screen-layout.tsx`):
```tsx
export function SplitScreenLayout({ 
  participants, 
  activeSpeaker,
  contentPanel,  // 'whiteboard' | 'board' | 'pdf-viewer' etc
  spaceType 
}) {
  return (
    <div className="flex h-full gap-4 p-4">
      {/* Video Panel - Left */}
      <div className="flex-1 flex flex-col gap-3">
        <VideoGrid 
          participants={participants} 
          activeSpeaker={activeSpeaker}
          compact={true}  // Smaller tiles when split
        />
      </div>
      
      {/* Content Panel - Right */}
      <div className="w-1/2 bg-zinc-900 rounded-xl border border-white/10 overflow-hidden">
        {contentPanel === 'whiteboard' && <WhiteboardPanel />}
        {contentPanel === 'board' && <ProjectBoardPanel />}
        {contentPanel === 'pdf-viewer' && <PDFViewerPanel />}
        {contentPanel === 'slides' && <SlidesPanel />}
      </div>
    </div>
  )
}
```

**Speaker-Focus Layout** (`components/spaces/layouts/speaker-focus-layout.tsx`):
```tsx
export function SpeakerFocusLayout({ participants, activeSpeaker, queueEnabled }) {
  const speaker = participants.find(p => p.user_id === activeSpeaker) || participants[0]
  const others = participants.filter(p => p.user_id !== speaker?.user_id)
  
  return (
    <div className="flex h-full gap-4 p-4">
      {/* Main Speaker */}
      <div className="flex-1 relative">
        <div className="w-full h-full bg-zinc-900 rounded-2xl overflow-hidden ring-2 ring-emerald-500/50">
          {speaker?.video ? (
            <video className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Avatar className="h-32 w-32">
                <AvatarFallback>{speaker?.user_name?.[0]}</AvatarFallback>
              </Avatar>
            </div>
          )}
          <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-full">
            <span className="text-white text-sm">{speaker?.user_name} (Speaking)</span>
          </div>
        </div>
      </div>
      
      {/* Thumbnails + Queue */}
      <div className="w-64 flex flex-col gap-4">
        {/* Participant thumbnails */}
        <div className="flex-1 grid grid-cols-2 gap-2 overflow-y-auto">
          {others.map(p => (
            <div key={p.user_id} className="aspect-video bg-zinc-800 rounded-lg" />
          ))}
        </div>
        
        {/* Queue panel for office-hours */}
        {queueEnabled && <QueuePanel />}
      </div>
    </div>
  )
}
```

**Stage-Audience Layout** (`components/spaces/layouts/stage-audience-layout.tsx`):
```tsx
export function StageAudienceLayout({ participants, hosts, pollsEnabled }) {
  const speakers = participants.filter(p => ['host', 'co-host', 'speaker'].includes(p.role))
  const audience = participants.filter(p => p.role === 'listener')
  
  return (
    <div className="flex flex-col h-full gap-4 p-4">
      {/* Stage - Top */}
      <div className="h-2/3 flex gap-4 justify-center">
        {speakers.map(p => (
          <div key={p.user_id} className="flex-1 max-w-md bg-zinc-900 rounded-2xl overflow-hidden">
            {/* Speaker video/avatar */}
          </div>
        ))}
      </div>
      
      {/* Audience - Bottom */}
      <div className="h-1/3 bg-zinc-900/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4" />
          <span className="text-sm text-zinc-400">Audience ({audience.length})</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {audience.slice(0, 20).map(p => (
            <Avatar key={p.user_id} className="h-8 w-8">
              <AvatarFallback className="text-xs">{p.user_name?.[0]}</AvatarFallback>
            </Avatar>
          ))}
          {audience.length > 20 && (
            <span className="text-xs text-zinc-500">+{audience.length - 20} more</span>
          )}
        </div>
      </div>
      
      {/* Polls panel if enabled */}
      {pollsEnabled && <PollsPanel />}
    </div>
  )
}
```

#### 3.0.2 Dynamic Layout Selection in Space Page

**Update:** `app/groups/[id]/spaces/[spaceId]/page.tsx`

```tsx
import { LAYOUT_BY_TYPE, FEATURES_BY_TYPE } from '@/components/spaces/layouts'
import { AudioOnlyLayout } from '@/components/spaces/layouts/audio-only-layout'
import { SplitScreenLayout } from '@/components/spaces/layouts/split-screen-layout'
import { SpeakerFocusLayout } from '@/components/spaces/layouts/speaker-focus-layout'
import { StageAudienceLayout } from '@/components/spaces/layouts/stage-audience-layout'
import { VideoGridLayout } from '@/components/spaces/layouts/video-grid-layout'
import { OneOnOneLayout } from '@/components/spaces/layouts/one-on-one-layout'

// Inside component:
const layoutMode = LAYOUT_BY_TYPE[space.type as SpaceType] || 'video-grid'
const featurePanels = FEATURES_BY_TYPE[space.type as SpaceType] || []

// Render based on layout mode
const renderLayout = () => {
  switch (layoutMode) {
    case 'audio-only':
      return <AudioOnlyLayout participants={dailyParticipants} activeSpeaker={activeSpeaker} />
    
    case 'split-screen':
      return (
        <SplitScreenLayout 
          participants={dailyParticipants}
          activeSpeaker={activeSpeaker}
          contentPanel={featurePanels[0]} // whiteboard, board, etc
          spaceType={space.type}
        />
      )
    
    case 'speaker-focus':
      return (
        <SpeakerFocusLayout 
          participants={dailyParticipants}
          activeSpeaker={activeSpeaker}
          queueEnabled={featurePanels.includes('queue')}
        />
      )
    
    case 'stage-audience':
      return (
        <StageAudienceLayout 
          participants={dailyParticipants}
          hosts={space.hostId}
          pollsEnabled={featurePanels.includes('polls')}
        />
      )
    
    case 'one-on-one':
      return <OneOnOneLayout participants={dailyParticipants} />
    
    default:
      return <VideoGridLayout participants={dailyParticipants} activeSpeaker={activeSpeaker} />
  }
}
```

#### 3.1 New Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [←] Space Title                              [⚙️] [👥 12] [🔴]  │ ← Top Bar
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────── JUMBOTRON (if pinned) ─────────────────┐    │
│  │ 📌 Host pinned: "Midterm review notes..." [link]       │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────┐  ┌─────────────┐  │
│  │                                         │  │ Participants│  │
│  │           VIDEO GRID / STAGE            │  │ ─────────── │  │
│  │                                         │  │ 👑 Alex (H) │  │
│  │     [Speaker View or Grid View]         │  │ 🎤 Jordan   │  │
│  │                                         │  │ 👂 Sam      │  │
│  │                                         │  │ ✋ Casey    │  │
│  └─────────────────────────────────────────┘  │             │  │
│                                                │ ─────────── │  │
│                                                │ [Chat Tab]  │  │
│                                                └─────────────┘  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 🎙️ │ 📹 │ │ ✋ │ 🖥️ │ 📌 │     │ 🔴 Leave │          │    │ ← Control Bar
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.2 Glassmorphism Theme
**Update styles in space page:**

```tsx
// Main container
<div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
  {/* Ambient gradient blobs */}
  <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
  <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
  
  {/* Glass panels */}
  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
    {/* Content */}
  </div>
</div>
```

#### 3.3 Enhanced Video Grid
**New File:** `components/spaces/video-grid.tsx`

```tsx
export function VideoGrid({ participants, activeSpeaker, layout = 'grid' }) {
  return (
    <div className={cn(
      "grid gap-3 p-4",
      layout === 'grid' && participants.length <= 4 && "grid-cols-2",
      layout === 'grid' && participants.length > 4 && "grid-cols-3",
      layout === 'speaker' && "grid-cols-1"
    )}>
      {participants.map(p => (
        <div 
          key={p.user_id}
          className={cn(
            "relative aspect-video bg-zinc-900 rounded-xl overflow-hidden",
            "ring-2 ring-transparent transition-all",
            activeSpeaker === p.user_id && "ring-emerald-500 shadow-lg shadow-emerald-500/20"
          )}
        >
          {p.video ? (
            <video ref={/* daily video element */} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Avatar className="h-20 w-20">
                <AvatarImage src={p.avatar} />
                <AvatarFallback>{p.user_name?.[0]}</AvatarFallback>
              </Avatar>
            </div>
          )}
          
          {/* Overlay info */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <span className="text-xs bg-black/60 px-2 py-1 rounded-full text-white">
              {p.user_name}
            </span>
            <div className="flex items-center gap-1">
              {!p.audio && <MicOff className="h-3 w-3 text-red-400" />}
              {p.screen && <Monitor className="h-3 w-3 text-blue-400" />}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

#### 3.4 Enhanced Control Bar
**New File:** `components/spaces/control-bar.tsx`

```tsx
export function SpaceControlBar({
  audioEnabled, videoEnabled, screenSharing, handRaised,
  onToggleAudio, onToggleVideo, onToggleScreen, onToggleHand,
  onOpenPin, onLeave, isHost
}) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 p-2 rounded-2xl bg-zinc-900/80 backdrop-blur-xl 
                      border border-white/10 shadow-2xl">
        {/* Audio */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={audioEnabled ? "ghost" : "destructive"}
                size="icon"
                className="h-12 w-12 rounded-xl"
                onClick={onToggleAudio}
              >
                {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle microphone</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Video */}
        <Button .../>

        <div className="w-px h-8 bg-white/10" />

        {/* Hand Raise */}
        <Button
          variant={handRaised ? "default" : "ghost"}
          className={cn(handRaised && "bg-amber-500 hover:bg-amber-600")}
          onClick={onToggleHand}
        >
          <Hand className="h-5 w-5" />
        </Button>

        {/* Screen Share */}
        <Button .../>

        {/* Pin (Host only) */}
        {isHost && (
          <Button variant="ghost" onClick={onOpenPin}>
            <Pin className="h-5 w-5" />
          </Button>
        )}

        <div className="w-px h-8 bg-white/10" />

        {/* Leave */}
        <Button variant="destructive" onClick={onLeave} className="px-6">
          <PhoneOff className="h-5 w-5 mr-2" /> Leave
        </Button>
      </div>
    </div>
  )
}
```

---

### Phase 4: Polish & Testing (2 days)

#### 4.1 Responsive Design
- Mobile: Stack layout, collapsible sidebar, floating controls
- Tablet: Hybrid layout
- Desktop: Full side-by-side layout

#### 4.2 Accessibility
- Keyboard shortcuts (M = mute, V = video, H = hand, Esc = leave)
- Screen reader announcements for joins/leaves
- Focus management

#### 4.3 Error Handling
- Network disconnect recovery
- Daily API failures
- Token expiration refresh
- Capacity exceeded handling

#### 4.4 Testing Checklist
- [ ] Create space → Daily room provisioned
- [ ] Join space → Token issued, Daily connected
- [ ] Toggle audio/video → Daily synced
- [ ] Screen share → Works
- [ ] Raise hand → Visible to host
- [ ] Pin content → Visible to all
- [ ] Leave space → Clean disconnect
- [ ] End space (host) → Daily room deleted
- [ ] Network drop → Auto-reconnect
- [ ] Multiple participants → Grid layout works

---

## 📁 Files to Create/Modify

### New Files
```
components/
  spaces/
    layouts/
      index.ts                  # Layout config by space type
      audio-only-layout.tsx     # Social hangout - avatar circles
      video-grid-layout.tsx     # Default grid layout
      split-screen-layout.tsx   # Study/project - video + content
      speaker-focus-layout.tsx  # Office hours - main speaker + queue
      stage-audience-layout.tsx # Lecture/debate - stage + audience
      one-on-one-layout.tsx     # Mentorship - 1:1 equal panels
    panels/
      whiteboard-panel.tsx      # Study session whiteboard
      queue-panel.tsx           # Office hours queue
      slides-panel.tsx          # Lecture slides
      polls-panel.tsx           # Lecture/debate polls
      project-board-panel.tsx   # Project collab board
      pdf-viewer-panel.tsx      # Peer review document
      timer-panel.tsx           # Debate/study timer
      scoring-panel.tsx         # Debate scoring
    jumbotron.tsx               # Featured content banner
    pin-content-dialog.tsx      # Host dialog to pin content
    video-grid.tsx              # Video participant grid
    control-bar.tsx             # Bottom control bar
    participant-sidebar.tsx     # Right sidebar
    speaking-indicator.tsx      # Audio level visualization
    
hooks/
  use-daily-call.ts             # Daily.co call management
  use-daily-participants.ts     # Real-time participant sync
  use-space-realtime.ts         # Supabase realtime for space events

app/api/spaces/[id]/
  featured/
    route.ts                    # GET, POST featured content
    [contentId]/
      route.ts                  # PATCH, DELETE specific content
  participants/[userId]/
    media/
      route.ts                  # PATCH audio/video state
```

### Modified Files
```
app/groups/[id]/spaces/[spaceId]/page.tsx  # Major refactor with layout system
types/spaces.ts                             # Add SpaceFeaturedContent
lib/supabase/repository.ts                  # Add featured content methods
services/SpaceService.ts                    # Add layout helpers
```

---

## 📅 Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **Phase 1:** Daily Integration | 3-4 days | Fully functional A/V with real controls |
| **Phase 2:** Jumbotron | 2-3 days | Hosts can pin announcements/resources |
| **Phase 3:** Type-Based Layouts | 4-5 days | 6 layout modes + feature panels |
| **Phase 4:** UI Polish | 2-3 days | Glassmorphism, responsive, accessibility |
| **Phase 5:** Testing | 2 days | QA, bug fixes, edge cases |
| **Total** | **13-17 days** | Complete Spaces feature with all layouts |

---

## 🚀 Quick Start Checklist

To begin implementation:

1. [ ] Set `DAILY_API_KEY` in `.env.local`
2. [ ] Create `hooks/use-daily-call.ts`
3. [ ] Wire audio/video toggles in space page
4. [ ] Add Daily event listeners for participants
5. [ ] Test basic A/V flow end-to-end
6. [ ] Proceed to Jumbotron once A/V is solid

---

## 📚 References

- **Daily.co Docs:** https://docs.daily.co/reference/daily-js
- **Daily React Hooks:** https://docs.daily.co/reference/daily-react
- **Existing Code:**
  - `lib/daily.ts` - Room/token utils
  - `app/groups/[id]/spaces/[spaceId]/page.tsx` - Current implementation
  - `types/spaces.ts` - Type definitions
