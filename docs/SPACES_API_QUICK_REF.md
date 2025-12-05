# Spaces API Quick Reference

## Endpoints

### Group Spaces

#### List Group Spaces
```http
GET /api/groups/{groupId}/spaces?status=live
```
**Query Params:**
- `status` (optional): "live" | "ended" | "scheduled"

**Response:**
```json
[
  {
    "id": "space_123",
    "groupId": "group_456",
    "title": "Quick Study Sprint",
    "type": "study-sprint",
    "status": "live",
    "activeParticipantCount": 5,
    ...
  }
]
```

#### Create Space
```http
POST /api/groups/{groupId}/spaces
```
**Body:**
```json
{
  "title": "Quick Study Sprint",
  "description": "30-min focus session",
  "type": "study-sprint",
  "privacy": "public",
  "maxParticipants": 10,
  "audioEnabled": true,
  "videoEnabled": false,
  "screenShareEnabled": true
}
```

### Space Operations

#### Get Space Details
```http
GET /api/spaces/{spaceId}
```
**Response:**
```json
{
  "id": "space_123",
  "title": "Quick Study Sprint",
  "status": "live",
  "participants": [
    {
      "id": "participant_789",
      "userId": "user_101",
      "role": "host",
      "audioMuted": false,
      "handRaised": false,
      "user": {
        "id": "user_101",
        "username": "alex",
        "name": "Alex Johnson",
        "avatar": "..."
      }
    }
  ]
}
```

#### Update Space
```http
PATCH /api/spaces/{spaceId}
```
**Auth:** Host or co-host only

**Body:**
```json
{
  "title": "Updated Title",
  "maxParticipants": 15,
  "audioEnabled": true
}
```

#### End Space
```http
DELETE /api/spaces/{spaceId}
```
**Auth:** Host only

**Response:**
```json
{
  "id": "space_123",
  "status": "ended",
  "endedAt": "2025-11-15T10:30:00Z"
}
```

### Participant Actions

#### Join Space
```http
POST /api/spaces/{spaceId}/join
```
**Body (optional):**
```json
{
  "role": "listener"
}
```

**Response:**
```json
{
  "space": { ... },
  "participant": {
    "id": "participant_123",
    "userId": "user_456",
    "role": "listener",
    "audioMuted": true
  },
  "participantCount": 6
}
```

#### Leave Space
```http
POST /api/spaces/{spaceId}/leave
```

**Response:**
```json
{
  "success": true,
  "participantCount": 5
}
```

#### Raise/Lower Hand
```http
PATCH /api/spaces/{spaceId}/hand
```
**Body:**
```json
{
  "handRaised": true
}
```

#### Update Participant Role
```http
PATCH /api/spaces/{spaceId}/participants/{userId}/role
```
**Auth:** Host or co-host only

**Body:**
```json
{
  "role": "speaker"
}
```

## Data Models

### SpaceType
```typescript
type SpaceType = 
  | "study-sprint"    // Focused study session
  | "office-hours"    // Instructor/TA availability
  | "social"          // Hangout, breaks
  | "collaboration"   // Group work
  | "tutoring"        // Peer tutoring
  | "general"         // Catch-all
```

### SpacePrivacy
```typescript
type SpacePrivacy = 
  | "public"          // Anyone in group can see and join
  | "members-only"    // Only group members
  | "invite-only"     // Host must invite
```

### Participant Roles
```typescript
type SpaceParticipantRole = 
  | "host"            // Creator, full control
  | "co-host"         // Can manage participants
  | "speaker"         // Can talk
  | "listener"        // Listen only
```

## Common Flows

### Host Creates Space
1. POST `/api/groups/{groupId}/spaces` with space details
2. System creates space with status "live"
3. Host automatically joins as first participant
4. Group members receive notification

### User Joins Space
1. GET `/api/groups/{groupId}/spaces?status=live` to see active spaces
2. GET `/api/spaces/{spaceId}` to see details and participants
3. POST `/api/spaces/{spaceId}/join` to join as listener
4. Connect to the Daily.co room using the provided `roomUrl` plus the per-join access token returned by the join API (Phase 2)

### Listener Wants to Speak
1. PATCH `/api/spaces/{spaceId}/hand` with `handRaised: true`
2. Host receives notification
3. Host calls PATCH `/api/spaces/{spaceId}/participants/{userId}/role` with `role: "speaker"`
4. User can now unmute and speak

### Host Ends Space
1. DELETE `/api/spaces/{spaceId}`
2. All participants disconnected
3. Space status set to "ended"
4. Participants receive notification

## Error Codes

- **401**: Unauthorized (not logged in)
- **403**: Forbidden (not a member, not host, etc.)
- **404**: Space or group not found
- **400**: Bad request (validation error, space full, etc.)
- **500**: Server error

## Authentication

Include `x-user-id` header in all requests:
```javascript
fetch('/api/spaces/space_123', {
  headers: {
    'x-user-id': 'user_456'
  }
})
```

Or use `getAuthHeaders()` from `lib/auth.ts`:
```javascript
import { getAuthHeaders } from '@/lib/auth'

fetch('/api/spaces/space_123', {
  headers: getAuthHeaders()
})
```

## DataStore Methods

### Creation & Retrieval
- `createSpace(input)` → Space
- `getSpace(spaceId)` → Space | undefined
- `getAllSpaces()` → Space[]
- `getGroupSpaces(groupId, status?)` → Space[]
- `getLiveSpaces()` → Space[]

### Updates & Deletion
- `updateSpace(spaceId, updates)` → Space | undefined
- `endSpace(spaceId)` → Space | undefined
- `deleteSpace(spaceId)` → boolean

### Participants
- `joinSpace(spaceId, userId, role)` → SpaceParticipant | undefined
- `leaveSpace(spaceId, userId)` → boolean
- `getSpaceParticipants(spaceId)` → SpaceParticipant[]
- `getActiveSpaceParticipants(spaceId)` → SpaceParticipant[]
- `updateSpaceParticipant(participantId, updates)` → SpaceParticipant | undefined
- `updateSpaceParticipantRole(spaceId, userId, role)` → SpaceParticipant | undefined
- `raiseHand(spaceId, userId, handRaised)` → SpaceParticipant | undefined

### Invitations
- `createSpaceInvitation(spaceId, invitedUserId, invitedByUserId)` → SpaceInvitation
- `getSpaceInvitations(spaceId)` → SpaceInvitation[]
- `getUserSpaceInvitations(userId, status?)` → SpaceInvitation[]
- `updateSpaceInvitation(invitationId, status)` → SpaceInvitation | undefined

## Testing Examples

### Create and Join Flow
```typescript
// 1. Create space
const space = dataStore.createSpace({
  groupId: "group_1",
  hostId: "user_1",
  title: "Study Sprint",
  type: "study-sprint",
  privacy: "public",
  audioEnabled: true,
  videoEnabled: false,
});

// 2. Another user joins
const participant = dataStore.joinSpace(space.id, "user_2", "listener");

// 3. User raises hand
const updated = dataStore.raiseHand(space.id, "user_2", true);

// 4. Host promotes to speaker
const speaker = dataStore.updateSpaceParticipantRole(
  space.id, 
  "user_2", 
  "speaker"
);

// 5. User leaves
const left = dataStore.leaveSpace(space.id, "user_2");

// 6. Host ends space
const ended = dataStore.endSpace(space.id);
```

## Next Phase Preview

Phase 2 will add:
- Daily.co room creation and token generation
- React hooks for real-time WebRTC
- UI components for video/audio grid
- Live participant updates via WebSocket
- Audio level indicators
- Connection quality monitoring

Stay tuned! 🚀
