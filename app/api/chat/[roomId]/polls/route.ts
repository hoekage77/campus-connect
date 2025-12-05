import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth'
import { getSupabaseRepository } from '@/lib/supabase/repository'

// GET /api/chat/[roomId]/polls - Get polls for a room
export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params
    if (!roomId) {
      return NextResponse.json({ error: 'roomId required' }, { status: 400 })
    }

    const userId = getUserIdFromRequest(req as any)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repo = getSupabaseRepository()
    const polls = await repo.getRoomPolls(roomId)

    return NextResponse.json(polls)
  } catch (error) {
    console.error('GET /api/chat/[roomId]/polls:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get polls' },
      { status: 500 }
    )
  }
}

// POST /api/chat/[roomId]/polls - Create a new poll
export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params
    if (!roomId) {
      return NextResponse.json({ error: 'roomId required' }, { status: 400 })
    }

    const userId = getUserIdFromRequest(req as any)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { question, options, type = 'single', anonymous = false, endsAt } = body

    if (!question?.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    if (!Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ error: 'At least 2 options required' }, { status: 400 })
    }

    const repo = getSupabaseRepository()
    const poll = await repo.createPoll({
      chatRoomId: roomId,
      createdBy: userId,
      question: question.trim(),
      options: options.filter((o: string) => o?.trim()),
      pollType: type,
      anonymous,
      endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
    })

    return NextResponse.json(poll, { status: 201 })
  } catch (error) {
    console.error('POST /api/chat/[roomId]/polls:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create poll' },
      { status: 500 }
    )
  }
}
