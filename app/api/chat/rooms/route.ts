import { NextRequest, NextResponse } from 'next/server';
// Using relative import here to avoid certain TS path resolution issues in this route file
import { ChatService } from '../../../../services';
import { getSupabaseRepository } from '@/lib/supabase/repository'
import { getUserIdFromRequest } from '@/lib/auth';
import { dataStore } from '@/lib/data/store';

export async function GET(req: NextRequest) {
  try {
    const groupId = req.nextUrl.searchParams.get('groupId');
    if (!groupId) {
      return NextResponse.json({ error: 'groupId required' }, { status: 400 });
    }

    const userId = getUserIdFromRequest(req as any);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify membership using Supabase repository (source of truth)
    const repo = getSupabaseRepository()
    const members = await repo.getGroupMembers(groupId)
    if (!members.some(m => m.userId === userId)) {
      return NextResponse.json({ error: 'Forbidden: not a squad member' }, { status: 403 });
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
    const { groupId, name } = body;

    if (!groupId || !name) {
      return NextResponse.json(
        { error: 'groupId and name required' },
        { status: 400 }
      );
    }

    const userId = getUserIdFromRequest(req as any);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify membership via Supabase repository
    const repo = getSupabaseRepository()
    const members = await repo.getGroupMembers(groupId)
    const memberRecord = members.find(m => m.userId === userId);
    if (!memberRecord) {
      return NextResponse.json({ error: 'Forbidden: not a squad member' }, { status: 403 });
    }

    // Restrict creation to owner role for now (moderators future)
    if (memberRecord.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can create chat rooms' }, { status: 403 });
    }

    const room = await ChatService.createRoom(groupId, name);
    // Note: Chat room membership is handled through group membership
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('POST /api/chat/rooms:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create room' },
      { status: 500 }
    );
  }
}
