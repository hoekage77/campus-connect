import { NextRequest, NextResponse } from "next/server"
import { getSupabaseRepository } from "@/lib/supabase/repository"
import { getUserIdFromRequest } from "@/lib/auth"
import { createDailyRoom, createDailyToken } from "@/lib/daily"

// POST /api/spaces/{id}/start - Start a scheduled space (make it live)
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

    // Only host can start the space
    if (space.hostId !== currentUserId) {
      return NextResponse.json({ error: "Only host can start the space" }, { status: 403 })
    }

    // Can only start scheduled spaces
    if (space.status === "live") {
      return NextResponse.json({ error: "Space is already live" }, { status: 400 })
    }

    if (space.status === "ended") {
      return NextResponse.json({ error: "Cannot start an ended space" }, { status: 400 })
    }

    // Create Daily.co room if not exists
    let roomName = space.roomName
    let roomUrl = space.roomUrl

    if (!roomName || !roomUrl) {
      try {
        const room = await createDailyRoom({
          fallbackName: `space-${spaceId.slice(0, 8)}`,
          name: `space-${spaceId.slice(0, 8)}`,
          enableScreenShare: space.screenShareEnabled ?? true,
          maxParticipants: space.maxParticipants,
          enableVideo: space.videoEnabled ?? true,
        })
        roomName = room.name
        roomUrl = room.url
      } catch (dailyError) {
        console.error("[Spaces API] Failed to create Daily room:", dailyError)
        // Continue without Daily room - can still update status
      }
    }

    // Update space to live status
    const updated = await repo.startSpace(spaceId, roomName, roomUrl)
    if (!updated) {
      return NextResponse.json({ error: "Failed to start space" }, { status: 500 })
    }

    // Get host token
    const currentUser = await repo.getUser(currentUserId)
    let dailyToken: string | undefined

    if (roomName) {
      try {
        const tokenResponse = await createDailyToken(roomName, {
          userId: currentUserId,
          userName: currentUser?.name || currentUser?.username,
          isOwner: true,
        })
        dailyToken = tokenResponse.token
      } catch (dailyError) {
        console.error("[Spaces API] Failed to create Daily token:", dailyError)
      }
    }

    return NextResponse.json({
      success: true,
      space: updated,
      roomUrl,
      token: dailyToken,
    })
  } catch (error) {
    console.error("[Spaces API] Error starting space:", error)
    return NextResponse.json(
      { error: "Failed to start space" },
      { status: 500 }
    )
  }
}
