# API Routes Documentation

## Implemented Endpoints

### 1. Chat Rooms
**Endpoint:** `/api/chat/rooms`

**GET** - Get all rooms for a group
- Query: `?groupId=group_123`
- Returns: Array of chat rooms

**POST** - Create a new chat room
- Body: `{ groupId, name, type }`
- Returns: Created room object

---

### 2. Chat Messages
**Endpoint:** `/api/chat/[roomId]/messages`

**GET** - Get messages from a room
- Query: `?limit=50&offset=0`
- Returns: Array of messages

**POST** - Send a message to a room
- Body: `{ senderId, content }`
- Returns: Created message object

---

### 3. User Level Stats
**Endpoint:** `/api/users/[id]/level/stats`

**GET** - Get user's level statistics
- Returns: `{ level, totalXP, xpForCurrentLevel, xpForNextLevel, progress, rank }`

---

### 4. User Activity Tracking
**Endpoint:** `/api/users/[id]/activity`

**POST** - Track user activity and award points
- Body: `{ type, points }`
- Returns: Updated level stats

---

### 5. User Preferences
**Endpoint:** `/api/users/[id]/preferences`

**GET** - Get user preferences
- Returns: User preferences object

**POST/PUT** - Update user preferences
- Body: Preference fields to update
- Returns: Updated preferences

---

### 6. Leaderboard
**Endpoint:** `/api/leaderboard`

**GET** - Get global leaderboard
- Query: `?limit=50`
- Returns: Array of top users with level stats

---

### 7. Interests List
**Endpoint:** `/api/interests`

**GET** - Get available interest categories
- Returns: Array of 30+ interest options

---

## Testing Commands

### Chat Rooms
```bash
# Create room
curl -X POST http://localhost:3000/api/chat/rooms \
  -H "Content-Type: application/json" \
  -d '{"groupId":"group_123","name":"general"}'

# Get rooms
curl http://localhost:3000/api/chat/rooms?groupId=group_123
```

### Chat Messages
```bash
# Send message
curl -X POST http://localhost:3000/api/chat/room_abc/messages \
  -H "Content-Type: application/json" \
  -d '{"senderId":"user_123","content":"Hello!"}'

# Get messages
curl http://localhost:3000/api/chat/room_abc/messages?limit=20
```

### User Stats
```bash
# Get level stats
curl http://localhost:3000/api/users/user_123/level/stats

# Track activity
curl -X POST http://localhost:3000/api/users/user_123/activity \
  -H "Content-Type: application/json" \
  -d '{"type":"message","points":1}'
```

### User Preferences
```bash
# Get preferences
curl http://localhost:3000/api/users/user_123/preferences

# Update preferences
curl -X PUT http://localhost:3000/api/users/user_123/preferences \
  -H "Content-Type: application/json" \
  -d '{"interests":["Study Groups","Computer Science"]}'
```

### Leaderboard & Interests
```bash
# Get leaderboard
curl http://localhost:3000/api/leaderboard?limit=50

# Get interests list
curl http://localhost:3000/api/interests
```

---

## Frontend Integration Examples

### Chat Component
```typescript
// Get rooms
const rooms = await fetch(`/api/chat/rooms?groupId=${groupId}`).then(r => r.json());

// Get messages
const messages = await fetch(`/api/chat/${roomId}/messages`).then(r => r.json());

// Send message
const response = await fetch(`/api/chat/${roomId}/messages`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ senderId, content })
});
```

### Profile Component
```typescript
// Get level stats
const stats = await fetch(`/api/users/${userId}/level/stats`).then(r => r.json());

// Track activity
await fetch(`/api/users/${userId}/activity`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'message', points: 1 })
});
```

### Leaderboard Component
```typescript
const leaders = await fetch('/api/leaderboard?limit=50').then(r => r.json());
```

### Settings Component
```typescript
// Get preferences
const prefs = await fetch(`/api/users/${userId}/preferences`).then(r => r.json());

// Get interests
const interests = await fetch('/api/interests').then(r => r.json());

// Update preferences
await fetch(`/api/users/${userId}/preferences`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ interests: selectedInterests })
});
```

---

## Services Used

All routes use the following services from `@/services`:
- **ChatService** - Chat rooms and messages
- **LevelService** - XP, levels, leaderboard, activity tracking
- **PreferencesService** - User preferences management

The routes provide proper error handling, validation, and consistent response formats.
