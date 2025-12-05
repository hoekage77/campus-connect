// QUICK START: Building Priority API Routes
// Priority 1 - Chat API Routes
// These are needed for chat functionality to work

// ============================================================================
// 1. Chat Rooms Route: /src/app/api/chat/rooms/route.ts
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { ChatService } from '@/services';

export async function GET(req: NextRequest) {
  try {
    const groupId = req.nextUrl.searchParams.get('groupId');
    if (!groupId) {
      return NextResponse.json({ error: 'groupId required' }, { status: 400 });
    }

    const rooms = await ChatService.getRoomsByGroup(groupId);
    return NextResponse.json(rooms);
  } catch (error) {
    console.error('GET /api/chat/rooms:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get rooms' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { groupId, name, type } = body;

    if (!groupId || !name) {
      return NextResponse.json(
        { error: 'groupId and name required' },
        { status: 400 }
      );
    }

    const room = await ChatService.createRoom(groupId, name, type || 'general');
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('POST /api/chat/rooms:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create room' },
      { status: 500 }
    );
  }
}

// ============================================================================
// 2. Chat Messages Route: /src/app/api/chat/[roomId]/messages/route.ts
// ============================================================================

import { ChatService } from '@/services';

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params;
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    const messages = await ChatService.getMessages(roomId, limit, offset);
    return NextResponse.json(messages);
  } catch (error) {
    console.error('GET /api/chat/[roomId]/messages:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params;
    const body = await req.json();
    const { senderId, content } = body;

    if (!senderId || !content) {
      return NextResponse.json(
        { error: 'senderId and content required' },
        { status: 400 }
      );
    }

    const message = await ChatService.sendMessage(roomId, senderId, content);
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('POST /api/chat/[roomId]/messages:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 500 }
    );
  }
}

// ============================================================================
// 3. User Level Stats: /src/app/api/users/[id]/level/stats/route.ts
// ============================================================================

import { LevelService } from '@/services';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: userId } = params;

    const levelData = await LevelService.getLevelStats(userId);
    const progress = await LevelService.getLevelProgress(userId);
    const rank = await LevelService.getUserRank(userId);

    return NextResponse.json({
      ...levelData,
      progress,
      rank,
    });
  } catch (error) {
    console.error('GET /api/users/[id]/level/stats:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get level stats' },
      { status: 500 }
    );
  }
}

// ============================================================================
// 4. User Activity Tracking: /src/app/api/users/[id]/activity/route.ts
// ============================================================================

import { LevelService } from '@/services';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: userId } = params;
    const body = await req.json();
    const { type, points } = body;

    if (!type || !points) {
      return NextResponse.json(
        { error: 'type and points required' },
        { status: 400 }
      );
    }

    await LevelService.trackActivity(userId, type, points);
    
    const updated = await LevelService.getLevelStats(userId);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('POST /api/users/[id]/activity:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to track activity' },
      { status: 500 }
    );
  }
}

// ============================================================================
// 5. User Preferences: /src/app/api/users/[id]/preferences/route.ts
// ============================================================================

import { PreferencesService } from '@/services';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: userId } = params;
    const prefs = await PreferencesService.getPreferences(userId);
    return NextResponse.json(prefs);
  } catch (error) {
    console.error('GET /api/users/[id]/preferences:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: userId } = params;
    const body = await req.json();

    const updated = await PreferencesService.updatePreferences(userId, body);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/users/[id]/preferences:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update preferences' },
      { status: 500 }
    );
  }
}

// ============================================================================
// 6. Leaderboard: /src/app/api/leaderboard/route.ts
// ============================================================================

import { LevelService } from '@/services';

export async function GET(req: NextRequest) {
  try {
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const leaderboard = await LevelService.getLeaderboard(limit);
    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('GET /api/leaderboard:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get leaderboard' },
      { status: 500 }
    );
  }
}

// ============================================================================
// TESTING GUIDE
// ============================================================================

/*
Test these endpoints with curl or Postman:

1. CREATE A CHAT ROOM
   POST /api/chat/rooms
   Body: {
     "groupId": "group_123",
     "name": "general",
     "type": "general"
   }

2. GET MESSAGES IN ROOM
   GET /api/chat/room_123/messages?limit=20

3. SEND MESSAGE
   POST /api/chat/room_123/messages
   Body: {
     "senderId": "user_456",
     "content": "Hello everyone!"
   }

4. GET USER LEVEL STATS
   GET /api/users/user_456/level/stats

5. TRACK ACTIVITY
   POST /api/users/user_456/activity
   Body: {
     "type": "message",
     "points": 1
   }

6. GET/UPDATE PREFERENCES
   GET /api/users/user_456/preferences
   PUT /api/users/user_456/preferences
   Body: {
     "interests": ["Study Groups", "Sports"],
     "notificationFrequency": "daily"
   }

7. GET LEADERBOARD
   GET /api/leaderboard?limit=50
*/

// ============================================================================
// FILE STRUCTURE TO CREATE
// ============================================================================

/*
src/app/api/
├── chat/
│   ├── rooms/
│   │   └── route.ts          ← GET/POST rooms
│   └── [roomId]/
│       └── messages/
│           └── route.ts      ← GET/POST messages
├── users/
│   └── [id]/
│       ├── level/
│       │   ├── route.ts      ← (already exists)
│       │   └── stats/
│       │       └── route.ts  ← NEW: GET level stats
│       ├── activity/
│       │   └── route.ts      ← NEW: POST activity tracking
│       └── preferences/
│           └── route.ts      ← NEW: GET/PUT preferences
└── leaderboard/
    └── route.ts              ← NEW: GET leaderboard
*/
