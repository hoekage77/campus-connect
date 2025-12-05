import { NextRequest, NextResponse } from "next/server"
import { getSupabaseRepository } from "@/lib/supabase/repository"
import { getUserIdFromRequest } from "@/lib/auth"

// POST /api/spaces/{id}/leave - Leave a space
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

    // Leave the space
    const success = await repo.leaveSpace(spaceId, currentUserId)

    if (!success) {
      return NextResponse.json(
        { error: "Failed to leave space. You may not be a participant." },
        { status: 400 }
      )
    }

    // Get updated participant count
    const participants = await repo.getActiveSpaceParticipants(spaceId)

    return NextResponse.json({
      success: true,
      participantCount: participants.length,
    })
  } catch (error) {
    console.error("[Spaces API] Error leaving space:", error)
    return NextResponse.json(
      { error: "Failed to leave space" },
      { status: 500 }
    )
  }
}
