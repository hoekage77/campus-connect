import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth'
import { getSupabaseRepository } from '@/lib/supabase/repository'

// GET /api/chat/[roomId]/polls/[pollId] - Get a specific poll
export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string; pollId: string } }
) {
  try {
    const { pollId } = params

    const userId = getUserIdFromRequest(req as any)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repo = getSupabaseRepository()
    const poll = await repo.getPoll(pollId)

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    return NextResponse.json(poll)
  } catch (error) {
    console.error('GET /api/chat/[roomId]/polls/[pollId]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get poll' },
      { status: 500 }
    )
  }
}

// POST /api/chat/[roomId]/polls/[pollId] - Vote on a poll
export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string; pollId: string } }
) {
  try {
    const { pollId } = params

    const userId = getUserIdFromRequest(req as any)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { optionId } = body

    if (!optionId) {
      return NextResponse.json({ error: 'optionId required' }, { status: 400 })
    }

    const repo = getSupabaseRepository()
    
    // Check if poll is closed or expired
    const poll = await repo.getPoll(pollId)
    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    if (poll.closed) {
      return NextResponse.json({ error: 'Poll is closed' }, { status: 400 })
    }

    if (poll.endsAt && new Date(poll.endsAt) < new Date()) {
      return NextResponse.json({ error: 'Poll has expired' }, { status: 400 })
    }

    // Toggle vote
    const result = await repo.togglePollVote(pollId, optionId, userId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('POST /api/chat/[roomId]/polls/[pollId]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to vote' },
      { status: 500 }
    )
  }
}

// PATCH /api/chat/[roomId]/polls/[pollId] - Close a poll
export async function PATCH(
  req: NextRequest,
  { params }: { params: { roomId: string; pollId: string } }
) {
  try {
    const { pollId } = params

    const userId = getUserIdFromRequest(req as any)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repo = getSupabaseRepository()
    
    // Check ownership
    const poll = await repo.getPoll(pollId)
    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    if (poll.createdBy !== userId) {
      return NextResponse.json({ error: 'Only the poll creator can close it' }, { status: 403 })
    }

    const updated = await repo.closePoll(pollId)

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH /api/chat/[roomId]/polls/[pollId]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to close poll' },
      { status: 500 }
    )
  }
}
