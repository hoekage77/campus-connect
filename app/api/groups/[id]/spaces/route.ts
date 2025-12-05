import { NextRequest, NextResponse } from "next/server"
import { getSupabaseRepository } from "@/lib/supabase/repository"
import { createSpaceSchema } from "@/lib/validations"
import { getUserIdFromRequest } from "@/lib/auth"
import { NotificationService } from "@/services"
import { createDailyRoom } from "@/lib/daily"

// GET /api/groups/{id}/spaces - List active spaces in a group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const { id: groupId } = await params
  if (process.env.NODE_ENV === 'development') console.debug('[Spaces API] Request headers:', Object.fromEntries(request.headers.entries()))
  const resolvedUserId = getUserIdFromRequest(request)
  if (process.env.NODE_ENV === 'development') console.debug('[Spaces API] Resolved userId:', resolvedUserId)
    console.log('[Spaces API] Getting spaces for group:', groupId)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") as "live" | "ended" | "scheduled" | null

    const repo = getSupabaseRepository()

    // Check if group exists
    const group = await repo.getGroup(groupId)
    console.log('[Spaces API] Group found:', !!group, group?.title)
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Get spaces
    const spaces = status
      ? await repo.getGroupSpaces(groupId, status)
      : await repo.getGroupSpaces(groupId)

    // Enrich with participant counts
    const enrichedSpaces = await Promise.all(
      spaces.map(async (space) => ({
        ...space,
        activeParticipantCount: (await repo.getActiveSpaceParticipants(space.id)).length,
      }))
    )

    return NextResponse.json(enrichedSpaces)
  } catch (error) {
    console.error("[Spaces API] Error listing spaces:", error)
    return NextResponse.json(
      { error: "Failed to list spaces" },
      { status: 500 }
    )
  }
}

// POST /api/groups/{id}/spaces - Create and start a new space
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
    const currentUserId = getUserIdFromRequest(request)
    
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const repo = getSupabaseRepository()

    const currentUser = await repo.getUser(currentUserId)
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if group exists and user is a member
    const group = await repo.getGroup(groupId)
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    const members = await repo.getGroupMembers(groupId)
    const isMember = members.some(m => m.userId === currentUserId)
    if (!isMember) {
      return NextResponse.json({ error: "Not a group member" }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createSpaceSchema.parse(body)

    const fallbackSlug = `${groupId}-${Date.now()}`
    const room = await createDailyRoom({
      fallbackName: fallbackSlug,
      maxParticipants: validatedData.maxParticipants,
      enableVideo: validatedData.videoEnabled,
      enableScreenShare: validatedData.screenShareEnabled,
    })

    // Create space
    const space = await repo.createSpace({
      groupId,
      hostId: currentUserId,
      title: validatedData.title,
      description: validatedData.description,
      type: validatedData.type,
      privacy: validatedData.privacy,
      maxParticipants: validatedData.maxParticipants,
      audioEnabled: validatedData.audioEnabled,
      videoEnabled: validatedData.videoEnabled,
      screenShareEnabled: validatedData.screenShareEnabled,
      roomName: room.name,
      roomUrl: room.url,
    })

    // Create notification for group members
    const groupMembers = await repo.getGroupMembers(groupId)
    for (const member of groupMembers) {
      if (member.userId !== currentUserId) {
        await NotificationService.createNotification(
          member.userId,
          "message",
          `${currentUser.name || currentUser.username} started a space`,
          `${space?.title} is now live in ${group.title}`,
          `/groups/${groupId}/spaces/${space?.id}`,
          space?.id
        )
      }
    }    return NextResponse.json(space, { status: 201 })
  } catch (error) {
    console.error("[Spaces API] Error creating space:", error)
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data", details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create space" },
      { status: 500 }
    )
  }
}
