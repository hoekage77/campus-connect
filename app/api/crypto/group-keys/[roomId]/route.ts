/**
 * Group Keys API
 * 
 * GET /api/crypto/group-keys/[roomId] - Get wrapped group key for current user
 * POST /api/crypto/group-keys/[roomId] - Upload wrapped keys for room members
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseRepository } from '@/lib/supabase/repository'
import { getUserIdFromRequest } from '@/lib/auth'

const repo = getSupabaseRepository()

// GET - Get wrapped group key for current user
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

    // Get the latest wrapped key for this user
    const data = await repo.getGroupKey(roomId, userId)

    if (!data) {
      return NextResponse.json({ error: 'No key found for this room' }, { status: 404 })
    }

    return NextResponse.json({
      roomId,
      wrappedKey: data.wrappedKey,
      keyVersion: data.keyVersion,
      createdAt: data.createdAt,
    })
  } catch (error) {
    console.error('[API] GET /api/crypto/group-keys/[roomId] error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get group key' },
      { status: 500 }
    )
  }
}

// POST - Upload wrapped keys for room members
export async function POST(
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

    const body = await req.json()
    const { wrappedKeys, keyVersion = 1 } = body

    if (!wrappedKeys || !Array.isArray(wrappedKeys)) {
      return NextResponse.json(
        { error: 'wrappedKeys array required' },
        { status: 400 }
      )
    }

    // Verify user is a member of the room's group
    const room = await repo.getChatRoom(roomId)
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const members = await repo.getGroupMembers(room.groupId)
    if (!members.some(m => m.userId === userId)) {
      return NextResponse.json({ error: 'Not a member of this room' }, { status: 403 })
    }

    // Insert wrapped keys for each member
    const records = wrappedKeys.map((wk: { userId: string; wrappedKey: string }) => ({
      chatRoomId: roomId,
      userId: wk.userId,
      wrappedKey: wk.wrappedKey,
      keyVersion: keyVersion,
      createdBy: userId,
    }))

    const result = await repo.upsertGroupKeys(records)

    if (!result.success) {
      throw new Error(result.error)
    }

    // Update room to enable encryption
    await repo.enableRoomEncryption(roomId, keyVersion)

    return NextResponse.json({ success: true, keyVersion })
  } catch (error) {
    console.error('[API] POST /api/crypto/group-keys/[roomId] error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save group keys' },
      { status: 500 }
    )
  }
}
