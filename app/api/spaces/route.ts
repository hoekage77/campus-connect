import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseRepository } from '@/lib/supabase/repository'
import { SpaceService } from '@/services/SpaceService'
import { getUserIdFromRequest } from '@/lib/auth'
import { BaseSpaceConfig, SpaceType } from '@/types/spaces'

/**
 * GET /api/spaces
 * List spaces with optional filtering
 * Query params:
 *   - groupId: Filter by group
 *   - type: Filter by space type
 *   - privacy: Filter by privacy level (public, private, invite-only)
 *   - status: Filter by status (live, ended, scheduled)
 *   - limit: Results per page (default 20)
 *   - offset: Pagination offset (default 0)
 */
export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req as any)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const groupId = searchParams.get('groupId') || undefined
    const type = searchParams.get('type') as SpaceType | undefined
    const privacy = searchParams.get('privacy') || undefined
    const status = searchParams.get('status') || undefined
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const repo = getSupabaseRepository()
    let spaces = []

    // Apply filters
    if (type) {
      spaces = await repo.getSpacesByType(type, groupId)
    } else if (privacy === 'private') {
      if (!groupId) {
        return NextResponse.json(
          { error: 'groupId required for private spaces' },
          { status: 400 }
        )
      }
      spaces = await repo.getPrivateSpaces(groupId)
    } else if (status === 'live') {
      spaces = await repo.getLiveSpaces()
    } else if (status === 'scheduled') {
      spaces = await repo.getScheduledSpaces(groupId)
    } else if (groupId) {
      spaces = await repo.getGroupSpaces(groupId)
    } else {
      spaces = await repo.getPublicSpaces()
    }

    // Filter by privacy if specified
    if (privacy) {
      spaces = spaces.filter(s => s.privacy === privacy)
    }

    // Pagination
    const total = spaces.length
    spaces = spaces.slice(offset, offset + limit)

    return NextResponse.json({
      data: spaces,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
      },
    })
  } catch (error: any) {
    console.error('Error fetching spaces:', error)
    return NextResponse.json(
      { error: 'Failed to fetch spaces' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/spaces
 * Create a new space
 * Body:
 *   - groupId: string (required)
 *   - title: string (required)
 *   - description: string (optional)
 *   - type: SpaceType (required)
 *   - privacy: 'public' | 'private' | 'invite-only' (default: 'public')
 *   - maxParticipants: number (default: 50)
 *   - audioEnabled: boolean (default: true)
 *   - videoEnabled: boolean (default: false)
 *   - screenShareEnabled: boolean (default: true)
 *   - [type-specific config...]: varies by type
 */
export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req as any)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      groupId,
      title,
      description,
      type,
      privacy = 'public',
      maxParticipants = 50,
      audioEnabled = true,
      videoEnabled = false,
      screenShareEnabled = true,
      ...typeSpecificConfig
    } = body

    // Validate required fields
    if (!groupId || !title || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: groupId, title, type' },
        { status: 400 }
      )
    }

    // Validate space type
    const validTypes: SpaceType[] = [
      'study-session',
      'office-hours',
      'social-hangout',
      'lecture',
      'project-collab',
      'mentorship',
      'debate',
      'peer-review',
    ]

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid space type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Check user is member of group
    const repo = getSupabaseRepository()
    const members = await repo.getGroupMembers(groupId)
    const isMember = members.some(m => m.userId === userId)

    if (!isMember) {
      return NextResponse.json(
        { error: 'You must be a member of the group to create a space' },
        { status: 403 }
      )
    }

    // Build config object
    const config: BaseSpaceConfig = {
      groupId,
      hostId: userId,
      title,
      description,
      type,
      privacy,
      maxParticipants,
      audioEnabled,
      videoEnabled,
      screenShareEnabled,
      ...typeSpecificConfig,
    }

    // Validate and create space
    const space = await SpaceService.createSpace(config)

    if (!space) {
      return NextResponse.json(
        { error: 'Failed to create space' },
        { status: 500 }
      )
    }

    // Log activity
    await repo.logSpaceActivity(space.id, userId, 'space_created', {
      type,
      privacy,
      title,
    })

    return NextResponse.json(
      {
        data: space,
        message: 'Space created successfully',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating space:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create space' },
      { status: 500 }
    )
  }
}
