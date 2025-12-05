/**
 * Typing Indicators API
 * 
 * POST /api/chat/[roomId]/typing - Start/update typing indicator
 * DELETE /api/chat/[roomId]/typing - Stop typing
 * GET /api/chat/[roomId]/typing - Get current typing users
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
    const { roomId } = params

    const typing = await repo.getTypingUsers(roomId)
    
    return NextResponse.json(typing)
  } catch (error) {
    console.error('[API] GET typing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get typing users' },
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

    await repo.setTyping(roomId, userId, true)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] POST typing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to set typing' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const userId = getUserIdFromRequest(req as any)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId } = params

    await repo.setTyping(roomId, userId, false)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] DELETE typing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to stop typing' },
      { status: 500 }
    )
  }
}
