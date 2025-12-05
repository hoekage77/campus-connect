import { NextRequest, NextResponse } from 'next/server'
import { dataStore } from '@/lib/data/store'
import { getUserIdFromRequest } from '@/lib/auth'

interface Interaction {
  id: string
  type: string
  title: string
  snippet?: string
  createdAt: string
  url?: string
  meta?: Record<string, any>
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const authUser = getUserIdFromRequest(req as any)
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (authUser !== id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')
    const interactions: Interaction[] = []

    // Groups created
    for (const group of dataStore.getAllGroups()) {
      if (group.ownerId === id) {
        interactions.push({
          id: `group-${group.id}`,
          type: 'group-created',
          title: `Created squad “${group.title}”`,
          snippet: group.description?.slice(0,140),
          createdAt: group.createdAt.toISOString(),
          url: `/groups/${group.id}`,
        })
      }
    }

    // Sessions hosted
    for (const session of dataStore.getAllSessions()) {
      if (session.hostId === id) {
        interactions.push({
          id: `session-${session.id}`,
          type: 'session-hosted',
          title: `Hosted session “${session.title}”`,
          snippet: session.description?.slice(0,140),
          createdAt: session.createdAt.toISOString(),
          url: session.groupId ? `/groups/${session.groupId}` : undefined,
          meta: { startAt: session.startAt, endAt: session.endAt }
        })
      }
    }

    // Chat messages sent
    const chatMessagesMap: Record<string, any[]> = {}
    ;(dataStore as any).chatMessages?.forEach?.((msgs: any[], roomId: string) => {
      chatMessagesMap[roomId] = msgs
    })
    for (const [roomId, msgs] of Object.entries(chatMessagesMap)) {
      const room = dataStore.getChatRoom(roomId)
      if (!room) continue
      for (const msg of msgs) {
        if (msg.senderId === id) {
          interactions.push({
            id: `msg-${msg.id}`,
            type: 'message',
            title: `Message in #${room.name}`,
            snippet: msg.content.slice(0,160),
            createdAt: (msg.createdAt instanceof Date ? msg.createdAt : new Date(msg.createdAt)).toISOString(),
            url: `/groups/${room.groupId}/chat/${room.id}`,
          })
        }
      }
    }

    interactions.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const limited = interactions.slice(0, limit)
    return NextResponse.json({ items: limited, total: interactions.length })
  } catch (error) {
    console.error('GET /api/users/[id]/interactions:', error)
    return NextResponse.json({ error: 'Failed to load interactions' }, { status: 500 })
  }
}
