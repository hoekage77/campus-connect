# Lumina API Reference# Squad Data Store API Reference



Complete API documentation for the Lumina Intelligent Visual Learning Platform.## Complete Method Documentation



## Base URL### User Level Operations



```#### `getUserLevel(userId: string): UserLevelData | undefined`

Development: http://localhost:3000/apiRetrieves the level data for a specific user.

Production:  https://lumina.dev/api

``````typescript

const level = dataStore.getUserLevel('alice-id');

## Interactive Documentation// Returns:

// {

Visit **http://localhost:3000/api-docs.html** for interactive Swagger UI where you can browse and test all endpoints.//   userId: 'alice-id',

//   currentLevel: 'Expert',

## Authentication//   totalPoints: 370,

//   pointsThisWeek: 50,

Most endpoints require authentication via session cookies.//   joinedDate: Date,

//   lastActivityDate: Date,

---//   totalEventsAttended: 15,

//   totalSquadsCreated: 2,

## 🎬 Lumina Animation Endpoints//   totalMessagesCount: 150,

//   loginStreak: 7,

### POST `/lumina/render`//   achievements: [...]

// }

Generate a Manim animation from natural language.```



**Request:**---

```json

{#### `addActivityPoints(userId: string, points: number, activityType: string): UserLevelData`

  "query": "Explain Newton's second law",Awards points to a user and auto-calculates their new level.

  "preset": "newtonSecondLaw",

  "parameters": {"mass": 2, "force": 10},**Parameters:**

  "quality": "low"- `userId`: User's ID

}- `points`: Number of points to award

```- `activityType`: Type of activity ('squad-created', 'event-attended', 'message', etc.)



**Available Templates:****Activity Types & Points:**

| Type | Points | Notes |

| Key | Parameters | Description ||------|--------|-------|

|-----|------------|-------------|| `squad-created` | 50 | Track totalSquadsCreated |

| `projectileMotion` | `velocity`, `angle` | Parabolic trajectory || `event-attended` | 10 | Track totalEventsAttended |

| `newtonSecondLaw` | `mass`, `force` | F=ma demo || `message` | 1 | Track totalMessagesCount |

| `electricField` | `charge` | Field lines || (custom) | any | Custom activities |

| `quadraticFunction` | `a`, `b`, `c` | Graph with vertex |

| `derivativeVisualization` | - | Tangent line |**Returns:** Updated `UserLevelData` with:

- New `currentLevel` (auto-calculated)

**Response:** SSE Stream- Updated `totalPoints`

- Updated activity counters

```javascript- Updated `lastActivityDate`

// Progress

{type:"progress", stage:"rendering", progress:50, message:"Rendering..."}**Example:**

```typescript

// Complete// User sends a message

{type:"complete", videoUrl:"/animations/abc.mp4", duration:8}const newLevel = dataStore.addActivityPoints(userId, 1, 'message');



// Error// User attends an event

{type:"error", message:"Failed", code:"MANIM_NOT_AVAILABLE"}const newLevel = dataStore.addActivityPoints(userId, 10, 'event-attended');

```

// Auto-level up if they reach threshold

**Example:**if (newLevel.totalPoints >= 700) {

```javascript  console.log(`${userId} leveled up to ${newLevel.currentLevel}!`);

const response = await fetch('/api/lumina/render', {}

  method: 'POST',```

  headers: {'Content-Type': 'application/json'},

  body: JSON.stringify({query: 'Show projectile motion'})**Level Thresholds:**

})- Novice: 0-99 points

- Learner: 100-299 points

const reader = response.body.getReader()- Collaborator: 300-699 points

// ... process SSE stream- Expert: 700-1499 points

```- Master: 1500+ points



------



### POST `/lumina/render-daytona`### User Preferences Operations



Same as `/lumina/render` but optimized for Daytona.io (faster, pre-configured).#### `getUserPreferences(userId: string): UserPreferences | undefined`

Retrieves user's interest preferences and notification settings.

---

```typescript

## 👤 User Endpointsconst prefs = dataStore.getUserPreferences('bob-id');

// Returns:

### GET `/users/{id}`// {

//   userId: 'bob-id',

Get user profile.//   interests: ['Study Groups', 'Sports & Fitness'],

//   preferredEventTypes: ['Study Session', 'Hangout'],

**Response:**//   preferredSquadTopics: ['Physics', 'Engineering'],

```json//   notificationFrequency: 'weekly',

{//   discoveryEnabled: true,

  "id": "usr_abc",//   lastUpdated: Date

  "username": "johndoe",// }

  "displayName": "John Doe",```

  "level": 5,

  "points": 1250**Available Interests:**

}```

```- Study Groups

- Social Events

---- Sports & Fitness

- Creative

## 👥 Group Endpoints- Career & Professional

- Cultural

### GET `/groups`- Academic Clubs

- Food & Dining

List all groups. Query params: `type`, `privacy`.```



### GET `/groups/{id}`**Notification Frequencies:**

- `'instant'` - Real-time notifications

Get group details.- `'daily'` - Daily digest

- `'weekly'` - Weekly digest

---- `'none'` - No notifications



## 📅 Session Endpoints---



### GET `/groups/{id}/sessions`#### `createOrUpdatePreferences(data: Omit<UserPreferences, 'lastUpdated'>): UserPreferences`

Creates new user preferences or updates existing ones.

Get group sessions.

**Parameters:**

### POST `/groups/{id}/sessions````typescript

interface UserPreferences {

Create new session.  userId: string;

  interests: string[]; // 3-5 recommended

**Body:**  preferredEventTypes: string[];

```json  preferredSquadTopics: string[];

{  notificationFrequency: 'instant' | 'daily' | 'weekly' | 'none';

  "title": "Calculus Study",  discoveryEnabled: boolean;

  "startTime": "2025-11-20T15:00:00Z",  lastUpdated: Date; // Auto-set by method

  "location": "Library"}

}```

```

**Example:**

---```typescript

const prefs = dataStore.createOrUpdatePreferences({

## 💬 Message & Notification Endpoints  userId: 'charlie-id',

  interests: ['Study Groups', 'Career & Professional', 'Creative'],

### GET `/messages`  preferredEventTypes: ['Workshop', 'Networking'],

  preferredSquadTopics: ['JavaScript', 'React', 'Web Dev'],

Get user messages (sorted by recent).  notificationFrequency: 'daily',

  discoveryEnabled: true,

### GET `/notifications`});



Get notifications. Query: `unread=true`.// Update later

dataStore.createOrUpdatePreferences({

---  ...prefs,

  interests: ['Sports & Fitness', 'Social Events'], // Changed

## OpenAPI Specification  notificationFrequency: 'weekly', // Changed

});

Full OpenAPI 3.0 spec available at `/docs/openapi.yaml````



View interactive docs at: **http://localhost:3000/api-docs.html**---



---### Chat Room Operations



For detailed data store operations, see `docs/API_REFERENCE_OLD.md`#### `getChatRoom(roomId: string): ChatRoom | undefined`

Retrieves a specific chat room by ID.

```typescript
const room = dataStore.getChatRoom('room-123');
// Returns:
// {
//   id: 'room-123',
//   groupId: 'group-456',
//   name: 'general',
//   description: 'General discussions',
//   createdBy: 'alice-id',
//   createdDate: Date,
//   visibility: 'public',
//   members: ['alice-id', 'bob-id', 'charlie-id'],
//   messageCount: 42,
//   lastMessageDate: Date
// }
```

---

#### `getChatRoomsByGroup(groupId: string): ChatRoom[]`
Retrieves all chat rooms for a squad/group.

```typescript
const rooms = dataStore.getChatRoomsByGroup('cs456-group');
// Returns: [
//   { id: 'room-1', name: 'general', ... },
//   { id: 'room-2', name: 'resources', ... },
//   { id: 'room-3', name: 'exam-prep', ... }
// ]
```

---

#### `createChatRoom(data: Omit<ChatRoom, 'id'>): ChatRoom`
Creates a new chat room for a squad.

**Parameters:**
```typescript
interface ChatRoom {
  groupId: string; // Parent squad ID
  name: string; // 'general', 'resources', etc.
  description: string;
  createdBy: string; // User ID who created room
  createdDate: Date;
  visibility: 'public' | 'members-only';
  members: string[]; // Array of user IDs
  messageCount: number;
  lastMessageDate?: Date;
}
```

**Example:**
```typescript
const newRoom = dataStore.createChatRoom({
  groupId: 'cs456-group',
  name: 'exam-prep',
  description: 'Help with exam preparation',
  createdBy: 'alice-id',
  createdDate: new Date(),
  visibility: 'public',
  members: ['alice-id', 'bob-id'],
  messageCount: 0,
});
```

---

#### `addChatRoomMember(roomId: string, userId: string): ChatRoom | undefined`
Adds a member to a chat room.

```typescript
const updated = dataStore.addChatRoomMember('room-123', 'david-id');
// Updated room with david-id in members array
```

---

### Chat Message Operations

#### `getChatMessages(roomId: string): ChatMessage[]`
Retrieves all messages in a chat room.

```typescript
const messages = dataStore.getChatMessages('room-123');
// Returns: [
//   {
//     id: 'msg-1',
//     chatRoomId: 'room-123',
//     senderId: 'alice-id',
//     senderName: 'Alice Johnson',
//     senderLevel: 'Expert',
//     content: 'Welcome to the study group!',
//     timestamp: Date,
//     reactions: { '👍': ['bob-id', 'charlie-id'] },
//     edited: false
//   },
//   ...
// ]
```

---

#### `createChatMessage(data: Omit<ChatMessage, 'id'>): ChatMessage`
Posts a new message to a chat room. **Automatically awards 1 activity point.**

**Parameters:**
```typescript
interface ChatMessage {
  chatRoomId: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderLevel: UserLevel; // 'Novice' | 'Learner' | 'Collaborator' | 'Expert' | 'Master'
  content: string;
  timestamp: Date;
  reactions: Record<string, string[]>; // emoji -> [userId1, userId2]
  edited: boolean;
  editedDate?: Date;
}
```

**Example:**
```typescript
const userLevel = dataStore.getUserLevel('alice-id');
const msg = dataStore.createChatMessage({
  chatRoomId: 'room-123',
  groupId: 'group-456',
  senderId: 'alice-id',
  senderName: 'Alice Johnson',
  senderLevel: userLevel?.currentLevel || 'Novice',
  content: 'Great question! Here's the answer...',
  timestamp: new Date(),
  reactions: {},
  edited: false,
});

// Alice automatically gets +1 point
const updatedLevel = dataStore.getUserLevel('alice-id');
// totalPoints increased by 1
```

**Side Effects:**
- Sends message to chat room
- Awards +1 point to sender
- Recalculates sender's level if threshold reached
- Updates room's messageCount
- Updates room's lastMessageDate

---

### Notification Operations

#### `getUserNotifications(userId: string): Notification[]`
Retrieves all notifications for a user.

```typescript
const notifs = dataStore.getUserNotifications('alice-id');
// Returns: [
//   {
//     id: 'notif-1',
//     userId: 'alice-id',
//     type: 'level-up',
//     title: 'Level Up!',
//     message: 'Congrats! You reached Expert level!',
//     relatedId: 'alice-id',
//     read: false,
//     createdDate: Date,
//     actionUrl: '/profile'
//   },
//   ...
// ]
```

---

#### `createNotification(data: Omit<Notification, 'id'>): Notification`
Creates a new notification for a user.

**Notification Types:**
| Type | Use Case | Example |
|------|----------|---------|
| `interest-match` | User's interests match new event | "New study group for CS posted!" |
| `friend-activity` | Friend joined squad/attended event | "[Friend] joined [Squad]" |
| `event-reminder` | Event starting soon | "Your event starts in 1 hour!" |
| `squad-update` | New messages in squad | "3 new messages in #resources" |
| `level-up` | User reached new level | "Congrats! You reached Expert!" |
| `achievement` | User earned badge | "You attended your 10th event!" |

**Parameters:**
```typescript
interface Notification {
  userId: string;
  type: 'interest-match' | 'friend-activity' | 'event-reminder' | 'squad-update' | 'level-up' | 'achievement';
  title: string;
  message: string;
  relatedId: string; // groupId, sessionId, or userId
  read: boolean;
  createdDate: Date;
  actionUrl: string;
}
```

**Example:**
```typescript
// Notify user of level up
dataStore.createNotification({
  userId: 'alice-id',
  type: 'level-up',
  title: 'Level Up! 🎉',
  message: 'Congrats! You reached Expert level!',
  relatedId: 'alice-id',
  read: false,
  createdDate: new Date(),
  actionUrl: '/profile/alice-id',
});

// Notify user of interest match
dataStore.createNotification({
  userId: 'bob-id',
  type: 'interest-match',
  title: 'New Study Group! 📚',
  message: 'New study group for Physics posted!',
  relatedId: 'physics-group-789',
  read: false,
  createdDate: new Date(),
  actionUrl: '/groups/physics-group-789',
});

// Notify user of friend activity
dataStore.createNotification({
  userId: 'charlie-id',
  type: 'friend-activity',
  title: 'Friend Joined Squad',
  message: 'Alice just joined the CS 456 Study Group!',
  relatedId: 'alice-id',
  read: false,
  createdDate: new Date(),
  actionUrl: '/groups/cs456-group',
});
```

---

#### `markNotificationAsRead(userId: string, notificationId: string): void`
Marks a notification as read.

```typescript
dataStore.markNotificationAsRead('alice-id', 'notif-1');
// Notification now shows read: true
```

---

## Common Usage Patterns

### User Completes Event RSVP
```typescript
// 1. User RSVPs to event
dataStore.createOrUpdateRSVP({
  sessionId: event.id,
  userId: currentUser.id,
  status: 'yes',
});

// 2. Award points for event attendance
const newLevel = dataStore.addActivityPoints(
  currentUser.id,
  10, // Points for event attendance
  'event-attended'
);

// 3. Create notification if level up
if (newLevel.totalPoints >= nextThreshold) {
  dataStore.createNotification({
    userId: currentUser.id,
    type: 'level-up',
    title: `Level Up to ${newLevel.currentLevel}!`,
    message: `Great job! You reached ${newLevel.currentLevel} level!`,
    relatedId: currentUser.id,
    read: false,
    createdDate: new Date(),
    actionUrl: `/profile/${currentUser.id}`,
  });
}
```

### User Sends Chat Message
```typescript
const senderLevel = dataStore.getUserLevel(userId);

const message = dataStore.createChatMessage({
  chatRoomId,
  groupId,
  senderId: userId,
  senderName: user.name,
  senderLevel: senderLevel?.currentLevel || 'Novice',
  content: userInput,
  timestamp: new Date(),
  reactions: {},
  edited: false,
});

// Message auto-awards +1 point
// UI can immediately show updated level
const updatedLevel = dataStore.getUserLevel(userId);
```

### Set Up User After Signup
```typescript
// 1. Create user
const user = dataStore.createUser({
  name: formData.name,
  email: formData.email,
  topics: [],
  year: formData.year,
  major: formData.major,
});

// 2. Initialize level (0 points)
dataStore.addActivityPoints(user.id, 0, 'signup');

// 3. Set preferences (from onboarding)
dataStore.createOrUpdatePreferences({
  userId: user.id,
  interests: selectedInterests, // From onboarding form
  preferredEventTypes: ['Study Session', 'Networking'],
  preferredSquadTopics: [],
  notificationFrequency: 'daily',
  discoveryEnabled: true,
});

// 4. User is ready to go!
```

### Populate Squad Detail Page
```typescript
const groupId = 'cs456-group';

// Get squad info
const squad = dataStore.getGroup(groupId);
const members = dataStore.getGroupMembers(groupId);

// Get chat rooms
const chatRooms = dataStore.getChatRoomsByGroup(groupId);

// Get member levels (for display)
const memberLevels = members.map(member => ({
  ...member,
  level: dataStore.getUserLevel(member.userId),
}));

// Get messages for first room
const messages = dataStore.getChatMessages(chatRooms[0].id);

// All data ready for rendering UI
return {
  squad,
  members: memberLevels,
  chatRooms,
  messages,
};
```

---

## Type Definitions Quick Reference

### UserLevel
```typescript
type UserLevel = 'Novice' | 'Learner' | 'Collaborator' | 'Expert' | 'Master';
```

### UserLevelData
```typescript
interface UserLevelData {
  userId: string;
  currentLevel: UserLevel;
  totalPoints: number;
  pointsThisWeek: number;
  joinedDate: Date;
  lastActivityDate: Date;
  totalEventsAttended: number;
  totalSquadsCreated: number;
  totalMessagesCount: number;
  loginStreak: number;
  achievements: Achievement[];
}
```

### UserPreferences
```typescript
interface UserPreferences {
  userId: string;
  interests: string[];
  preferredEventTypes: string[];
  preferredSquadTopics: string[];
  notificationFrequency: 'instant' | 'daily' | 'weekly' | 'none';
  discoveryEnabled: boolean;
  lastUpdated: Date;
}
```

### ChatRoom
```typescript
interface ChatRoom {
  id: string;
  groupId: string;
  name: string;
  description: string;
  createdBy: string;
  createdDate: Date;
  visibility: 'public' | 'members-only';
  members: string[];
  messageCount: number;
  lastMessageDate?: Date;
}
```

### ChatMessage
```typescript
interface ChatMessage {
  id: string;
  chatRoomId: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderLevel: UserLevel;
  content: string;
  timestamp: Date;
  reactions: Record<string, string[]>;
  edited: boolean;
  editedDate?: Date;
}
```

### Notification
```typescript
interface Notification {
  id: string;
  userId: string;
  type: 'interest-match' | 'friend-activity' | 'event-reminder' | 'squad-update' | 'level-up' | 'achievement';
  title: string;
  message: string;
  relatedId: string;
  read: boolean;
  createdDate: Date;
  actionUrl: string;
}
```

---

## Error Handling

### Safe Returns
Most methods return `undefined` if entity not found:

```typescript
const level = dataStore.getUserLevel('nonexistent-id');
if (!level) {
  console.log('User has no level data yet');
  // Create initial level with 0 points
}
```

### Activity Type Flexibility
The `activityType` parameter accepts any string, allowing custom activities:

```typescript
// Standard
dataStore.addActivityPoints(userId, 50, 'squad-created');

// Custom
dataStore.addActivityPoints(userId, 100, 'first-squad-of-week');
dataStore.addActivityPoints(userId, 5, 'profile-photo-uploaded');
```

---

## Performance Notes

- All methods use Map lookups (O(1) average)
- `getChatMessages` returns array (O(n) on first load, then cached)
- `getChatRoomsByGroup` uses index for fast lookups
- Level recalculation happens inline during `addActivityPoints`
- Notifications stored as arrays per user (O(1) lookup, O(n) scan for unread)

---

## Migration to Supabase (Phase 3)

When migrating to Supabase:

```sql
-- Each method maps to SQL operations
getUserLevel()                    → SELECT * FROM user_levels WHERE user_id = ?
addActivityPoints()               → UPDATE user_levels SET ...
getUserPreferences()              → SELECT * FROM user_preferences WHERE user_id = ?
createOrUpdatePreferences()       → INSERT ... ON CONFLICT UPDATE
getChatRoomsByGroup()            → SELECT * FROM chat_rooms WHERE group_id = ?
createChatMessage()              → INSERT INTO chat_messages ... THEN UPDATE user_levels
getUserNotifications()           → SELECT * FROM notifications WHERE user_id = ?
```

---

**API Reference Complete** ✅
Ready for Phase 1B UI implementation.
