# Spaces: Quick Reference Card

## 📌 What Are Spaces?

**Live, drop-in audio/video rooms for spontaneous collaboration within study groups**

```
Chat (async) ← → Spaces (live/spontaneous) ← → Sessions (scheduled)
```

---

## 🎯 6 Space Types

| Type | Icon | Use Case | Media Default |
|------|------|----------|---------------|
| **Study Sprint** | ⏱️ | Silent coworking, accountability | Audio off, video optional |
| **Office Hours** | 🎙️ | Q&A, drop-in help | Audio on, video off |
| **Social** | 🎉 | Casual hangout | Audio on, video optional |
| **Collaboration** | 🤝 | Active group work | Audio on, video on |
| **Tutoring** | 📚 | Peer teaching | Audio on, screen share |
| **General** | 💬 | Unstructured | Audio on, video off |

---

## 🔑 Key Characteristics

✅ **Spontaneous** - Start now, no scheduling  
✅ **Ephemeral** - Disappears when ended (not recorded)  
✅ **Drop-in** - See who's in, join anytime  
✅ **Audio-first** - Video optional (reduce fatigue)  
✅ **2-25 participants** - Optimized for quality  
✅ **Integrated** - Links to sessions, chat, groups  

---

## 🆚 vs. Other Features

| | **Chat** | **Space** | **Session** |
|-|----------|-----------|-------------|
| **Timing** | Async | Live | Scheduled |
| **Medium** | Text | Audio/Video | In-person/Virtual |
| **Duration** | Permanent | 15min-2hr | 1-3hr |
| **Entry** | Always open | Drop-in live | RSVP required |

---

## 🎬 Example Scenarios

### 1️⃣ Last-Minute Help
> **9 PM:** Bob stuck on homework  
> **Action:** Starts "Quick Help" space  
> **Result:** Alice joins in 2 mins, problem solved in 15 mins

### 2️⃣ Study Accountability  
> **2 PM:** Charlie needs to finish essay  
> **Action:** Starts "Study Sprint" (muted, cameras optional)  
> **Result:** 4 friends join, work silently for 2 hours with breaks

### 3️⃣ Exam Week Panic
> **Night Before:** 10 PM, anxiety rising  
> **Action:** "Office Hours" space opens  
> **Result:** 6 people join, rapid-fire Q&A, confidence restored

---

## 🏗️ Data Model (Summary)

```typescript
interface Space {
  id: string
  groupId: string
  title: string
  type: "study-sprint" | "office-hours" | "social" | "collaboration" | "tutoring" | "general"
  status: "live" | "ended" | "scheduled"
  hostId: string
  participantIds: string[]
  maxParticipants: number  // 2-25
  audioEnabled: boolean
  videoEnabled: boolean
  startedAt: Date
  endedAt?: Date
  sessionId?: string  // Optional link
  roomUrl?: string  // WebRTC (Daily.co)
}
```

---

## 🛠️ API Endpoints (To Build)

```
POST   /api/groups/{groupId}/spaces     Create & start
GET    /api/groups/{groupId}/spaces     List active
POST   /api/spaces/{spaceId}/join       Join space
PATCH  /api/spaces/{spaceId}/me/audio   Toggle audio
POST   /api/spaces/{spaceId}/raise-hand Request to speak
DELETE /api/spaces/{spaceId}            End (host only)
```

---

## 🔌 Integration Points

### Groups/Squads
- Spaces tab in navigation
- 🔴 LIVE badge when active
- Settings: Who can create?

### Sessions
- "Start Space" button at session time
- Link RSVP'd users to live space

### Chat Rooms
- Bot notification: "Alice started Office Hours 🎙️"
- Summary when space ends

### Notifications
- "X started a space"
- "You're invited to a space"
- "X raised their hand"

### Gamification
- Host: +15 points
- Join: +5 points
- Achievements unlocked

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [x] Design document ✅
- [x] Data types ✅
- [ ] API routes
- [ ] Basic UI

### Phase 2: WebRTC (Week 3-4)
- [ ] Daily.co integration
- [ ] In-space controls
- [ ] Join/leave logic

### Phase 3: Discovery (Week 5)
- [ ] Dashboard widget
- [ ] Link to sessions
- [ ] Notifications

---

## 🎨 UI Mockup (Conceptual)

```
┌────────────────────────────────────┐
│ Physics Study Squad                │
├────────────────────────────────────┤
│ 📍 Spaces                           │
│                                    │
│ 🔴 LIVE: Office Hours              │
│    "Last-minute exam questions"    │
│    🎙️ Alice, Bob, Charlie (3)    │
│    Started 15 mins ago             │
│    [Join Space →]                  │
│                                    │
│ [+ Start a Space]                  │
└────────────────────────────────────┘
```

---

## 📊 Success Metrics

- **50+ spaces/week** by end of semester
- **5-8 avg. participants** per space
- **30-60 min avg. duration**
- **2x retention** for users who join spaces

---

## 🔐 Privacy & Safety

1. ❌ Not recorded by default (ephemeral)
2. ✅ Host can mute/remove disruptive users
3. 🚨 Report button for inappropriate behavior
4. 📝 Metadata logged (who, when) but not content
5. 🔒 Permissions based on group membership

---

## 🎯 Why Students Need This

❌ **Problem:** "I need help NOW, not tomorrow"  
✅ **Solution:** Drop-in office hours space

❌ **Problem:** "Hard to coordinate study groups"  
✅ **Solution:** Spontaneous study sprints

❌ **Problem:** "Feel isolated studying alone"  
✅ **Solution:** Coworking spaces with peers

❌ **Problem:** "Video calls are exhausting"  
✅ **Solution:** Audio-first, video optional

---

## 🧰 Recommended Tech

**Daily.co** (Managed WebRTC)
- ✅ Free tier: 10,000 mins/month
- ✅ React hooks ready
- ✅ REST API for rooms
- ✅ No infrastructure needed

**Alternative:** Agora.io (more control) or Jitsi (open source)

---

## 📚 Full Documentation

- **Design:** `docs/SPACES_INTEGRATION.md`
- **Summary:** `docs/SPACES_SUMMARY.md`
- **Comparison:** `docs/SPACES_COMPARISON.md`
- **Types:** `types/index.ts` (Space, SpaceParticipant, SpaceInvitation)

---

## ✅ Next Actions

1. **Review design** with team
2. **Choose WebRTC provider** (Daily.co recommended)
3. **Build Phase 1 API** (CRUD endpoints)
4. **Create UI mockups** in Figma
5. **Implement core Space room** with WebRTC
6. **Pilot with 3-5 groups** for feedback
7. **Iterate & roll out** campus-wide

---

**Status:** Design complete ✅ | Types defined ✅ | Ready to build 🚀
