/**
 * Pinned Messages API
 * 
 * GET /api/chat/[roomId]/pinned - Get pinned messages
 * POST /api/chat/[roomId]/pinned - Pin a message
 * DELETE /api/chat/[roomId]/pinned/[messageId] - Unpin a message
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseRepository } from '@/lib/supabase/repository'
import { getUserIdFromRequest } from '@/lib/auth'

const repo = getSupabaseRepository()

// Helper to extract roomId from URL
function extractRoomId(req: NextRequest, params: { roomId?: string }): string | undefined {
  let roomId = params?.roomId
  if (!roomId) {
    const url = req.url || req.nextUrl?.pathname || ''
    // URL pattern: /api/chat/{roomId}/pinned
    const match = url.match(/\/api\/chat\/([^\/]+)\/pinned/)
    if (match) {
      roomId = match[1]
    }
  }
  return roomId
}

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId?: string } }
) {
  try {
    const roomId = extractRoomId(req, params)
    if (!roomId) {
      return NextResponse.json({ error: 'roomId required' }, { status: 400 })
    }

    const pinned = await repo.getPinnedMessages(roomId)
    
    return NextResponse.json(pinned)
  } catch (error) {
    console.error('[API] GET pinned error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get pinned messages' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId?: string } }
) {
  try {
    const userId = getUserIdFromRequest(req as any)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roomId = extractRoomId(req, params)
    if (!roomId) {
      return NextResponse.json({ error: 'roomId required' }, { status: 400 })
    }
    
    const body = await req.json()
    const { messageId } = body

    if (!messageId) {
      return NextResponse.json({ error: 'messageId required' }, { status: 400 })
    }

    // Verify user is member (ideally moderator/owner)
    const room = await repo.getChatRoom(roomId)
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const members = await repo.getGroupMembers(room.groupId)
    const member = members.find(m => m.userId === userId)
    if (!member) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    // Only owner/moderator can pin (optional: allow all members)
    if (member.role !== 'owner' && member.role !== 'moderator') {
      return NextResponse.json({ error: 'Only moderators can pin messages' }, { status: 403 })
    }

    const result = await repo.pinMessage(roomId, messageId, userId)
    
    if (!result.success) {
      throw new Error(result.error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] POST pin error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to pin message' },
      { status: 500 }
    )
  }
}
