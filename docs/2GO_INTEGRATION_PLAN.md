# 2go Integration Plan for Squad

## Overview
Squad will integrate the most successful engagement mechanics from 2go—the legendary South African social platform that achieved 21M registered users. We'll implement a gamified, preference-based social experience that drives user engagement through activity tracking, community interaction, and smart content discovery.

---

## 1. User Leveling System (2go Stars → Squad Levels)

### What Made 2go Stars Addictive?
- Users obsessed with reaching "ultimate level"
- Simple but visible progress system
- Status symbol in chats and profiles
- Drove continuous engagement

### Squad Implementation: Level Progression

**Levels (Novice → Master):**
```
Novice (0-100 points)      → 🟤 Bronze
Learner (100-300 points)   → 🟦 Silver
Collaborator (300-700)     → 🟨 Gold
Expert (700-1500)         → 💜 Purple
Master (1500+ points)     → ⭐ Master
```

**Activity Points System:**
| Action | Points | Category |
|--------|--------|----------|
| Join a squad | 5 | Engagement |
| Attend an event (RSVP) | 10 | Participation |
| Host an event | 25 | Leadership |
| Send a message | 1 | Interaction |
| Create a squad | 50 | Leadership |
| Post to squad chat room | 3 | Community |
| Reach day 7 streak (daily login) | 20 | Loyalty |

**Data Model Addition:**
```typescript
interface UserLevel {
  userId: string;
  currentLevel: 'Novice' | 'Learner' | 'Collaborator' | 'Expert' | 'Master';
  totalPoints: number;
  pointsThisWeek: number;
  joinedDate: string;
  lastActivityDate: string;
  totalEventsAttended: number;
  totalSquadsCreated: number;
  totalMessagesCount: number;
  loginStreak: number;
  achievements: Achievement[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  earnedDate: string;
  icon: string;
}
```

### Display Locations:
- **Profile Card**: Show level badge + current points
- **Chat Messages**: Display level next to username
- **Squad Member List**: Sort by level, show badges
- **Leaderboard** (future): Global/weekly rankings
- **Event Attendee Cards**: Show level of attendees

---

## 2. User Preferences & Interests System

### What Made 2go Forums Work?
- Organized by user interests (universities, music, sports)
- People found communities around their passions
- Discovery was driven by interests, not just algorithms

### Squad Implementation: Preference-Based Discovery

**Interest Categories:**
- 📚 Study Groups (CS, Math, Biology, etc.)
- 🎉 Social Events (parties, hangouts, meetups)
- 💪 Sports & Fitness (gym, basketball, running)
- 🎨 Creative (art, music, theater, photography)
- 🏢 Career & Professional (internship prep, networking)
- 🌍 Cultural (international students, cultural events)
- 🎓 Academic Clubs (debate, robotics, business)
- 🍽️ Food & Dining (restaurant tours, cooking)

**Data Model Addition:**
```typescript
interface UserPreferences {
  userId: string;
  interests: string[]; // e.g., ['Study Groups', 'Sports & Fitness', 'Social Events']
  preferredEventTypes: string[];
  preferredSquadTopics: string[];
  notificationFrequency: 'instant' | 'daily' | 'weekly' | 'none';
  discoveryEnabled: boolean; // Allow Squad to suggest events based on interests
  lastUpdated: string;
}
```

**Implementation Points:**
1. **Onboarding Flow**: After signup, ask users to select 3-5 interests
2. **Profile Settings**: Allow users to update preferences anytime
3. **Discovery Page** (future): Show events/squads matching interests
4. **Smart Notifications** (future): Notify users of events matching preferences
5. **Squad Filtering**: Browse squads by interest tags

---

## 3. Chat Rooms System (2go Forums → Squad Chat Rooms)

### What Made 2go Chat Rooms Engaging?
- Hundreds of organized chat rooms by topic
- People discovered new communities through rooms
- Different vibe than 1-on-1 messaging
- Interest-based grouping created natural communities

### Squad Implementation: Squad-Based Chat Rooms

**Structure:**
- Each squad has multiple topic-specific chat rooms
- Default rooms: #general, #resources, #hangout, #announcements
- Custom rooms: Squad creators can add topic-specific rooms (#exam-prep, #project-help, etc.)

**Data Model Addition:**
```typescript
interface ChatRoom {
  id: string;
  squadsId: string; // Reference to parent squad
  name: string; // e.g., "general", "resources"
  description: string;
  createdBy: string;
  createdDate: string;
  visibility: 'public' | 'members-only';
  members: string[]; // Array of user IDs
  messageCount: number;
  lastMessageDate: string;
}

interface Message {
  id: string;
  chatRoomId: string;
  squadsId: string;
  senderId: string;
  senderName: string;
  senderLevel: string;
  content: string;
  timestamp: string;
  reactions: Map<string, string[]>; // emoji -> [userId1, userId2]
  edited: boolean;
  editedDate?: string;
}
```

**Implementation Points:**
1. **Squad Detail Page**: Show chat rooms tabs at top (#general, #resources, etc.)
2. **Message Display**: Show sender's level badge with each message
3. **Room Management**: Squad leaders can create/manage rooms
4. **Message History**: Persistent chat history (scrollable)
5. **Real-time Updates** (Phase 2): Live message updates without refresh

---

## 4. Smart Notification System (Preference-Based Broadcasting)

### What Made 2go Notifications Work?
- Kept users engaged with "offline with notifications" status
- Sent relevant content based on user interests
- Created FOMO (fear of missing out)

### Squad Implementation: Interest-Triggered Notifications

**Notification Types:**
1. **Interest Match**: "New study group for [Interest] posted!"
2. **Friend Activity**: "[Friend] joined [Squad]"
3. **Event Reminder**: "Your event starts in 1 hour!"
4. **Squad Updates**: "New message in [Squad]'s #general room"
5. **Leaderboard**: Weekly "You're #12 on this week's leaderboard!"
6. **Level Up**: "Congrats! You reached [Level]!"

**Data Model Addition:**
```typescript
interface Notification {
  id: string;
  userId: string;
  type: 'interest-match' | 'friend-activity' | 'event-reminder' | 'squad-update' | 'level-up' | 'achievement';
  title: string;
  message: string;
  relatedId: string; // squadsId, eventId, or userId
  read: boolean;
  createdDate: string;
  actionUrl: string;
}

interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  eventReminders: boolean; // 1 hour before
  friendActivity: boolean;
  newInterestMatches: boolean;
  frequency: 'instant' | 'daily-digest' | 'weekly-digest';
}
```

---

## 5. Implementation Phases

### Phase 1A: Foundation (This Sprint)
- ✅ Add user leveling system with activity tracking
- ✅ Implement user preferences/interests system
- ✅ Add chat rooms to squad detail pages
- ✅ Update data models in global store

### Phase 1B: UI Integration
- Update user profiles to show level + badge
- Show level badges in chat messages
- Create preferences onboarding flow
- Display chat rooms in squad detail

### Phase 2: Smart Features
- Build notification system
- Implement preference-based discovery
- Add leaderboards
- Real-time chat updates

### Phase 3: Gamification
- Achievement system with badges
- Weekly/monthly challenges
- Unlock special perks at higher levels

---

## 6. Data Store Updates Required

**New Collections to Add:**
```typescript
interface GlobalDataStore {
  // Existing
  groups: Map<string, Group>;
  sessions: Map<string, Session>;
  users: Map<string, User>;
  messages: Map<string, Message>;
  
  // NEW
  userLevels: Map<string, UserLevel>;
  userPreferences: Map<string, UserPreferences>;
  chatRooms: Map<string, ChatRoom>;
  roomMessages: Map<string, Message[]>;
  notifications: Map<string, Notification[]>;
  achievements: Map<string, Achievement>;
}
```

**Updated User Model:**
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  level?: string; // Reference to UserLevel
  preferences?: string; // Reference to UserPreferences
  joinedDate: string;
  lastSeen: string;
}
```

---

## 7. Integration Points with Existing Features

### Homepage
- Show "Your Level: Silver ⭐" in welcome section
- Display weekly leaderboard preview

### Groups Page
- Filter by interests/topics
- Show squad creator's level
- Display member level distribution

### Sessions Page
- Filter by event types matching interests
- Show host's level badge

### User Profile (New Page)
- Display current level + points to next level
- Show badges/achievements
- List interests/preferences
- Show activity stats (squads joined, events attended, messages sent)

### Squad Detail Page
- Show member levels in list
- Display chat room tabs
- Show squad creator level

---

## 8. Key Metrics to Track

- User level distribution (how many at each level)
- Average points per user per week
- Chat room message volume
- User preference coverage (how many use interests)
- Notification engagement rate
- Return rate (users returning 7+ days after signup)

---

## 9. Success Criteria

✅ Users are motivated to increase their level (daily engagement)
✅ Preferences help users discover relevant events
✅ Chat rooms create sub-communities within squads
✅ Notifications drive 20%+ increase in return visits
✅ Platform feels gamified and social (like 2go did)

---

## 10. Database Migration Path (Future)

Current: In-memory `globalThis.__dataStore`
Future: Migrate to Supabase with:
- `users` table
- `user_levels` table
- `user_preferences` table
- `groups` table
- `chat_rooms` table
- `messages` table (encrypted E2E)
- `notifications` table

---

## Next Steps

1. Update `/src/lib/data/store.ts` with new data models
2. Update User interface to support levels/preferences
3. Create chat rooms component for squad detail page
4. Build user preferences onboarding flow
5. Add level display to profile cards and messages
