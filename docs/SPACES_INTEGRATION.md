# Spaces Integration for Campus Connect

## Executive Summary

**Spaces** are real-time, ephemeral audio/video rooms that enable spontaneous collaboration within study groups. Unlike persistent chat rooms or scheduled sessions, Spaces are live, drop-in environments where squad members can gather for:

- **Study sprints** - Focus together, ask quick questions
- **Office hours** - Members help each other with assignments
- **Social hangouts** - Casual connection between study sessions
- **Live tutoring** - Peer-to-peer teaching moments
- **Collaborative work** - Working together on group projects

---

## Research: How "Spaces" Work

### Twitter/X Spaces (Social Audio)
- **Live audio rooms** with host controls (mute, remove, co-host)
- **Drop-in model** - See who's in, join instantly
- **Ephemeral** - Not recorded by default, disappears when host ends
- **Roles**: Host, Co-host, Speaker, Listener
- **Discoverability** - Promoted at top of feed, "X is live"

### Discord Stage Channels
- **Audio-first** with audience/speaker model
- **Moderation tools** - Request to speak, mute all
- **Persistent but controllable** - Can be voice channels that toggle to "Stage"
- **Integration** - Tied to server (group) structure

### Clubhouse
- **Pure audio social** - No video distractions
- **Room types**: Open (public), Social (followers), Closed (invite-only)
- **Raise hand** to speak, moderators approve
- **Waves** - Invite specific people to join

### Academic Use Cases
Research shows students use live audio/video for:
1. **Study together silently** (body doubling/coworking)
2. **Quick questions** during homework
3. **Accountability partners** (keep each other on track)
4. **Peer tutoring** without formal scheduling
5. **Social breaks** between study blocks

---

## Campus Connect Spaces: Design Proposal

### What is a Space?

A **Space** is a live, real-time audio/video room within a study group (squad) where members can:
- **Drop in anytime** to study together or ask questions
- **See who's active** before joining
- **Choose audio-only or video** based on preference
- **Host structured or free-form sessions** (office hours, study sprint, social)
- **Automatically close** when empty or host ends

### Space vs. Chat Room vs. Session

| Feature | **Chat Room** | **Session** | **Space** |
|---------|---------------|-------------|-----------|
| **Type** | Text messaging | Scheduled event | Live audio/video |
| **Timing** | Async (persistent) | Fixed time slot | Spontaneous (ephemeral) |
| **Entry** | Always accessible | RSVP required | Drop-in when active |
| **Recording** | Message history saved | Optional recording | Not recorded (privacy) |
| **Use Case** | Announcements, async Q&A | Formal study session | Quick sync, coworking |
| **Duration** | Permanent | 1-3 hours | 15 mins - 2 hours |
| **Capacity** | Unlimited readers | 5-50 (physical limit) | 2-25 (quality limit) |

**Relationship**: A Space can be **linked to a Session** (e.g., "Join the Space for today's Calculus study session") but can also exist independently.

---

## Technical Architecture

### Data Model

```typescript
// Space Type
export type SpaceType = 
  | "study-sprint"      // Silent coworking with accountability
  | "office-hours"      // Q&A, help available
  | "social"            // Casual hangout
  | "collaboration"     // Active group work
  | "tutoring"          // One teaches, others learn
  | "general"           // Unstructured

// Space Privacy
export type SpacePrivacy = 
  | "public"            // Anyone in group can see and join
  | "members-only"      // Only group members
  | "invite-only"       // Host must invite

// Space Status
export type SpaceStatus = 
  | "live"              // Active, joinable
  | "ended"             // Host ended, historical
  | "scheduled"         // Future space (optional)

// Space Participant Role
export type SpaceParticipantRole = 
  | "host"              // Creator, full control
  | "co-host"           // Can moderate, mute, remove
  | "speaker"           // Can speak/share video
  | "listener"          // Audio/video receive only

// Space Interface
export interface Space {
  id: string
  groupId: string
  title: string
  description?: string
  type: SpaceType
  privacy: SpacePrivacy
  status: SpaceStatus
  
  // Host & Participants
  hostId: string
  coHostIds: string[]
  participantIds: string[]
  maxParticipants: number        // 2-25, default 10
  
  // Media Settings
  audioEnabled: boolean           // Default true
  videoEnabled: boolean           // Default false (audio-first)
  screenShareEnabled: boolean     // Default false
  
  // Timing
  startedAt: Date
  endedAt?: Date
  scheduledFor?: Date             // Optional: pre-schedule a space
  
  // Optional Links
  sessionId?: string              // Link to a Session if part of scheduled event
  chatRoomId?: string             // Optional: link to related chat for Q&A text
  
  // Analytics
  peakParticipants: number
  totalJoins: number
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}

// Space Participant (active connection)
export interface SpaceParticipant {
  id: string
  spaceId: string
  userId: string
  role: SpaceParticipantRole
  
  // Media State
  audioMuted: boolean
  videoMuted: boolean
  screenSharing: boolean
  handRaised: boolean             // Request to speak
  
  // Connection
  joinedAt: Date
  leftAt?: Date
  connectionStatus: "connected" | "reconnecting" | "disconnected"
}

// Space Invitation
export interface SpaceInvitation {
  id: string
  spaceId: string
  invitedUserId: string
  invitedByUserId: string
  status: "pending" | "accepted" | "declined"
  createdAt: Date
  expiresAt: Date
}
```

### API Endpoints

```typescript
// Space Management
POST   /api/groups/{groupId}/spaces          // Create & start a space
GET    /api/groups/{groupId}/spaces          // List active spaces in group
GET    /api/spaces/{spaceId}                 // Get space details
PATCH  /api/spaces/{spaceId}                 // Update space (host only)
DELETE /api/spaces/{spaceId}                 // End space (host only)

// Participation
POST   /api/spaces/{spaceId}/join            // Join as listener
POST   /api/spaces/{spaceId}/leave           // Leave space
PATCH  /api/spaces/{spaceId}/participants/{userId}/role  // Change role (host)
POST   /api/spaces/{spaceId}/invite          // Invite specific users

// Media Controls
PATCH  /api/spaces/{spaceId}/me/audio        // Toggle own audio
PATCH  /api/spaces/{spaceId}/me/video        // Toggle own video
POST   /api/spaces/{spaceId}/raise-hand      // Request to speak
POST   /api/spaces/{spaceId}/mute/{userId}   // Mute participant (host)

// Discovery
GET    /api/spaces/live                      // All active spaces user can see
GET    /api/users/{userId}/spaces            // User's space history

// Real-time (WebSocket/SSE)
WS     /api/spaces/{spaceId}/connect         // WebRTC signaling & state sync
```

---

## UX/UI Design

### Space Discovery

**In Group View:**
```
┌─────────────────────────────────────────┐
│ 🎓 Physics Study Squad                  │
├─────────────────────────────────────────┤
│ 📍 Spaces                                │
│                                          │
│ 🔴 LIVE: Office Hours (3 active)        │
│    "Ask anything before the exam"        │
│    🎙️ Alice, Bob, Charlie              │
│    [Join Space →]                        │
│                                          │
│ [+ Start a Space]                        │
└─────────────────────────────────────────┘
```

**Dashboard Widget:**
```
┌─────────────────────────────────────────┐
│ 🔴 Live Spaces                           │
├─────────────────────────────────────────┤
│ Physics Study Squad                      │
│ 🎙️ Study Sprint • 7 joined              │
│                                          │
│ CS Algorithms Group                      │
│ 🎙️ Tutoring Session • 12 joined         │
│                                          │
│ [See all live spaces]                    │
└─────────────────────────────────────────┘
```

### Space Room UI

```
┌──────────────────────────────────────────────────────┐
│  🔴 Office Hours • Physics Study Squad                │
│  "Ask anything before the exam"                       │
├──────────────────────────────────────────────────────┤
│                                                        │
│  🎙️ Host                                              │
│  ┌──────────────┐                                     │
│  │ 👤 Alice     │  [Mute] [Video] [Screen]            │
│  │ 🔊 Speaking  │                                      │
│  └──────────────┘                                     │
│                                                        │
│  🎤 Speakers                                           │
│  ┌────────┐ ┌────────┐ ┌────────┐                    │
│  │ 👤 Bob │ │ 👤 Eve │ │ ✋ Dan │                     │
│  │ 🔇     │ │ 🔊     │ │ (hand) │                     │
│  └────────┘ └────────┘ └────────┘                    │
│                                                        │
│  👥 Listeners (4)                                      │
│  Frank, Grace, Henry, Ivy                             │
│                                                        │
├──────────────────────────────────────────────────────┤
│  [🎙️ Mute] [🎥 Video] [✋ Raise Hand] [⚙️] [Leave]   │
└──────────────────────────────────────────────────────┘
```

### Space Types & Icons

| Type | Icon | Description | Default Media |
|------|------|-------------|---------------|
| **Study Sprint** | ⏱️ | Silent coworking, cameras optional | Audio off, video optional |
| **Office Hours** | 🎙️ | Q&A, help available | Audio on, video off |
| **Social** | 🎉 | Casual hangout | Audio on, video optional |
| **Collaboration** | 🤝 | Group project work | Audio on, video on |
| **Tutoring** | 📚 | Teaching session | Audio on, screen share |
| **General** | 💬 | Unstructured | Audio on, video off |

---

## Integration with Existing Features

### 1. Groups/Squads
- **Spaces tab** in group navigation (alongside Chat, Sessions, Members)
- **Live indicator** on group cards when space is active
- **Permissions**: Any member can start a space (configurable by owner)

### 2. Sessions (Scheduled Events)
- **"Start Space" button** on session page when time arrives
- **Link session to space** - RSVP'd users get notified when space goes live
- **Post-session space** - Continue discussion after formal session ends

### 3. Chat Rooms
- **"Join Space" message** when space starts (bot notification)
- **Parallel chat** - Text questions while space is live (optional)
- **Space ended summary** - "Alice hosted a 45-min space with 8 participants"

### 4. Notifications
- **"X started a space"** in your squad
- **"Space is live"** for session attendees
- **"You're invited to a space"** for direct invites
- **"X raised their hand"** (for hosts)

### 5. Gamification
**Points earned:**
- Host a space: +15 points
- Participate in space: +5 points
- Host 5+ spaces: "Connector" achievement
- Attend 10+ spaces: "Engaged Learner" achievement

### 6. Lumina AI (Future)
- **"Explain in Space"** - Host requests Lumina to generate animation mid-call
- **Space recordings** → AI summaries (opt-in)

---

## Privacy & Safety

### Policies
1. **No recordings by default** - Ephemeral by design (trust & safety)
2. **Opt-in recording** - Host can enable with all-participant consent
3. **Mute & remove** - Hosts can moderate disruptive participants
4. **Report button** - Users can flag inappropriate behavior
5. **Space history** - Metadata logged (who, when, duration) but not content

### Permissions
- **Who can start a space**: Group owner, moderators, any member (configurable)
- **Who can see spaces**: Public (discoverable), Members-only, Invite-only
- **Who can join**: Based on space privacy + group membership

---

## Technical Implementation Plan

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Define Space data models in `types/index.ts`
- [ ] Create Space CRUD API routes
- [ ] Add Space management to dataStore (in-memory)
- [ ] Build basic Space UI (list, create, join)

### Phase 2: Real-Time Audio/Video (Week 3-4)
**WebRTC Integration:**
- [ ] Choose solution: Daily.co API, Twilio Video, Agora.io, or self-hosted (SimpleWebRTC)
- [ ] Implement WebRTC signaling via WebSocket (`/api/spaces/{id}/connect`)
- [ ] Handle peer connections, ICE candidates, media streams
- [ ] Build in-space controls (mute, video toggle, screen share)

**Recommended**: **Daily.co** (best for MVP)
- Simple REST API to create rooms
- Handles WebRTC complexity
- Free tier: 10,000 minutes/month
- React hooks available

### Phase 3: UX Polish (Week 5)
- [ ] Space discovery widget on dashboard
- [ ] Live indicator badges on group cards
- [ ] Participant list with avatars & status
- [ ] "Raise hand" queue for hosts
- [ ] Mobile-responsive UI

### Phase 4: Integrations (Week 6)
- [ ] Link Spaces to Sessions
- [ ] Space notifications (start, invite, hand raised)
- [ ] Chat room announcements
- [ ] Gamification points & achievements

### Phase 5: Advanced Features (Future)
- [ ] Scheduled Spaces (pre-announce)
- [ ] Space recordings (opt-in)
- [ ] AI-generated summaries post-space
- [ ] Breakout rooms for large groups
- [ ] Screen sharing & collaborative whiteboard

---

## Why Spaces Work for Campus Connect

### Student Pain Points Solved
1. **"I need help NOW, not tomorrow"** → Drop-in office hours
2. **"Study groups are hard to coordinate"** → Spontaneous study sprints
3. **"I feel isolated studying alone"** → Coworking spaces with peers
4. **"Too awkward to schedule a 1-on-1"** → Group spaces lower pressure
5. **"Video fatigue from formal meetings"** → Audio-first, optional video

### Competitive Advantage
- **Discord**: Great for gaming, but overwhelming for academics
- **Zoom**: Too formal, scheduling friction
- **Clubhouse**: Dead platform, no academic context
- **Campus Connect Spaces**: Purpose-built for student study groups, integrated with sessions, chat, and gamification

### Adoption Strategy
**Week 1 Launch:**
1. Enable for 3-5 pilot squads (high-engagement groups)
2. Host-guided demo: "Office Hours" space during exam week
3. Collect feedback, iterate on controls

**Week 2-3 Rollout:**
4. Enable for all public groups
5. Promote via notifications ("Try Spaces!")
6. Highlight in onboarding flow

**Week 4+ Optimization:**
7. Track metrics: spaces created, avg. duration, participant satisfaction
8. Add features based on usage (screen share, breakouts, etc.)

---

## Success Metrics

### Engagement
- **Spaces created per week** (target: 50+ by end of semester)
- **Avg. participants per space** (target: 5-8)
- **Avg. space duration** (target: 30-60 mins)
- **Repeat hosts** (target: 30% of users host 2+ spaces)

### Retention
- **Students who join 1+ space stay 2x longer** on platform
- **Groups with active spaces** have 40% higher member retention

### Qualitative
- **"Spaces helped me get unstuck"** - Homework help success stories
- **"Felt less alone studying"** - Social connection testimonials
- **"More productive together"** - Study sprint feedback

---

## Recommended Tech Stack

### For MVP (Fastest Time to Market)
- **Daily.co API** - Managed WebRTC (avoid building infrastructure)
  - REST API to create rooms
  - React components via `@daily-co/daily-react`
  - WebRTC handled, you build UX
  - Cost: Free tier covers MVP, ~$0.0015/min after

### For Custom Control (More Complex)
- **Agora.io** - Flexible WebRTC SDK
  - More customization
  - Screen share, recording, transcription built-in
  - Cost: $0.99/1000 mins (audio), $3.99/1000 mins (video)

### For Open Source / Self-Hosted
- **Jitsi Meet** (embed iframe)
  - Fully open source
  - Self-hosted or use free jitsi.org
  - Less control over UX, but zero cost

---

## Next Steps

1. **Review & approve** this design with team
2. **Choose WebRTC provider** (Daily.co recommended)
3. **Create Spaces data models** in `types/index.ts`
4. **Build Phase 1 API routes** (`/api/groups/{id}/spaces`)
5. **Design UI mockups** in Figma (optional but recommended)
6. **Implement core Space room** with Daily.co integration
7. **Pilot with 3-5 groups** for feedback
8. **Iterate and roll out** campus-wide

---

## Appendix: Example Space Scenarios

### Scenario 1: Last-Minute Exam Prep
> **Friday, 8 PM** - Alice opens the Physics squad, sees 12 members online.  
> She starts an **Office Hours space**: "Last-minute questions before tomorrow's exam?"  
> Within 5 minutes, 6 people join. Bob asks about projectile motion, Alice explains verbally, shares her screen with notes.  
> 45 minutes later, everyone feels more confident. Space ends, Alice earns +15 points, participants +5 each.

### Scenario 2: Silent Study Sprint
> **Monday, 2 PM** - Charlie wants accountability to finish his essay.  
> He starts a **Study Sprint space** (audio muted by default, cameras optional).  
> 4 squad members join, everyone works silently but knows others are there.  
> Every 25 minutes, Charlie says "Break time!" and they chat for 5 mins.  
> 2 hours later, everyone's made progress and feels accomplished.

### Scenario 3: Impromptu Tutoring
> **Wednesday, 6 PM** - Eve struggles with linear algebra homework.  
> She posts in the Math squad chat: "Anyone free to help with eigenvectors?"  
> Alice sees it, starts a **Tutoring space** and invites Eve directly.  
> Eve joins, Alice explains on a virtual whiteboard (screen share), 2 others join to learn too.  
> 30 minutes, problem solved. Eve thanks Alice, rates the space 5/5.

---

**End of Document**

_This design document is ready for implementation. Recommend starting with Phase 1 (data models & API) this week._
