/**
 * Message Reactions API
 * 
 * POST /api/chat/[roomId]/messages/[messageId]/reactions - Add reaction
 * DELETE /api/chat/[roomId]/messages/[messageId]/reactions - Remove reaction
 * GET /api/chat/[roomId]/messages/[messageId]/reactions - Get reactions
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseRepository } from '@/lib/supabase/repository'
import { getUserIdFromRequest } from '@/lib/auth'

const repo = getSupabaseRepository()

// Available reaction emojis
const VALID_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '✅', '❓', '🎉', '🔥', '👀']

// Helper to extract params from URL
function extractParams(req: NextRequest, params: { roomId?: string; messageId?: string }) {
  let roomId = params?.roomId
  let messageId = params?.messageId
  
  if (!roomId || !messageId) {
    const url = req.url || req.nextUrl?.pathname || ''
    // URL pattern: /api/chat/{roomId}/messages/{messageId}/reactions
    const match = url.match(/\/api\/chat\/([^\/]+)\/messages\/([^\/]+)\/reactions/)
    if (match) {
      roomId = roomId || match[1]
      messageId = messageId || match[2]
    }
  }
  return { roomId, messageId }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId?: string; messageId?: string } }
) {
  try {
    const { messageId } = extractParams(req, params)
    if (!messageId) {
      return NextResponse.json({ error: 'messageId required' }, { status: 400 })
    }

    const reactions = await repo.getMessageReactions(messageId)
    
    return NextResponse.json(reactions)
  } catch (error) {
    console.error('[API] GET reactions error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get reactions' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId?: string; messageId?: string } }
) {
  try {
    const userId = getUserIdFromRequest(req as any)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId, messageId } = extractParams(req, params)
    if (!roomId || !messageId) {
      return NextResponse.json({ error: 'roomId and messageId required' }, { status: 400 })
    }
    
    const body = await req.json()
    const { emoji } = body

    if (!emoji || !VALID_EMOJIS.includes(emoji)) {
      return NextResponse.json(
        { error: 'Invalid emoji', validEmojis: VALID_EMOJIS },
        { status: 400 }
      )
    }

    // Verify user is member of the room
    const room = await repo.getChatRoom(roomId)
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const members = await repo.getGroupMembers(room.groupId)
    if (!members.some(m => m.userId === userId)) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    const result = await repo.addMessageReaction(messageId, userId, emoji)
    
    if (!result.success) {
      throw new Error(result.error)
    }

    return NextResponse.json({ success: true, emoji })
  } catch (error) {
    console.error('[API] POST reaction error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add reaction' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { roomId?: string; messageId?: string } }
) {
  try {
    const userId = getUserIdFromRequest(req as any)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId } = extractParams(req, params)
    if (!messageId) {
      return NextResponse.json({ error: 'messageId required' }, { status: 400 })
    }
    
    const { searchParams } = new URL(req.url)
    const emoji = searchParams.get('emoji')

    if (!emoji) {
      return NextResponse.json({ error: 'emoji required' }, { status: 400 })
    }

    const result = await repo.removeMessageReaction(messageId, userId, emoji)
    
    if (!result.success) {
      throw new Error(result.error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] DELETE reaction error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove reaction' },
      { status: 500 }
    )
  }
}
