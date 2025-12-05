import { NextResponse } from 'next/server'
import { getSupabaseRepository } from '@/lib/supabase/repository'
import { getUserIdFromRequest } from '@/lib/auth'

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/groups/[id]/sessions - list sessions for a squad
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id: groupId } = await context.params
    const repo = getSupabaseRepository()
    const group = await repo.getGroup(groupId)
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    const all = await repo.getGroupSessions(groupId)
    return NextResponse.json(all, { headers: { 'cache-control': 'no-store' } })
  } catch (err) {
    console.error('[Group Sessions GET] error', err)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}

// POST /api/groups/[id]/sessions - create a new session in a squad (owner only)
export async function POST(request: Request, context: RouteContext) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const { id: groupId } = await context.params
    const repo = getSupabaseRepository()
    const group = await repo.getGroup(groupId)
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    // Only owner can create (expand to moderators later)
    if (group.ownerId !== userId) {
      return NextResponse.json({ error: 'Forbidden: only owner can create sessions' }, { status: 403 })
    }

    const body = await request.json()
    const title = String(body?.title || '').trim()
    const description = String(body?.description || '').trim()
    const location = String(body?.location || '').trim()
    const privacy = body?.privacy === 'invite-only' ? 'invite-only' : 'public'
    const capacity = typeof body?.capacity === 'number' ? body.capacity : undefined
    const startAt = new Date(body?.startAt)
    const endAt = new Date(body?.endAt)

    if (!title || !description || !location || !startAt || !endAt || isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
      return NextResponse.json({ error: 'Invalid session input' }, { status: 400 })
    }

    const created = await repo.createSession({
      title,
      description,
      hostId: userId,
      groupId,
      location,
      startAt,
      endAt,
      capacity,
      privacy,
    })

    // Notify all squad members except creator
    try {
      const groupMembers = await repo.getGroupMembers(groupId)
      for (const member of groupMembers) {
        if (member.userId !== userId) {
          await import('@/services').then(({ NotificationService }) =>
            NotificationService.createNotification(
              member.userId,
              'event-reminder',
              'New Squad Session',
              `A new session "${title}" has been scheduled in your squad!`,
              `/sessions/${created.id}`,
              created.id
            )
          )
        }
      }
    } catch (notifyErr) {
      console.warn('[Session Create] Notification error', notifyErr)
    }

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    console.error('[Group Sessions POST] error', err)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
