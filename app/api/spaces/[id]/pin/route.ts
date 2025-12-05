/**
 * Pinned Content API
 * 
 * Endpoints for managing pinned content in spaces
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Type for pinned content
export interface PinnedContent {
  id: string
  type: 'text' | 'link' | 'image' | 'code' | 'poll' | 'file'
  content: string
  title?: string
  metadata?: {
    language?: string
    linkPreview?: {
      title: string
      description: string
      image: string
    }
    pollOptions?: { id: string; text: string; votes: number }[]
    fileName?: string
    fileSize?: number
  }
  pinnedBy: string
  pinnedAt: string
}

interface SpacePinnedContent {
  space_id: string
  pinned_content: PinnedContent | null
  pinned_at: string | null
  pinned_by: string | null
}

// GET - Get pinned content for a space
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: spaceId } = await params

    const { data: space, error } = await supabase
      .from('spaces')
      .select('id, pinned_content, pinned_at, pinned_by')
      .eq('id', spaceId)
      .single()

    if (error) {
      console.error('Error fetching pinned content:', error)
      return NextResponse.json(
        { error: 'Failed to fetch pinned content' },
        { status: 500 }
      )
    }

    if (!space) {
      return NextResponse.json(
        { error: 'Space not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      pinnedContent: space.pinned_content,
      pinnedAt: space.pinned_at,
      pinnedBy: space.pinned_by,
    })
  } catch (error) {
    console.error('Error in GET /api/spaces/[id]/pin:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Pin content to a space
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: spaceId } = await params
    const body = await request.json()
    
    const { type, content, title, metadata, userId } = body

    if (!type || !content || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: type, content, userId' },
        { status: 400 }
      )
    }

    // Validate content type
    const validTypes = ['text', 'link', 'image', 'code', 'poll', 'file']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid content type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Create pinned content object
    const pinnedContent: PinnedContent = {
      id: crypto.randomUUID(),
      type,
      content,
      title,
      metadata,
      pinnedBy: userId,
      pinnedAt: new Date().toISOString(),
    }

    // Update space with pinned content
    const { data, error } = await supabase
      .from('spaces')
      .update({
        pinned_content: pinnedContent,
        pinned_at: pinnedContent.pinnedAt,
        pinned_by: userId,
      })
      .eq('id', spaceId)
      .select()
      .single()

    if (error) {
      console.error('Error pinning content:', error)
      return NextResponse.json(
        { error: 'Failed to pin content' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      pinnedContent,
      message: 'Content pinned successfully',
    })
  } catch (error) {
    console.error('Error in POST /api/spaces/[id]/pin:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Unpin content from a space
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: spaceId } = await params

    // Update space to remove pinned content
    const { data, error } = await supabase
      .from('spaces')
      .update({
        pinned_content: null,
        pinned_at: null,
        pinned_by: null,
      })
      .eq('id', spaceId)
      .select()
      .single()

    if (error) {
      console.error('Error unpinning content:', error)
      return NextResponse.json(
        { error: 'Failed to unpin content' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Content unpinned successfully',
    })
  } catch (error) {
    console.error('Error in DELETE /api/spaces/[id]/pin:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
