/**
 * Room Keys API
 * 
 * GET /api/crypto/room-keys/[roomId] - Get public keys for all room members
 * Used when enabling encryption to wrap the group key for all members.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseRepository } from '@/lib/supabase/repository'
import { getUserIdFromRequest } from '@/lib/auth'

const repo = getSupabaseRepository()

// GET - Get public keys for all members of a room
export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId
    if (!roomId) {
      return NextResponse.json({ error: 'roomId required' }, { status: 400 })
    }

    const userId = getUserIdFromRequest(req as any)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get room and verify membership
    const room = await repo.getChatRoom(roomId)
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const members = await repo.getGroupMembers(room.groupId)
    if (!members.some(m => m.userId === userId)) {
      return NextResponse.json({ error: 'Not a member of this room' }, { status: 403 })
    }

    // Get public keys for all members who have E2EE enabled
    const keys = await repo.getRoomMemberPublicKeys(roomId)

    return NextResponse.json(keys)
  } catch (error) {
    console.error('[API] GET /api/crypto/room-keys/[roomId] error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get room keys' },
      { status: 500 }
    )
  }
}
