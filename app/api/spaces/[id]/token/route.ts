import { NextRequest, NextResponse } from "next/server"
import { getSupabaseRepository } from "@/lib/supabase/repository"
import { getUserIdFromRequest } from "@/lib/auth"
import { createDailyToken } from "@/lib/daily"

// POST /api/spaces/{id}/token - Mint a fresh Daily meeting token for active participant
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

    // Verify user is an active participant
    const participants = await repo.getActiveSpaceParticipants(spaceId)
    const participant = participants.find(p => p.userId === currentUserId)
    if (!participant) {
      return NextResponse.json({ error: "Not a participant in this space" }, { status: 403 })
    }

    const roomName = space.roomName || (() => {
      if (!space.roomUrl) return undefined
      try {
        const parsed = new URL(space.roomUrl)
        return parsed.pathname.replace(/^\//, "") || undefined
      } catch {
        return undefined
      }
    })()

    if (!roomName || !space.roomUrl) {
      return NextResponse.json({ error: "Space has no associated call room" }, { status: 400 })
    }

    const tokenResponse = await createDailyToken(roomName, {
      userId: currentUserId,
      isOwner: participant.role === "host" || participant.role === "co-host",
    })

    return NextResponse.json({
      access: {
        roomName,
        roomUrl: space.roomUrl,
        token: tokenResponse.token,
      },
    })
  } catch (error) {
    console.error("[Spaces API] Error minting token:", error)
    return NextResponse.json(
      { error: "Failed to mint token" },
      { status: 500 }
    )
  }
}
