// POST /api/groups/[id]/join - Join a group

import { NextResponse } from "next/server"
export const runtime = 'nodejs'
import { getSupabaseRepository } from "@/lib/supabase/repository"
import { NotificationService } from "@/services"
import { getUserIdFromRequest } from "@/lib/auth"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    
    // Parse body first (can only be done once)
    let body: any = {}
    try {
      const text = await request.text()
      console.log('[Join] Raw request body:', text)
      if (text) {
        body = JSON.parse(text)
        console.log('[Join] Parsed body:', body)
      }
    } catch (e) {
      console.log('[Join] Failed to parse body:', e)
    }
    
    // Try to get userId from headers first
    let userId: string | null = getUserIdFromRequest(request)
    console.log('[Join] userId from headers:', userId)
    
    // If header userId is invalid, use body
    if (!userId || userId === 'undefined' || userId === 'null') {
      userId = body.userId || null
      console.log('[Join] userId from body:', userId)
    }

    if (!userId || userId === 'undefined' || userId === 'null') {
      console.error('[Join] Invalid userId. Headers x-user-id:', request.headers.get('x-user-id'), 'Body userId:', body.userId)
      return NextResponse.json({ error: "Unauthorized - no valid user ID" }, { status: 401 })
    }
    
    console.log('[Join] Final userId:', userId, 'groupId:', id)

    const repo = getSupabaseRepository()
    const group = await repo.getGroup(id)
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Enforce privacy: block joining non-public groups via this endpoint
    if (group.privacy !== 'public') {
      return NextResponse.json(
        { error: 'This group requires an invitation' },
        { status: 403 }
      )
    }

    // Check if user is already a member
    const members = await repo.getGroupMembers(id)
    if (members.some((m) => m.userId === userId)) {
      return NextResponse.json({ error: "You are already a member of this group" }, { status: 400 })
    }

    // Add user to group
    await repo.addGroupMember(id, userId, 'member')

    // Create notifications: to the joining user and to owner (if different)
    try {
      await NotificationService.createNotification(
        userId,
        'message',
        'Joined Squad',
        `You joined "${group.title}"`,
        `/groups/${group.id}`,
        group.id
      )
      if (group.ownerId !== userId) {
        await NotificationService.createNotification(
          group.ownerId,
          'squad-invite',
          'New Member Joined',
          `A member joined "${group.title}"`,
          `/groups/${group.id}`,
          group.id
        )
      }
    } catch (notifyErr) {
      console.error('[Join Group] Failed to create join notifications', notifyErr)
    }

    // Return updated group data with enriched members
    const updatedMembers = await repo.getGroupMembers(id)
    const updatedGroup = await repo.getGroup(id)
    
    // Enrich members with user profile data
    const enrichedMembers = await Promise.all(updatedMembers.map(async (m) => {
      const user = await repo.getUser(m.userId)
      return {
        ...m,
        user: user ? { id: user.id, name: user.name, username: user.username, avatar: user.avatar } : null,
      }
    }))

    return NextResponse.json({
      ...updatedGroup,
      members: enrichedMembers,
    })
  } catch (error) {
    console.error("Error joining group:", error)
    return NextResponse.json({ error: "Failed to join group" }, { status: 500 })
  }
}
