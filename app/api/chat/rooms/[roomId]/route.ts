/**
 * Chat Room Details API
 * 
 * GET /api/chat/rooms/[roomId] - Get room details including encryption status
 * PATCH /api/chat/rooms/[roomId] - Update room settings (e.g., enable encryption)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseRepository } from '@/lib/supabase/repository'
import { getUserIdFromRequest } from '@/lib/auth'

const repo = getSupabaseRepository()

// GET - Get room details
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

    // Get room from database with encryption fields
    const room = await repo.getChatRoomWithEncryption(roomId)

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Check membership
    const members = await repo.getGroupMembers(room.groupId)
    if (!members.some(m => m.userId === userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      id: room.id,
      groupId: room.groupId,
      name: room.name,
      topic: room.topic,
      encryptionEnabled: room.encryptionEnabled,
      currentKeyVersion: room.currentKeyVersion,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    })
  } catch (error) {
    console.error('[API] GET /api/chat/rooms/[roomId] error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get room' },
      { status: 500 }
    )
  }
}

// PATCH - Update room settings
export async function PATCH(
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
    const updates: { name?: string; topic?: string } = {}
    
    if (typeof body.name === 'string') {
      updates.name = body.name.trim()
    }
    
    if (typeof body.topic === 'string') {
      updates.topic = body.topic.trim()
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const result = await repo.updateChatRoom(roomId, userId, updates)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 403 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] PATCH /api/chat/rooms/[roomId] error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update room' },
      { status: 500 }
    )
  }
}
