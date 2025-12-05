# Spaces Integration Summary

## What Are Spaces?

**Spaces** are live, real-time audio/video rooms within study groups that enable spontaneous collaboration. Think of them as the "live" layer between async chat and scheduled sessions.

```
Chat Rooms (Async) ← → Spaces (Live/Spontaneous) ← → Sessions (Scheduled)
```

---

## Key Differentiators

| Feature | **Chat Room** | **Space** | **Session** |
|---------|---------------|-----------|-------------|
| **Type** | Text (async) | Audio/Video (live) | Scheduled event |
| **Timing** | Permanent | Ephemeral (15min-2hr) | Fixed time slot |
| **Entry** | Always open | Drop-in when live | RSVP required |
| **Use Case** | Announcements | Quick sync, coworking | Formal study event |

---

## 6 Space Types for Students

1. **⏱️ Study Sprint** - Silent coworking for accountability
2. **🎙️ Office Hours** - Drop-in Q&A and help
3. **🎉 Social** - Casual hangout between study sessions
4. **🤝 Collaboration** - Active group project work
5. **📚 Tutoring** - Peer-to-peer teaching
6. **💬 General** - Unstructured conversation

---

## Real-World Use Cases

### 1. Last-Minute Exam Prep
> Alice starts an **Office Hours** space Friday night before the exam.  
> 6 squad members join, ask questions, Alice screen-shares notes.  
> 45 mins later, everyone feels more prepared.

### 2. Silent Study Sprint  
> Charlie needs accountability to finish his essay.  
> He starts a **Study Sprint** (audio muted, cameras optional).  
> 4 members join, work silently for 2 hours with 5-min breaks.

### 3. Impromptu Tutoring
> Eve posts in chat: "Help with eigenvectors?"  
> Alice starts a **Tutoring** space, invites Eve directly.  
> Screen-shares a whiteboard, 2 others join to learn too.

---

## Technical Architecture

### Data Model Added to `types/index.ts`

```typescript
// Space with 6 types, 3 privacy levels, 3 statuses
interface Space {
  id: string
  groupId: string
  title: string
  type: SpaceType  // study-sprint, office-hours, etc.
  status: SpaceStatus  // live, ended, scheduled
  hostId: string
  participantIds: string[]
  maxParticipants: number  // 2-25
  audioEnabled: boolean
  videoEnabled: boolean
  startedAt: Date
  endedAt?: Date
  sessionId?: string  // Optional link to Session
  roomUrl?: string  // WebRTC URL (Daily.co)
}

// Participant roles & media state
interface SpaceParticipant {
  userId: string
  role: "host" | "co-host" | "speaker" | "listener"
  audioMuted: boolean
  videoMuted: boolean
  handRaised: boolean  // Request to speak
}
```

### API Endpoints to Build

```
POST   /api/groups/{groupId}/spaces          Create & start space
GET    /api/groups/{groupId}/spaces          List active spaces
POST   /api/spaces/{spaceId}/join            Join as listener
PATCH  /api/spaces/{spaceId}/me/audio        Toggle own audio
POST   /api/spaces/{spaceId}/raise-hand      Request to speak
DELETE /api/spaces/{spaceId}                 End space (host)
WS     /api/spaces/{spaceId}/connect         WebRTC signaling
```

---

## Integration Points

### 1. Groups/Squads
- **Spaces tab** in group navigation
- **🔴 LIVE badge** when space is active
- **Settings**: Who can create spaces? (owner/mods/all)

### 2. Sessions (Scheduled Events)
- **"Start Space" button** when session time arrives
- Link RSVP'd users to the live space
- Post-session space for continued discussion

### 3. Chat Rooms
- **Bot notification** when space starts: "Alice started Office Hours 🎙️ [Join]"
- Parallel text chat during space (optional)
- Summary message when space ends

### 4. Notifications
- "X started a space in your squad"
- "You're invited to a space"
- "X raised their hand" (for hosts)

### 5. Gamification
- Host a space: **+15 points**
- Join a space: **+5 points**
- Achievements: "Connector" (host 5+), "Engaged Learner" (join 10+)

---

## WebRTC Implementation

### Recommended: Daily.co (Easiest for MVP)

**Why Daily.co?**
- ✅ Managed WebRTC (no infrastructure)
- ✅ React hooks (`@daily-co/daily-react`)
- ✅ Free tier: 10,000 mins/month
- ✅ REST API to create rooms
- ✅ Built-in screen share, recording

**How it works:**
1. API creates Daily.co room → returns `roomUrl`
2. Frontend embeds Daily iframe/React component
3. Daily handles peer connections, ICE, media streams
4. You build custom UI controls on top

**Alternative:** Agora.io (more customization) or Jitsi (open source/self-hosted)

---

## Privacy & Safety

1. **Not recorded by default** - Ephemeral by design
2. **Opt-in recording** - Host can enable with consent
3. **Moderation tools** - Mute, remove disruptive users
4. **Report button** - Flag inappropriate behavior
5. **History logged** - Metadata only (who, when, duration)

---

## Implementation Phases

### Phase 1: Data & API (Week 1-2)
- [x] Define Space types in `types/index.ts` ✅
- [ ] Create Space CRUD API routes
- [ ] Add Space management to dataStore
- [ ] Build basic UI (list, create modal)

### Phase 2: WebRTC (Week 3-4)
- [ ] Integrate Daily.co API
- [ ] Build in-space UI with controls
- [ ] Handle join/leave/mute/video
- [ ] Implement "raise hand" queue

### Phase 3: Discovery & Integration (Week 5)
- [ ] Dashboard widget (live spaces)
- [ ] Group spaces tab
- [ ] Link to Sessions
- [ ] Chat room announcements

### Phase 4: Advanced (Week 6+)
- [ ] Space invitations
- [ ] Screen sharing
- [ ] Scheduled spaces (pre-announce)
- [ ] Breakout rooms (future)

---

## Success Metrics

- **Spaces created/week**: Target 50+ by end of semester
- **Avg. participants**: 5-8 per space
- **Avg. duration**: 30-60 minutes
- **Retention**: Students who join 1+ space stay 2x longer

---

## Why This Works for Campus Connect

### Student Problems Solved
1. ✅ "Need help NOW" → Drop-in office hours
2. ✅ "Hard to coordinate study groups" → Spontaneous sprints
3. ✅ "Feel isolated studying alone" → Coworking with peers
4. ✅ "Awkward to schedule 1-on-1" → Group spaces lower pressure
5. ✅ "Video fatigue" → Audio-first, optional video

### vs. Competitors
- **Discord**: Gaming-focused, overwhelming UI
- **Zoom**: Too formal, requires scheduling
- **Clubhouse**: Dead, no academic context
- **Campus Connect**: Purpose-built for students, integrated with groups/sessions

---

## Next Steps

1. ✅ **Design document created** (`docs/SPACES_INTEGRATION.md`)
2. ✅ **Types defined** (`types/index.ts`)
3. ✅ **Group model updated** (added `activeSpaces`, `spaceSettings`)
4. **Next:** Build Phase 1 API routes for Space CRUD
5. **Then:** Integrate Daily.co and build UI

---

## Example UI Flow

### Starting a Space
```
User in "Physics Study Squad"
→ Clicks "Start a Space"
→ Modal: "What kind of space?"
   ⏱️ Study Sprint
   🎙️ Office Hours  ← Selected
   🎉 Social
→ "Add title" → "Midterm Prep Q&A"
→ [Start Space]
→ Space goes live, notifications sent
→ User enters space as host
```

### Joining a Space
```
Dashboard shows: "🔴 3 Live Spaces"
→ Physics Study Squad
   🎙️ Midterm Prep Q&A (5 joined)
   Hosted by Alice
→ [Join Space]
→ Enters as listener
→ Can raise hand to speak
→ Host promotes to speaker
```

---

**Full details:** See `docs/SPACES_INTEGRATION.md`
