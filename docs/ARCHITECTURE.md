# Squad 2go Integration Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        SQUAD PLATFORM                           │
│                  (2go-Inspired Social Features)                 │
└─────────────────────────────────────────────────────────────────┘

┌─── USER ENGAGEMENT LAYER ─────────────────────────────────────┐
│                                                                 │
│  ┌──────────────────┐      ┌──────────────────┐               │
│  │   Leveling       │      │   Preferences    │               │
│  │   System         │      │   & Interests    │               │
│  │                  │      │                  │               │
│  │ • Novice (0)     │      │ • Study Groups   │               │
│  │ • Learner (100)  │      │ • Social Events  │               │
│  │ • Collaborator   │      │ • Sports         │               │
│  │ • Expert (700)   │      │ • Creative       │               │
│  │ • Master (1500)  │      │ • Career         │               │
│  └──────────────────┘      │ • Cultural       │               │
│           ▲                │ • Academic       │               │
│           │                │ • Food & Dining  │               │
│  Triggered by activities   └──────────────────┘               │
│  (messages, events, etc)            ▼                          │
│                            Drives content discovery            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─── COMMUNICATION LAYER ──────────────────────────────────────┐
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              SQUAD CHAT ROOMS (per Group)               │ │
│  │                                                          │ │
│  │  Default Rooms:                                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │ │
│  │  │  #general   │  │ #resources  │  │  Custom[?] │    │ │
│  │  │             │  │             │  │             │    │ │
│  │  │ General     │  │ Share study │  │ Topic-      │    │ │
│  │  │ discussions │  │ materials   │  │ specific    │    │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │ │
│  │                                                          │ │
│  │  Each message shows:                                    │ │
│  │  → Sender name                                          │ │
│  │  → Sender level badge (🟤 Bronze → ⭐ Master)          │ │
│  │  → Content                                              │ │
│  │  → Reactions (emoji)                                    │ │
│  │  → Timestamp                                            │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Activity Auto-Tracking:                                       │
│  Message sent → +1 point → Level recalculation                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─── ENGAGEMENT LOOP ──────────────────────────────────────────┐
│                                                                 │
│  User Joins Squad                                              │
│         ↓                                                       │
│  Sees #general room with member level badges                   │
│         ↓                                                       │
│  Sends message (+1 point) → Sees own level badge              │
│         ↓                                                       │
│  Attends event (+10 points) → Level up notification           │
│         ↓                                                       │
│  FOMO kicks in, users return daily to maintain streaks        │
│  and reach next level 🎮                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─── NOTIFICATION SYSTEM ──────────────────────────────────────┐
│                                                                 │
│  Notification Types:                                           │
│                                                                 │
│  📌 Interest Match                                             │
│     "New study group for CS posted!"                           │
│     (Based on user preferences)                                │
│                                                                 │
│  👥 Friend Activity                                            │
│     "[Friend] joined [Squad]"                                  │
│                                                                 │
│  ⏰ Event Reminder                                             │
│     "Your event starts in 1 hour!"                             │
│                                                                 │
│  💬 Squad Update                                               │
│     "3 new messages in #resources"                             │
│                                                                 │
│  ⬆️  Level Up                                                   │
│     "Congrats! You reached Expert level!"                      │
│                                                                 │
│  🏆 Achievement                                                │
│     "You attended your 10th event!"                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─── ACTIVITY POINTS TABLE ─────────────────────────────────────┐
│                                                                 │
│  Action                    Points   Category                   │
│  ────────────────────────────────────────────────────         │
│  Join a squad               5       Engagement                │
│  Attend an event (RSVP)    10       Participation             │
│  Host an event             25       Leadership                │
│  Send a message             1       Interaction               │
│  Create a squad            50       Leadership                │
│  Post to chat room          1       Interaction               │
│  Daily login streak (7day) 20       Loyalty                   │
│                                                                 │
│  Level Thresholds:                                             │
│  ────────────────────────────────────────────────────────     │
│  🟤 Novice       0-99 points     (Newcomer)                    │
│  🟦 Learner     100-299 points   (Active participant)         │
│  🟨 Collaborator 300-699 points  (Community builder)          │
│  💜 Expert     700-1499 points   (Expert contributor)        │
│  ⭐ Master     1500+ points      (Community legend)           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER ACTION                                │
└─────────────────────────────────────────────────────────────────┘
              ↓
        ┌──────────────────────────────────┐
        │  Message sent in chat room       │
        │  Event RSVP created              │
        │  Squad joined                    │
        │  Squad created                   │
        └──────────────────────────────────┘
              ↓
        ┌──────────────────────────────────┐
        │  DATA STORE: addActivityPoints() │
        │  (Accumulate points)             │
        └──────────────────────────────────┘
              ↓
        ┌──────────────────────────────────┐
        │  calculateLevel()                │
        │  (Determine new level)           │
        └──────────────────────────────────┘
              ↓
        ┌──────────────────────────────────┐
        │  UserLevelData updated           │
        │  • currentLevel                  │
        │  • totalPoints                   │
        │  • activityCount                 │
        └──────────────────────────────────┘
              ↓
        ┌──────────────────────────────────┐
        │  UI Updates:                     │
        │  • Show level badge next to name │
        │  • Progress bar to next level    │
        │  • "Level Up!" notification      │
        └──────────────────────────────────┘

```

---

## Component Interaction Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION PAGES                            │
└─────────────────────────────────────────────────────────────────┘

┌─ Homepage ─┐
│            │
│ • Show     │
│   user's   │──→ userLevels.get(userId)
│   current  │
│   level    │
│            │
└────────────┘

┌─ Squad Detail Page ─┐
│                     │
│ • Chat room tabs    │──→ chatRoomsByGroup.get(groupId)
│   (#general,        │
│   #resources)       │
│                     │
│ • Member list with  │──→ userLevels for each member
│   level badges      │
│                     │
│ • Chat messages     │──→ chatMessages by roomId
│   with levels       │    (senderLevel included)
│                     │
└─────────────────────┘

┌─ User Profile Page ─┐
│ (NEW)               │
│                     │
│ • Level badge       │──→ userLevels.get(userId)
│ • Progress bar      │
│ • Achievements      │──→ userLevels.achievements[]
│ • Stats             │──→ activity counters
│ • Interests         │──→ userPreferences.interests
│ • Edit preferences  │
│                     │
└─────────────────────┘

┌─ Leaderboard ─┐
│ (PHASE 2)     │
│               │
│ • Top users   │──→ all userLevels sorted by points
│   this week   │
│ • Ranking     │
│   display     │
│               │
└───────────────┘

┌─ Notifications ─┐
│ (Dropdown)      │
│                 │
│ • Unread count  │──→ notifications where !read
│ • Notification  │──→ userNotifications array
│   list          │
│ • Mark as read  │
│                 │
└─────────────────┘

```

---

## Database Schema (Future Migration to Supabase)

```sql
-- Users table (extended)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  year TEXT,
  major TEXT,
  topics TEXT[],
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- User Levels (NEW)
CREATE TABLE user_levels (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id),
  current_level TEXT, -- 'Novice' | 'Learner' | 'Collaborator' | 'Expert' | 'Master'
  total_points INTEGER,
  points_this_week INTEGER,
  login_streak INTEGER,
  events_attended INTEGER,
  squads_created INTEGER,
  messages_count INTEGER,
  joined_date TIMESTAMP,
  last_activity_date TIMESTAMP,
  created_at TIMESTAMP
);

-- User Preferences (NEW)
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id),
  interests TEXT[],
  preferred_event_types TEXT[],
  preferred_squad_topics TEXT[],
  notification_frequency TEXT,
  discovery_enabled BOOLEAN,
  last_updated TIMESTAMP
);

-- Chat Rooms (NEW)
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES groups(id),
  name TEXT, -- 'general', 'resources', etc.
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_date TIMESTAMP,
  visibility TEXT, -- 'public' | 'members-only'
  members UUID[],
  message_count INTEGER,
  last_message_date TIMESTAMP
);

-- Chat Messages (NEW)
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY,
  chat_room_id UUID REFERENCES chat_rooms(id),
  group_id UUID REFERENCES groups(id),
  sender_id UUID REFERENCES users(id),
  sender_name TEXT,
  sender_level TEXT,
  content TEXT,
  timestamp TIMESTAMP,
  reactions JSONB, -- { "👍": ["user1", "user2"] }
  edited BOOLEAN,
  edited_date TIMESTAMP
);

-- Notifications (NEW)
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type TEXT, -- 'interest-match', 'friend-activity', etc.
  title TEXT,
  message TEXT,
  related_id UUID,
  read BOOLEAN,
  created_date TIMESTAMP,
  action_url TEXT
);

-- Achievements (NEW)
CREATE TABLE achievements (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE,
  description TEXT,
  icon TEXT,
  criteria JSONB -- { "type": "messages", "threshold": 100 }
);

-- User Achievements (NEW - join table)
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  achievement_id UUID REFERENCES achievements(id),
  earned_date TIMESTAMP,
  UNIQUE(user_id, achievement_id)
);

```

---

## Phase Roadmap

```
PHASE 1A (✅ COMPLETE)
├── Data models & types
├── Data store methods
├── Demo data initialization
└── Activity tracking

PHASE 1B (NEXT)
├── User level badge component
├── Chat rooms UI
├── Profile page component
├── Notification dropdown
└── Preferences onboarding

PHASE 2 (FUTURE)
├── Real-time chat updates (WebSocket)
├── Preference-based discovery
├── Leaderboards
├── Achievement system UI
├── Email notifications
└── Notification triggers

PHASE 3 (FUTURE)
├── Database migration (Supabase)
├── E2E encrypted messaging
├── User verification
├── Analytics dashboard
└── Admin moderation tools
```

---

## What Makes Squad Addictive (Like 2go)

1. **Visual Level Badges** 🎖️
   - See your progress immediately
   - Status symbol in every message

2. **Easy Activities** ✅
   - Just send a message = +1 point
   - Join an event = +10 points
   - No friction, natural gameplay loop

3. **Interest-Based Communities** 👥
   - Chat rooms for each interest
   - Find "your people" organically
   - Discovery through preferences

4. **Social Proof** 📈
   - See member levels in rooms
   - Creates friendly competition
   - Encourages daily participation

5. **FOMO Mechanics** ⏰
   - Level-up notifications
   - Friends joining squads
   - Events in your interests
   - Login streaks

6. **Gamification Loop** 🎮
   - Action → Points → Level Up → Notification → Motivation to continue
   - Clear progression path (Novice → Master)
   - Visible improvements

---

**Architecture Complete** ✅
Ready for Phase 1B: UI Implementation
