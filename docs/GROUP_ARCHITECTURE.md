# Squad/Group Architecture Documentation

## Overview

A **Squad** (also called a **Group**) is the core organizational unit in Campus Connect. It serves as a collaborative space where students with shared interests can connect, communicate, and organize activities around common topics.

## What is a Squad/Group?

### Core Purpose
- **Community Hub**: A dedicated space for students to gather around shared academic or extracurricular interests
- **Collaboration Platform**: Enables group study, project coordination, event organization, and networking
- **Engagement Driver**: Encourages participation, point accumulation, and level progression through group activities

### Key Characteristics
| Aspect | Details |
|--------|---------|
| **Creation** | Any authenticated user can create a squad |
| **Ownership** | Creator becomes the owner with full administrative rights |
| **Membership** | Users can join squads based on interests and needs |
| **Privacy** | Squads can be public (discoverable) or private (invitation-only) |
| **Topics** | Squads are tagged with multiple interest topics for categorization |
| **Lifetime** | Squads persist as long as they have active engagement |

---

## Data Structure

### GroupData Interface
```typescript
interface GroupData {
  id: string                          // Unique squad identifier
  title: string                       // Squad name (e.g., "CS 456 Study Squad")
  description: string                 // What the squad is about
  ownerId: string                     // User ID of the creator/owner
  privacy: string                     // "public" or "private"
  topics: string[]                    // Interest tags (e.g., ["Computer Science", "Study Groups"])
  location?: string                   // Physical or virtual meeting location
  avatar?: string                     // Squad profile image
  createdAt: string                   // ISO timestamp of creation
  updatedAt: string                   // ISO timestamp of last update
  memberCount: number                 // Total number of members
  
  // Related entities
  members?: Array<{
    id: string
    userId: string
    role: "owner" | "member" | "moderator"
    user?: UserProfile
  }>
  creator?: {
    id: string
    name: string
    username: string
    avatar?: string
  }
  chatRooms?: Array<{
    id: string
    name: string
    topic?: string
  }>
}
```

---

## Relationships with Other Entities

### 1. **Users & Members**

#### Relationship
- **One-to-Many**: One squad can have many members
- **Many-to-Many**: One user can be a member of many squads

#### Roles
```
- Owner: Created the squad, has full admin rights
  - Can delete the squad
  - Can manage members (add/remove/promote)
  - Can edit squad details
  - Can create chat rooms and events

- Moderator: Trusted member with moderation powers
  - Can remove members or messages
  - Can manage chat rooms
  - Cannot delete the squad or edit core details

- Member: Regular participant
  - Can view squad content
  - Can send messages
  - Can participate in events
  - Can view member profiles
```

#### User Engagement
```
UserProfile
├── squads: string[]           // IDs of squads user is part of
├── level: UserLevelData       // Points earned through squad activities
└── preferences: UserPreferences
    └── interests: string[]    // Matched against squad topics
```

### 2. **Chat Rooms & Messages**

#### Structure
```
Squad
├── ChatRoom (multiple)
│   ├── id: string
│   ├── name: string (e.g., "general", "resources", "announcements")
│   ├── topic: string (e.g., "General discussion", "Share study materials")
│   ├── members: User[]
│   └── messages: ChatMessage[]
│       ├── id: string
│       ├── senderId: string
│       ├── content: string
│       ├── timestamp: Date
│       └── replyToId?: string (for threaded conversations)
```

#### How It Works
- **Default Rooms**: "general" and "resources" created automatically with each squad
- **Custom Rooms**: Owner/moderators can create topic-specific rooms
- **Real-time Updates**: Chat rooms support live messaging and notifications
- **Activity Tracking**: Messages count toward user level progression

#### Point Allocation
```
Message sent in squad chat        → 1 point per message
Active participation streak       → Bonus points for consistent engagement
```

### 3. **Events & Sessions**

#### Relationship
```
Squad
└── Session (Study sessions, meetings, hackathons)
    ├── hostId: string (User who organized it)
    ├── startAt: Date
    ├── endAt: Date
    ├── capacity: number
    ├── location: string
    └── rsvps: RSVP[]
        └── User attendance tracking
```

#### Point System for Events
```
Event attendance (on time)        → 10 points
Event attendance (late)           → 5 points
Event creation by owner/moderator → 15 points
Event cancellation impact         → -5 points
```

### 4. **User Levels & Achievements**

#### Level Progression Through Groups
```
UserLevelData
├── totalPoints: number
│   ├── += Message sent in squad: 1 pt
│   ├── += Event attended: 10 pts
│   ├── += Squad created: 15 pts
│   └── += Active participation: Bonus pts
│
├── currentLevel: "Novice" | "Learner" | "Collaborator" | "Expert" | "Master"
│   ├── Novice: 0-99 points
│   ├── Learner: 100-299 points
│   ├── Collaborator: 300-699 points
│   ├── Expert: 700-1499 points
│   └── Master: 1500+ points
│
├── totalSquadsCreated: number
├── totalEventsAttended: number
├── totalMessagesCount: number
├── loginStreak: number
└── achievements: Achievement[]
    ├── First Squad
    ├── Squad Organizer
    ├── Community Builder
    ├── Study Champion
    └── ...more
```

#### Squad-Related Achievements
```
- "First Squad": Created first squad
- "Squad Builder": Created 3+ squads
- "Community Leader": Squad has 50+ members
- "Event Master": Organized 10+ events in a squad
- "Study Champion": Attended 20+ study sessions
```

---

## Squad Lifecycle

### Creation Phase
1. **User initiates** squad creation
2. **Required inputs**: Title, Description, Privacy, Topics, Location (optional)
3. **System creates**:
   - Group record with owner = current user
   - Default chat rooms ("general", "resources")
   - Owner membership record
   - Initial level data (0 points for squad creation reward pending first activity)
4. **Owner automatically becomes** member with "owner" role

### Growth Phase
1. **Discovery**: Squad appears in public listing if privacy = "public"
2. **Members join**: Users can:
   - Click "Join Squad" button
   - Add themselves to the member list
   - Receive notifications about squad activity
3. **Engagement**: 
   - Members post messages → accumulate points
   - Members attend events → earn attendance points
   - Members interact → build community

### Maturation Phase
1. **Admin actions**:
   - Owner/moderators create events
   - Owner/moderators manage moderators
   - Owner/moderators create custom chat rooms
2. **Content accumulation**:
   - Messages and conversations grow
   - Event history builds
   - Resource library expands
3. **Leadership**: 
   - Active members may be promoted to moderators
   - Community norms establish

### Decline/Archive Phase
1. **Inactivity**: Squad with no messages/events for 30+ days
2. **Owner actions**: 
   - Can delete squad (removes all associated data)
   - Can archive (preserves history but freezes activity)
3. **Member exit**: Users can leave squad anytime

---

## How Squads Link Throughout the Website

### 1. **Home/Landing Page**
```
Homepage
├── Featured Squads Carousel
│   └── Shows trending/popular public squads
├── Squad Discovery Section
│   └── "Find squads matching your interests"
└── Call-to-Action
    └── "Create a Squad" button
```

### 2. **Dashboard**
```
User Dashboard
├── "My Squads" Section
│   ├── Squads Joined count (stats card)
│   ├── List of user's squads with recent activity
│   └── Quick links to squad chat/events
├── Squad-based Points
│   └── Breakdown of points earned through squad activities
└── Notifications
    └── Squad member joined, new messages, events starting soon
```

### 3. **Browse Squads / Discovery**
```
Squads Listing Page
├── Search & Filter
│   ├── By topic/interest
│   ├── By size (active vs large)
│   └── By privacy (public only)
├── Squad Cards Display
│   ├── Title, Description, Member Count
│   ├── Topics/Tags
│   ├── Join button
│   └── Preview member avatars
└── Squad Detail Page
    ├── Full description & stats
    ├── Chat rooms
    ├── Events calendar
    ├── Member list
    └── Join/Leave button
```

### 4. **User Profiles**
```
User Profile
├── "Squads" Tab
│   ├── List of squads user is in
│   └── Roles in each squad
├── "Achievements" Section
│   └── Squad-related achievements unlocked
└── "Activity Feed"
    └── Recent squad participation
```

### 5. **Chat System**
```
Chat Integration
├── Squad Chat Rooms
│   ├── General announcements
│   ├── Study sessions coordination
│   └── Resource sharing
└── Direct Messages
    └── Between squad members
```

### 6. **Events/Calendar**
```
Events System
├── Squad Events Calendar
│   ├── Study sessions
│   ├── Meetings
│   ├── Hackathons
│   └── Social events
├── RSVP System
│   ├── Yes/No/Maybe responses
│   └── Attendance tracking
└── Notifications
    └── Event reminders for squad members
```

### 7. **Leaderboard**
```
Global & Squad Leaderboards
├── Global Top Users by Points
│   └── Including "Points from Squads" metric
├── Squad-Specific Leaderboard
│   ├── Top contributors by messages
│   ├── Top event attendees
│   └── Most active moderators
└── Weekly/Monthly Rankings
    └── Updated based on squad activity
```

### 8. **Notifications Hub**
```
Notification Types Related to Squads
├── Member joined your squad
├── New message in squad chat
├── Upcoming squad event reminder
├── Moderator promotion notification
├── Squad announcement
└── @mentions in squad chat
```

---

## API Endpoints for Squad Management

### Core Operations
```
GET    /api/groups                 # List all public squads
GET    /api/groups/:id             # Get squad details
POST   /api/groups                 # Create new squad
PUT    /api/groups/:id             # Update squad info (owner only)
DELETE /api/groups/:id             # Delete squad (owner only)

POST   /api/groups/:id/join        # Join a squad
POST   /api/groups/:id/leave       # Leave a squad
GET    /api/groups/:id/members     # List squad members
POST   /api/groups/:id/members     # Add member (owner/mod only)
DELETE /api/groups/:id/members/:uid # Remove member (owner/mod only)
```

### Chat Operations
```
GET    /api/groups/:id/chat-rooms          # List chat rooms
POST   /api/groups/:id/chat-rooms          # Create chat room
GET    /api/groups/:id/chat-rooms/:rid     # Get messages
POST   /api/groups/:id/chat-rooms/:rid/msg # Send message
```

### Events Operations
```
GET    /api/groups/:id/events      # List squad events
POST   /api/groups/:id/events      # Create event
POST   /api/events/:eid/rsvp       # RSVP to event
GET    /api/events/:eid/attendees  # Get attendees
```

---

## Enhancement Opportunities

### 1. **Squad Features to Add**
- ✅ Custom roles beyond owner/member/moderator
- ✅ Squad badges/rankings (e.g., "Most Active Squad", "Best Organized")
- ✅ Automated announcements and reminders
- ✅ Squad statistics dashboard (most active member, popular topics, growth metrics)
- ✅ Member contribution scoring within squad
- ✅ Squad resources library (shared documents, links)
- ✅ Squad wiki/knowledge base

### 2. **Engagement Features**
- ✅ Squad-specific achievements
- ✅ Challenges within squads (e.g., "Chat Challenge: Post 10 messages")
- ✅ Squad growth rewards (bonus points when squad reaches milestones)
- ✅ Member referral bonuses

### 3. **Admin & Moderation**
- ✅ Automated spam detection in squad chat
- ✅ Moderation tools for owners/mods
- ✅ Squad report system for policy violations
- ✅ Analytics dashboard for squad health

### 4. **Integration Features**
- ✅ Squad calendar synchronization
- ✅ Integration with Google Meet/Zoom for events
- ✅ Slack/Discord bot for squad notifications
- ✅ Email digests of squad activity

### 5. **Discovery & Recommendations**
- ✅ "Recommended squads for you" based on interests
- ✅ Squad suggestions when joining first squad
- ✅ Trending squads this week/month
- ✅ "Similar squads" on squad detail page

---

## Database Schema Consideration

### Current In-Memory Store Structure
```typescript
// Core Tables
groups:               Map<groupId, Group>
groupMembers:         Map<memberId, GroupMember>
groupMembersByUser:   Map<userId, Set<groupId>>
groupMembersByGroup:  Map<groupId, Set<memberId>>

// Chat Integration
chatRooms:           Map<roomId, ChatRoom>
chatMessages:        Map<messageId, ChatMessage>
messagesByGroup:     Map<groupId, string[]>

// Events Integration
sessions:            Map<sessionId, Session>
sessionsByGroup:     Map<groupId, Set<sessionId>>

// User Relationships
users:               Map<userId, UserProfile>
userLevels:          Map<userId, UserLevelData>
userPreferences:     Map<userId, UserPreferences>
```

### Future: Database Schema
```sql
-- Core Tables
CREATE TABLE groups (
  id UUID PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id),
  privacy VARCHAR(20) CHECK (privacy IN ('public', 'private')),
  avatar_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE group_members (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES groups(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR(20) CHECK (role IN ('owner', 'moderator', 'member')),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE group_topics (
  group_id UUID REFERENCES groups(id),
  topic VARCHAR NOT NULL,
  PRIMARY KEY (group_id, topic)
);

-- Chat Integration
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES groups(id),
  name VARCHAR NOT NULL,
  topic VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY,
  room_id UUID REFERENCES chat_rooms(id),
  sender_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Events Integration
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES groups(id),
  host_id UUID REFERENCES users(id),
  title VARCHAR NOT NULL,
  description TEXT,
  start_at TIMESTAMP NOT NULL,
  end_at TIMESTAMP NOT NULL,
  location VARCHAR,
  capacity INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE rsvps (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  user_id UUID REFERENCES users(id),
  status VARCHAR(20) CHECK (status IN ('yes', 'no', 'maybe')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);
```

---

## Conclusion

Squads/Groups are the central collaborative unit in Campus Connect. They connect:
- **Users** through shared interests and roles
- **Activity** through messages, events, and engagement
- **Progression** through points and level advancement
- **Community** through discovery, networking, and collaboration

By enhancing squad features and ensuring tight integration across the platform, we create a rich ecosystem where students are motivated to engage, contribute, and grow together.
