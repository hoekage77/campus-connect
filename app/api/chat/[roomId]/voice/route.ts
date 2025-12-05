import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth'
import { getSupabaseRepository } from '@/lib/supabase/repository'
import { ChatService } from '@/services'

/**
 * POST /api/chat/[roomId]/voice
 * Upload a voice message
 * 
 * Accepts multipart/form-data with:
 * - audio: Blob (the audio file)
 * - duration: number (in seconds)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { roomId?: string } }
) {
  try {
    let roomId = params?.roomId
    if (!roomId) {
      // Fallback: derive from URL path /api/chat/{roomId}/voice
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
      console.log('[voice POST] Fallback extracted roomId:', roomId, 'from url:', url)
    }
    
    if (!roomId) {
      return NextResponse.json({ error: 'roomId required' }, { status: 400 })
    }

    const userId = getUserIdFromRequest(req as any)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repo = getSupabaseRepository()
    
    // Verify room exists and user has access
    const room = await repo.getChatRoom(roomId)
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const groupMembers = await repo.getGroupMembers(room.groupId)
    if (!groupMembers.some(m => m.userId === userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse form data
    const formData = await req.formData()
    const audioFile = formData.get('audio') as Blob | null
    const duration = parseFloat(formData.get('duration') as string) || 0

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file required' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (audioFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Audio file too large (max 10MB)' }, { status: 400 })
    }

    // Convert blob to base64 for storage
    // In production, you'd upload to Supabase Storage or S3
    const arrayBuffer = await audioFile.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const mimeType = audioFile.type || 'audio/webm'
    const dataUrl = `data:${mimeType};base64,${base64}`

    // For production: Upload to Supabase Storage
    // const { data: uploadData, error: uploadError } = await supabase.storage
    //   .from('voice-messages')
    //   .upload(`${roomId}/${Date.now()}.webm`, audioFile)
    // const audioUrl = supabase.storage.from('voice-messages').getPublicUrl(uploadData.path)

    // Create message with voice data
    const message = await ChatService.sendMessage(roomId, userId, '🎤 Voice message', {
      mediaType: 'audio',
      mediaUrl: dataUrl, // In production, use the storage URL
      mediaProvider: 'voice',
      // Store duration in a custom way (we'll add it to the content for now)
    })

    // Return the created message with duration info
    return NextResponse.json({
      ...message,
      voiceDuration: duration,
    }, { status: 201 })

  } catch (error) {
    console.error('POST /api/chat/[roomId]/voice:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload voice message' },
      { status: 500 }
    )
  }
}
