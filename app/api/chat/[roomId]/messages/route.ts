import { NextRequest, NextResponse } from 'next/server';
import { ChatService } from '../../../../../services';
import { getSupabaseRepository } from '@/lib/supabase/repository';
import { getUserIdFromRequest } from '@/lib/auth';

// GET /api/chat/[roomId]/messages
export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    let { roomId } = params || ({} as any);
    if (!roomId) {
      // Fallback: derive from URL path /api/chat/{roomId}/messages
      const pathname = req.nextUrl?.pathname || ''
      const after = pathname.split('/api/chat/')[1]
      const candidate = after ? after.split('/')[0] : ''
      if (candidate) roomId = candidate
    }
    if (!roomId) return NextResponse.json({ error: 'roomId required' }, { status: 400 });

    const userId = getUserIdFromRequest(req as any);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const repo = getSupabaseRepository();
    const room = await repo.getChatRoom(roomId);
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    
    // Check if user is a member of the group
    const groupMembers = await repo.getGroupMembers(room.groupId);
    if (!groupMembers.some(m => m.userId === userId)) {
      return NextResponse.json({ error: 'Forbidden: not a squad member' }, { status: 403 });
    }

    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');
    const messages = await ChatService.getMessages(roomId, limit, offset);
    return NextResponse.json(messages);
  } catch (error) {
    console.error('GET /api/chat/[roomId]/messages:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get messages' },
      { status: 500 }
    );
  }
}

// POST /api/chat/[roomId]/messages
export async function POST(
  req: NextRequest,
  { params }: { params: { roomId?: string } }
) {
  try {
    let roomId = params?.roomId
    if (!roomId) {
      // Fallback: derive from URL path /api/chat/{roomId}/messages
      const url = req.url || req.nextUrl?.pathname || ''
      let candidate = ''
      if (url.includes('/api/chat/')) {
        const after = url.split('/api/chat/')[1]
        candidate = after ? after.split('/')[0] : ''
      } else if (url.includes('/chat/')) {
        const after = url.split('/chat/')[1]
        candidate = after ? after.split('/')[0] : ''
      }
      if (candidate) roomId = candidate
      console.log('[chat messages POST] Fallback extracted roomId:', roomId, 'from url:', url)
    }
    let body: any = {}
    try {
      body = await req.json();
    } catch (parseErr) {
      console.warn('[chat messages POST] Failed to parse JSON body:', parseErr)
    }

    // Support legacy "message" field alias
    const rawContent = typeof body.content === 'string'
      ? body.content
      : typeof body.message === 'string'
        ? body.message
        : ''
    const content = rawContent.trim()

    // E2EE fields
    const encrypted = body.encrypted === true
    const nonce = typeof body.nonce === 'string' ? body.nonce : undefined
    const keyVersion = typeof body.keyVersion === 'number' ? body.keyVersion : undefined

    // Reply/threading
    const replyToId = typeof body.replyToId === 'string' ? body.replyToId : undefined

    // Mentions - extract @username patterns or accept explicit array
    const mentions: string[] = Array.isArray(body.mentions) ? body.mentions : []

    // Media fields (GIF, image, video, etc.)
    const mediaType = ['gif', 'image', 'video', 'audio', 'file', 'poll', 'space'].includes(body.mediaType) 
      ? body.mediaType 
      : undefined
    const mediaUrl = typeof body.mediaUrl === 'string' ? body.mediaUrl : undefined
    const mediaThumbnail = typeof body.mediaThumbnail === 'string' ? body.mediaThumbnail : undefined
    const mediaWidth = typeof body.mediaWidth === 'number' ? body.mediaWidth : undefined
    const mediaHeight = typeof body.mediaHeight === 'number' ? body.mediaHeight : undefined
    const mediaProvider = typeof body.mediaProvider === 'string' ? body.mediaProvider : undefined

    if (!roomId) {
      return NextResponse.json({ error: 'roomId path param missing', url: req.url || req.nextUrl?.pathname }, { status: 400 })
    }
    // Allow empty content for media messages (like GIFs)
    if (!content && !mediaType) {
      return NextResponse.json({ error: 'content required' }, { status: 400 })
    }

    const userId = getUserIdFromRequest(req as any);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const repo = getSupabaseRepository();
    const room = await repo.getChatRoom(roomId);
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    
    // Check if user is a member of the group
    const groupMembers = await repo.getGroupMembers(room.groupId);
    if (!groupMembers.some(m => m.userId === userId)) {
      return NextResponse.json({ error: 'Forbidden: not a squad member' }, { status: 403 });
    }

    const message = await ChatService.sendMessage(roomId, userId, content || '', {
      encrypted,
      nonce,
      keyVersion,
      replyToId,
      mediaType,
      mediaUrl,
      mediaThumbnail,
      mediaWidth,
      mediaHeight,
      mediaProvider,
    });

    // Create mentions if any
    if (mentions.length > 0) {
      await repo.createMentions(message.id, mentions)
      // TODO: Create notifications for mentioned users
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('POST /api/chat/[roomId]/messages:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 500 }
    );
  }
}
