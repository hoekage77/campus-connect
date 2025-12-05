/**
 * Notifications API
 * 
 * Endpoints for creating and managing notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseRepository } from '@/lib/supabase/repository'
import { getUserIdFromRequest } from '@/lib/auth'

// POST /api/notifications - Create a notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, title, message, actionUrl, relatedId } = body

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, title, message' },
        { status: 400 }
      )
    }

    // Validate notification type (must match database check constraint)
    const validTypes = [
      'level-up', 
      'interest-match', 
      'event-reminder', 
      'squad-invite', 
      'message',
      'space-started',
      'space-invitation',
      'hand-raised'
    ]
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid notification type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const repo = getSupabaseRepository()
    const notification = await repo.createNotification({
      userId,
      type,
      title,
      message,
      actionUrl,
      relatedId: relatedId || undefined // Ensure null/empty string becomes undefined
    })

    return NextResponse.json({
      success: true,
      notification
    })
  } catch (error) {
    console.error('Error creating notification:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create notification', details: errorMessage },
      { status: 500 }
    )
  }
}

// GET /api/notifications - Get notifications for current user
export async function GET(request: NextRequest) {
  try {
    const currentUserId = getUserIdFromRequest(request)
    
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const repo = getSupabaseRepository()
    const notifications = await repo.getUserNotifications(currentUserId, limit)
    
    // Filter to unread only if requested
    const filtered = unreadOnly 
      ? notifications.filter(n => !n.read)
      : notifications

    return NextResponse.json({
      success: true,
      notifications: filtered,
      total: filtered.length
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
