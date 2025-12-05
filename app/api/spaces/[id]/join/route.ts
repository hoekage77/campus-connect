import { NextRequest, NextResponse } from "next/server"
import { getSupabaseRepository } from "@/lib/supabase/repository"
import { getUserIdFromRequest } from "@/lib/auth"
import { createDailyToken } from "@/lib/daily"

// POST /api/spaces/{id}/join - Join a space
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: spaceId } = await context.params
    const currentUserId = getUserIdFromRequest(request)
    
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const repo = getSupabaseRepository()

    const space = await repo.getSpace(spaceId)
    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 })
    }

    if (space.status !== "live") {
      return NextResponse.json({ error: "Space is not live" }, { status: 400 })
    }

    // Check if user is a group member
    const members = await repo.getGroupMembers(space.groupId)
    const isMember = members.some(m => m.userId === currentUserId)
    
    if (!isMember && (space.privacy === "members-only" || space.privacy === "invite-only")) {
      return NextResponse.json({ error: "Not a group member" }, { status: 403 })
    }

    // Parse optional role from body
    const body = await request.json().catch(() => ({}))
    const role = body.role || "listener"

  // Join the space
    const participant = await repo.joinSpace(spaceId, currentUserId, role)
    
    if (!participant) {
      return NextResponse.json(
        { error: "Failed to join space. Space may be full or you're already a participant." },
        { status: 400 }
      )
    }

    // Get updated space with participant info
    const updatedSpace = await repo.getSpace(spaceId)
    const participants = await repo.getActiveSpaceParticipants(spaceId)

    const currentUser = await repo.getUser(currentUserId)
    const roomName = space.roomName || (() => {
      if (!space.roomUrl) return undefined
      try {
        const parsed = new URL(space.roomUrl)
        return parsed.pathname.replace(/^\//, "") || undefined
      } catch (error) {
        console.warn("[Spaces API] Failed to parse room name from URL", error)
        return undefined
      }
    })()

    let dailyToken: string | undefined
    if (roomName) {
      try {
        const tokenResponse = await createDailyToken(roomName, {
          userId: currentUserId,
          userName: currentUser?.name || currentUser?.username,
          isOwner: participant.role === "host" || participant.role === "co-host",
        })
        dailyToken = tokenResponse.token
      } catch (dailyError) {
        console.error("[Spaces API] Failed to issue Daily token", dailyError)
      }
    }

    return NextResponse.json({
      space: updatedSpace,
      participant,
      participantCount: participants.length,
      access: roomName && space.roomUrl ? {
        roomName,
        roomUrl: space.roomUrl,
        token: dailyToken,
      } : undefined,
    }, { status: 201 })
  } catch (error) {
    console.error("[Spaces API] Error joining space:", error)
    return NextResponse.json(
      { error: "Failed to join space" },
      { status: 500 }
    )
  }
}
