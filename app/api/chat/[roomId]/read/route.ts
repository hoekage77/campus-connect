/**
 * Read Receipts / Unread Tracking API
 * 
 * POST /api/chat/[roomId]/read - Mark messages as read
 * GET /api/chat/[roomId]/read - Get read status
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseRepository } from '@/lib/supabase/repository'
import { getUserIdFromRequest } from '@/lib/auth'

const repo = getSupabaseRepository()

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const userId = getUserIdFromRequest(req as any)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId } = params

    const readStatus = await repo.getReadStatus(roomId, userId)
    
    return NextResponse.json(readStatus)
  } catch (error) {
    console.error('[API] GET read status error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get read status' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const userId = getUserIdFromRequest(req as any)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId } = params
    const body = await req.json()
    const { messageId } = body

    if (!messageId) {
      return NextResponse.json({ error: 'messageId required' }, { status: 400 })
    }

    await repo.markAsRead(roomId, userId, messageId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] POST read status error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to mark as read' },
      { status: 500 }
    )
  }
}
