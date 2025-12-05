# Campus Connect: Communication Layers Explained

## The Three Communication Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CAMPUS CONNECT                                │
│                     Study Group Ecosystem                             │
└─────────────────────────────────────────────────────────────────────┘

        ASYNC              SYNCHRONOUS (LIVE)         SCHEDULED
    ┌─────────────┐      ┌──────────────────┐      ┌─────────────┐
    │ Chat Rooms  │      │     SPACES       │      │  Sessions   │
    │   💬📝      │      │     🎙️🔴       │      │   📅🎓     │
    └─────────────┘      └──────────────────┘      └─────────────┘
         │                       │                        │
         │                       │                        │
    Persistent            Ephemeral/Live            Fixed Schedule
    Any time              Drop-in now                RSVP required
    Text messages         Audio/Video                1-3 hours
    Always accessible     15min-2hr                  Physical/Virtual
    Announcements         Spontaneous                Formal study
```

---

## Feature Comparison Matrix

| Dimension | **Chat Rooms** | **Spaces** | **Sessions** |
|-----------|----------------|------------|--------------|
| **Medium** | Text only | Audio/Video | In-person or virtual |
| **Timing** | Asynchronous | Real-time (live) | Pre-scheduled |
| **Duration** | Permanent | 15 mins - 2 hours | 1-3 hours |
| **Entry Barrier** | None (always open) | Low (join when live) | Medium (RSVP first) |
| **Discovery** | Always visible in group | "🔴 LIVE" indicator | Calendar view |
| **Participation** | Read anytime, respond when ready | Join/leave dynamically | Commit in advance |
| **History** | Full message history | No recording (default) | Optional recordings |
| **Capacity** | Unlimited readers | 2-25 participants | 5-50 (venue limit) |
| **Privacy** | Group members | Group members | Public/invite-only |
| **Formality** | Casual | Semi-casual | Formal |

---

## When to Use Each Layer

### Use **Chat Rooms** 💬 for:
- ✅ Announcements to all members
- ✅ Async Q&A (answer when you can)
- ✅ Sharing resources (links, files)
- ✅ Long-form discussions
- ✅ Non-urgent communication

**Example:** "Reminder: Exam is next Friday. Here's the study guide link."

---

### Use **Spaces** 🎙️ for:
- ✅ **Quick sync** - "Anyone free to help with problem 5?"
- ✅ **Study together silently** - Accountability coworking
- ✅ **Drop-in office hours** - Spontaneous Q&A
- ✅ **Social connection** - Casual hangout between study sessions
- ✅ **Impromptu tutoring** - One person teaches live
- ✅ **Last-minute prep** - Night before exam cramming

**Example:** "Starting a space now for anyone stuck on the homework. Join if you need help!"

---

### Use **Sessions** 📅 for:
- ✅ **Formal study sessions** - Library meetup, 2 hours
- ✅ **Guest speakers** - Invite a TA or professor
- ✅ **Group project meetings** - Coordinated work time
- ✅ **Exam review workshops** - Structured prep
- ✅ **Social events** - Party, game night (requires planning)

**Example:** "Physics Midterm Review - Saturday 2-4pm, Library Room 203. RSVP below."

---

## Real-World Student Scenarios

### Scenario 1: Homework Help (Urgent)
**Problem:** It's 9 PM, Bob is stuck on calculus homework due at midnight.

❌ **Chat Room**: He posts "Help with derivatives?" but no one responds fast enough.  
✅ **Space**: He sees Alice is online, starts a "Quick Help" space. Alice joins in 2 mins, explains on whiteboard (screen share), problem solved in 15 mins.  
❌ **Session**: Too formal, requires scheduling in advance.

**Winner: Space** - Immediate, synchronous, low-friction.

---

### Scenario 2: Group Study (Planned)
**Problem:** Physics squad wants to prep for midterm next Saturday.

❌ **Chat Room**: Hard to coordinate, messages get lost.  
❌ **Space**: Good for day-of, but not for planning a week ahead.  
✅ **Session**: Alice creates "Midterm Prep - Sat 2-4pm". Everyone RSVPs, shows up, 2-hour focused study.

**Winner: Session** - Scheduled, formal, RSVP tracking.

---

### Scenario 3: Lonely Studying
**Problem:** Charlie needs to write an essay but keeps procrastinating alone.

❌ **Chat Room**: Posting "writing my essay" doesn't help motivation.  
✅ **Space**: He starts a "Study Sprint" space (cameras on, audio muted). 4 people join, everyone works silently but knows others are there. Break every 25 mins.  
❌ **Session**: Too formal for "just vibing while working."

**Winner: Space** - Accountability, coworking, spontaneous.

---

### Scenario 4: Announcements
**Problem:** Group admin needs to share exam schedule with everyone.

✅ **Chat Room**: Posts "Exam schedule updated: [link]". Everyone can see it anytime.  
❌ **Space**: Audio announcement would be missed by anyone not online now.  
❌ **Session**: Not an event, just information sharing.

**Winner: Chat Room** - Async, persistent, accessible.

---

## How They Work Together (Integrated Flow)

### Example: Midterm Prep Week

**Monday (5 days before exam):**
```
📝 Chat Room: Alice posts "Who wants to study together this week?"
   - 8 people react 👍
   - Alice creates a Session: "Friday 6-9pm, Library"
```

**Wednesday (3 days before):**
```
🎙️ Space: Bob starts "Quick Q&A" space at 8pm
   - 4 people drop in, ask random questions
   - Space ends after 45 mins
   
📝 Chat Room: Bob posts "Thanks for joining the space! Here's a summary..."
```

**Friday (Session day):**
```
📅 Session: "Midterm Prep" starts at 6pm (12 people RSVP'd)
   - Alice clicks "Start Space" → Opens live audio/video room
   - Everyone joins the Space via the Session link
   - 3-hour structured study with breaks
   
📝 Chat Room: After session, someone posts practice problems
```

**Saturday (1 day before exam):**
```
🎙️ Space: 10pm, last-minute panic
   - Charlie starts "Last-minute questions" space
   - 6 people join, rapid-fire Q&A
   - Everyone feels more confident

📝 Chat Room: Charlie posts "Good luck tomorrow everyone! 🍀"
```

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Group                                │
│                  "Physics Study Squad"                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📝 Chat Rooms (Persistent)                                 │
│    ├─ General Discussion                                    │
│    ├─ Homework Help                                         │
│    └─ Resources & Links                                     │
│                                                              │
│  🎙️ Spaces (Live/Ephemeral)                                │
│    ├─ 🔴 LIVE: Office Hours (5 joined)                     │
│    ├─ 🔴 LIVE: Study Sprint (3 joined)                     │
│    └─ [+ Start a Space]                                     │
│                                                              │
│  📅 Sessions (Scheduled)                                    │
│    ├─ Midterm Prep - Fri 6pm (12 RSVP'd)                  │
│    ├─ Weekly Study - Every Mon 7pm                         │
│    └─ [+ Create Session]                                    │
│                                                              │
│  👥 Members (82)                                            │
│  ⚙️ Settings                                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Relationships

```typescript
Group {
  id: "physics-squad"
  chatRooms: [
    { id: "general", name: "General Discussion" },
    { id: "homework", name: "Homework Help" }
  ]
  activeSpaces: [
    { id: "space-1", status: "live", title: "Office Hours", participants: 5 },
    { id: "space-2", status: "live", title: "Study Sprint", participants: 3 }
  ]
  sessions: [
    { id: "session-1", title: "Midterm Prep", startAt: "2024-11-15T18:00:00Z" }
  ]
}

// A Session can have a linked Space
Session {
  id: "session-1"
  groupId: "physics-squad"
  title: "Midterm Prep"
  linkedSpaceId: "space-3"  // ← Host clicked "Start Space"
}

// A Space can optionally link to a Session
Space {
  id: "space-3"
  groupId: "physics-squad"
  sessionId: "session-1"  // ← Created from a Session
  status: "live"
}

// Chat Rooms are independent but can reference Spaces
ChatMessage {
  content: "Office Hours space is live! 🎙️"
  actionUrl: "/spaces/space-1"
  type: "space-announcement"
}
```

---

## User Flows

### Flow 1: Starting a Space (Spontaneous)
```
1. User is in "Physics Study Squad" group page
2. Sees "📍 Spaces" section (currently empty)
3. Clicks [+ Start a Space]
4. Modal appears:
   - Select type: ⏱️ Study Sprint / 🎙️ Office Hours / 🎉 Social / etc.
   - Enter title: "Last-minute Exam Prep"
   - Choose privacy: Members only / Public
   - [Start Space]
5. Space goes live:
   - User enters as host
   - Notification sent to group members: "Alice started a space"
   - Appears in group's Spaces section with 🔴 LIVE indicator
6. Others see notification, click "Join Space"
7. Host ends space → Disappears, summary posted to chat
```

### Flow 2: Linking Space to Session
```
1. Session "Midterm Prep" is scheduled for Friday 6pm
2. Friday arrives, session page shows countdown
3. At 6pm, host clicks [Start Space]
4. Space is created automatically, linked to session
5. All RSVP'd users get notification: "Session is live! Join the space"
6. Space inherits session metadata (title, description, attendees)
7. When space ends, session marked as "completed"
```

### Flow 3: Discovering Live Spaces
```
Dashboard Widget:
┌────────────────────────────────────┐
│ 🔴 Live Spaces (2 active)          │
├────────────────────────────────────┤
│ Physics Study Squad                │
│ 🎙️ Office Hours • 5 joined       │
│ Hosted by Alice • Started 15m ago │
│ [Join]                             │
│                                    │
│ CS Algorithms                      │
│ ⏱️ Study Sprint • 8 joined        │
│ Hosted by Bob • Started 1h ago    │
│ [Join]                             │
└────────────────────────────────────┘
```

---

## Migration Path (Implementation Order)

### Phase 0: Current State
- ✅ Groups with members
- ✅ Chat rooms (text)
- ✅ Sessions (scheduled events)
- ✅ No live audio/video

### Phase 1: Spaces Foundation
- [ ] Add Space types to data models
- [ ] Create Space CRUD API
- [ ] Build basic UI (list, create, join button)
- **Result:** Can create spaces, but no media yet (placeholder UI)

### Phase 2: WebRTC Integration
- [ ] Integrate Daily.co (or Agora/Jitsi)
- [ ] Implement join/leave with real audio/video
- [ ] Build in-space controls (mute, video, screen share)
- **Result:** Functional live audio/video rooms

### Phase 3: Discovery & Integration
- [ ] Dashboard widget showing live spaces
- [ ] Link spaces to sessions ("Start Space" button)
- [ ] Notifications (space started, invitation)
- [ ] Chat room announcements
- **Result:** Full integration across platform

---

## Summary: The Three Pillars

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Chat Rooms  │  │    Spaces    │  │   Sessions   │
│     💬       │  │     🎙️      │  │     📅      │
├──────────────┤  ├──────────────┤  ├──────────────┤
│ Persistent   │  │  Ephemeral   │  │  Scheduled   │
│ Async        │  │  Live        │  │  Fixed Time  │
│ Text         │  │  Audio/Video │  │  In-person+  │
│ No limit     │  │  2-25 people │  │  5-50 people │
│ Always open  │  │  Drop-in     │  │  RSVP first  │
└──────────────┘  └──────────────┘  └──────────────┘
       ↓                 ↓                  ↓
   Foundation      New Feature       Already Built
```

**Spaces fill the gap between "quick text" and "formal meetings"**

---

## Why Students Will Love Spaces

1. **Lower friction than scheduling** - No calendar invite needed
2. **Higher bandwidth than text** - Explain concepts verbally
3. **Spontaneous connection** - "See who's around" and join
4. **Accountability** - Study together without awkward 1-on-1
5. **Voice > Video** - Less intimidating, no "Zoom fatigue"

---

**Next Step:** Build Phase 1 (API & Data Layer) - See `docs/SPACES_INTEGRATION.md` for detailed implementation plan.
