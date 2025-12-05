# API Integration Guide 🚀

This guide shows you how to integrate the new API routes into your Campus Connect platform.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Using the API Client](#using-the-api-client)
3. [Using React Hooks](#using-react-hooks)
4. [Updated Components](#updated-components)
5. [Common Integration Patterns](#common-integration-patterns)
6. [Examples](#examples)

---

## Quick Start

### 1. Import the API Client

For direct API calls:
```typescript
import { 
  getChatRooms, 
  sendChatMessage, 
  getUserLevelStats,
  trackUserActivity 
} from '@/lib/api-client';
```

### 2. Import React Hooks

For component integration:
```typescript
import { 
  useChatMessages, 
  useUserLevel, 
  useLeaderboard,
  useUserPreferences 
} from '@/hooks/use-api';
```

---

## Using the API Client

The API client (`src/lib/api-client.ts`) provides direct access to all API routes:

### Chat API

```typescript
// Get rooms for a group
const rooms = await getChatRooms('group-123');

// Create a new room
const newRoom = await createChatRoom('group-123', 'Study Hall', 'custom');

// Get messages
const messages = await getChatMessages('room-456', 50, 0);

// Send message (automatically awards +1 point)
const message = await sendChatMessage('room-456', 'user-789', 'Hello!');
```

### User Level API

```typescript
// Get comprehensive level stats
const stats = await getUserLevelStats('user-123');
// Returns: { currentLevel, totalPoints, pointsThisWeek, progress, rank, ... }

// Track activity manually
const updated = await trackUserActivity('user-123', 'session_attended', 10);
```

### Activity Tracking Helpers

```typescript
import { ActivityTracker } from '@/lib/api-client';

// Pre-defined activities with standard point values
await ActivityTracker.messageSent('user-123');        // +1 point
await ActivityTracker.sessionAttended('user-123');    // +10 points
await ActivityTracker.groupCreated('user-123');       // +15 points
await ActivityTracker.groupJoined('user-123');        // +5 points
await ActivityTracker.dailyLogin('user-123');         // +2 points
await ActivityTracker.profileCompleted('user-123');   // +20 points

// Custom activity
await ActivityTracker.custom('user-123', 'achievement_unlocked', 25);
```

### Leaderboard API

```typescript
// Get top 50 users
const leaderboard = await getLeaderboard(50);
```

### Preferences API

```typescript
// Get preferences
const prefs = await getUserPreferences('user-123');

// Update preferences
const updated = await updateUserPreferences('user-123', {
  interests: ['AI & Machine Learning', 'Web Development'],
  notificationFrequency: 'weekly'
});

// Get available interests
const interests = await getAvailableInterests();
// Returns: ['Study Groups', 'Computer Science', 'Mathematics', ...]
```

---

## Using React Hooks

React hooks provide automatic state management, loading states, and refresh capabilities.

### Chat Hooks

```typescript
// Get rooms for a group
const { rooms, loading, error, refresh } = useChatRooms('group-123');

// Get messages in a room
const { messages, loading, error, sendMessage, loadMore, hasMore } = useChatMessages('room-456');

// Send a message
await sendMessage('user-id', 'Hello world!');

// Load older messages
if (hasMore) {
  loadMore();
}
```

### User Level Hook

```typescript
const { levelStats, loading, error, refresh, trackActivity } = useUserLevel('user-123');

// Display level info
<div>
  <p>Level: {levelStats?.currentLevel}</p>
  <p>Points: {levelStats?.totalPoints}</p>
  <p>Rank: #{levelStats?.rank}</p>
  <p>Progress: {levelStats?.progress?.progressPercent}%</p>
</div>

// Track activity
await trackActivity('message', 1);
```

### Leaderboard Hook

```typescript
const { leaderboard, loading, error, refresh } = useLeaderboard(50);

// Display leaderboard
{leaderboard.map((user, index) => (
  <div key={user.userId}>
    <span>#{index + 1}</span>
    <span>{user.currentLevel}</span>
    <span>{user.totalPoints} pts</span>
  </div>
))}
```

### Preferences Hook

```typescript
const { preferences, loading, error, refresh, update } = useUserPreferences('user-123');

// Display preferences
<div>Selected: {preferences?.interests.join(', ')}</div>

// Update preferences
await update({ 
  interests: ['Gaming', 'Sports & Fitness'],
  notificationFrequency: 'daily' 
});
```

### Available Interests Hook

```typescript
const { interests, loading, error } = useAvailableInterests();

// Display interest options
{interests.map(interest => (
  <button key={interest}>{interest}</button>
))}
```

### Activity Tracker Hook

```typescript
const { trackActivity } = useActivityTracker('user-123');

// Track predefined activities
await trackActivity('session_attended');
await trackActivity('group_created');
await trackActivity('message');
await trackActivity('login');

// Track custom activity
await trackActivity('custom', 50); // 50 points
```

---

## Updated Components

### ✅ LevelCard (`src/components/dashboard/LevelCard.tsx`)

**Updated to use:** `useUserLevel` hook

**New features:**
- Shows weekly points
- Shows global rank
- Shows progress to next level
- Better loading state

**Usage:**
```tsx
<LevelCard userId={currentUserId} />
```

### ✅ PreferencesEditor (`src/components/preferences-editor.tsx`)

**Updated to use:** `useUserPreferences` and `useAvailableInterests` hooks

**New features:**
- Loads 30+ interests from API
- Uses new PUT endpoint
- Better save feedback
- Loading states

**Usage:**
```tsx
<PreferencesEditor userId={currentUserId} />
```

### ✅ NEW: Leaderboard Component (`src/components/dashboard/Leaderboard.tsx`)

**Uses:** `useLeaderboard` hook

**Features:**
- Top 50 users ranked by points
- Shows level badges
- Trophy icons for top 3
- Activity stats (events, groups, messages)
- Weekly point gains

**Usage:**
```tsx
import { Leaderboard } from '@/components/dashboard/Leaderboard';

<Leaderboard limit={50} />
```

---

## Common Integration Patterns

### Pattern 1: Chat Component with Auto-tracking

```typescript
"use client";
import { useChatMessages } from '@/hooks/use-api';

export function ChatRoom({ roomId, userId }: Props) {
  const { messages, sendMessage, loading } = useChatMessages(roomId);
  
  const handleSend = async (content: string) => {
    // sendMessage automatically awards +1 activity point
    await sendMessage(userId, content);
  };

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      <button onClick={() => handleSend('Hello!')}>Send</button>
    </div>
  );
}
```

### Pattern 2: Track Activity on Action

```typescript
import { useActivityTracker } from '@/hooks/use-api';

export function SessionRSVP({ userId, sessionId }: Props) {
  const { trackActivity } = useActivityTracker(userId);

  const handleRSVP = async () => {
    await rsvpToSession(sessionId);
    // Award points for attending
    await trackActivity('session_attended'); // +10 points
  };

  return <button onClick={handleRSVP}>RSVP</button>;
}
```

### Pattern 3: Real-time Level Display

```typescript
import { useUserLevel } from '@/hooks/use-api';

export function ProfileHeader({ userId }: Props) {
  const { levelStats, refresh } = useUserLevel(userId);

  // Refresh after any action
  const handleAction = async () => {
    await performAction();
    refresh(); // Reload level stats
  };

  return (
    <div>
      <LevelBadge level={levelStats?.currentLevel} />
      <span>{levelStats?.totalPoints} points</span>
      <span>Rank #{levelStats?.rank}</span>
    </div>
  );
}
```

### Pattern 4: Multi-room Chat Browser

```typescript
import { useChatRooms } from '@/hooks/use-api';

export function ChatBrowser({ groupId }: Props) {
  const { rooms, loading, refresh } = useChatRooms(groupId);

  return (
    <div>
      <button onClick={refresh}>Refresh</button>
      {rooms.map(room => (
        <div key={room.id}>
          <h3>{room.name}</h3>
          <span>{room.messageCount} messages</span>
        </div>
      ))}
    </div>
  );
}
```

---

## Examples

### Example 1: Dashboard with Leaderboard

```tsx
// src/app/dashboard/page.tsx
import { Leaderboard } from '@/components/dashboard/Leaderboard';
import LevelCard from '@/components/dashboard/LevelCard';

export default function Dashboard() {
  const userId = getCurrentUserId();

  return (
    <div className="grid grid-cols-2 gap-6">
      <LevelCard userId={userId} />
      <Leaderboard limit={10} />
    </div>
  );
}
```

### Example 2: Group Page with Chat

```tsx
"use client";
import { useChatRooms, useChatMessages } from '@/hooks/use-api';

export default function GroupPage({ groupId }: Props) {
  const { rooms } = useChatRooms(groupId);
  const [selectedRoom, setSelectedRoom] = useState(rooms[0]?.id);
  const { messages, sendMessage } = useChatMessages(selectedRoom);

  return (
    <div className="flex">
      {/* Room list */}
      <aside>
        {rooms.map(room => (
          <button key={room.id} onClick={() => setSelectedRoom(room.id)}>
            {room.name} ({room.messageCount})
          </button>
        ))}
      </aside>

      {/* Messages */}
      <main>
        {messages.map(msg => (
          <div key={msg.id}>
            <strong>{msg.senderName}</strong>: {msg.content}
          </div>
        ))}
      </main>
    </div>
  );
}
```

### Example 3: Settings Page

```tsx
"use client";
import { PreferencesEditor } from '@/components/preferences-editor';

export default function SettingsPage() {
  const userId = getCurrentUserId();

  return (
    <div>
      <h1>Your Preferences</h1>
      <PreferencesEditor userId={userId} />
    </div>
  );
}
```

### Example 4: Activity Tracking on Group Join

```tsx
"use client";
import { useActivityTracker } from '@/hooks/use-api';

export function JoinGroupButton({ groupId, userId }: Props) {
  const { trackActivity } = useActivityTracker(userId);
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    setLoading(true);
    try {
      await joinGroup(groupId);
      // Award points for joining
      await trackActivity('group_joined'); // +5 points
      alert('Joined! You earned 5 points!');
    } catch (err) {
      alert('Failed to join');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleJoin} disabled={loading}>
      {loading ? 'Joining...' : 'Join Group'}
    </button>
  );
}
```

---

## Migration Checklist

### 1. Chat Components
- [ ] Update `group-chat.tsx` to use `useChatMessages` hook
- [ ] Update `ChatRoomsList.tsx` to use `useChatRooms` hook
- [ ] Add activity tracking to message sends

### 2. Level Components
- [x] ✅ Update `LevelCard.tsx` to use `useUserLevel` hook
- [ ] Update `ProfileCard.tsx` to use `getUserLevelStats`
- [ ] Update `AchievementsList.tsx` to use level stats API

### 3. Preferences
- [x] ✅ Update `preferences-editor.tsx` to use new hooks
- [ ] Update settings page to use `useUserPreferences`

### 4. New Features
- [x] ✅ Add `Leaderboard.tsx` component to dashboard
- [ ] Add activity tracking to key user actions
- [ ] Add "points earned" notifications

### 5. Testing
- [ ] Test chat room creation and messaging
- [ ] Test activity point awards
- [ ] Test leaderboard display
- [ ] Test preferences save/load
- [ ] Test mobile responsiveness

---

## Next Steps

1. **Update remaining components** - Migrate chat and group components to use new hooks
2. **Add WebSocket support** - Implement real-time message updates
3. **Add notifications** - Show toast when users earn points
4. **Add achievements** - Display achievements on profile/dashboard
5. **Add analytics** - Track which features earn the most points

---

## Support

For issues or questions about integration:
1. Check `API_TEST_RESULTS.md` for endpoint behavior
2. Check `API_ROUTES.md` for endpoint documentation
3. Review component examples in this guide
4. Test endpoints with curl commands in terminal

All routes are live and tested! 🎉
