import { NextRequest, NextResponse } from "next/server"
import { getSupabaseRepository } from "@/lib/supabase/repository"
import { updateSpaceSchema } from "@/lib/validations"
import { getUserIdFromRequest } from "@/lib/auth"
import { NotificationService } from "@/services"
import { deleteDailyRoom } from "@/lib/daily"

// GET /api/spaces/{id} - Get space details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: spaceId } = await context.params
    const repo = getSupabaseRepository()

    const space = await repo.getSpace(spaceId)
    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 })
    }

    // Get participants
    const participants = await repo.getSpaceParticipants(spaceId)
    
    // Enrich participant data with user info
    const enrichedParticipants = await Promise.all(
      participants.map(async (p) => {
        const user = await repo.getUser(p.userId)
        return {
          ...p,
          user: user ? {
            id: user.id,
            username: user.username,
            name: user.name,
            avatar: user.avatar,
          } : null,
        }
      })
    )

    return NextResponse.json({
      ...space,
      participants: enrichedParticipants,
    })
  } catch (error) {
    console.error("[Spaces API] Error getting space:", error)
    return NextResponse.json(
      { error: "Failed to get space" },
      { status: 500 }
    )
  }
}

// PATCH /api/spaces/{id} - Update space
export async function PATCH(
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

    // Only host can update space settings
    if (space.hostId !== currentUserId) {
      return NextResponse.json({ error: "Only host can update space settings" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateSpaceSchema.parse(body)

    const updated = await repo.updateSpace(spaceId, validatedData)
    if (!updated) {
      return NextResponse.json({ error: "Failed to update space" }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[Spaces API] Error updating space:", error)
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data", details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update space" },
      { status: 500 }
    )
  }
}

// DELETE /api/spaces/{id} - Delete space
export async function DELETE(
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

    // Only host can end the space
    if (space.hostId !== currentUserId) {
      return NextResponse.json({ error: "Only the host can end the space" }, { status: 403 })
    }

    const ended = await repo.endSpace(spaceId)
    if (!ended) {
      return NextResponse.json({ error: "Failed to end space" }, { status: 500 })
    }

    try {
      await deleteDailyRoom(space.roomName)
    } catch (cleanupError) {
      console.warn("[Spaces API] Failed to delete Daily room", cleanupError)
    }

    // Notify participants
    const participants = await repo.getSpaceParticipants(spaceId)
    for (const participant of participants) {
      if (participant.userId !== currentUserId) {
        await NotificationService.createNotification(
          participant.userId,
          "message",
          "Space has ended",
          `${space.title} has ended`,
          undefined,
          space.id
        )
      }
    }

    return NextResponse.json(ended)
  } catch (error) {
    console.error("[Spaces API] Error ending space:", error)
    return NextResponse.json(
      { error: "Failed to end space" },
      { status: 500 }
    )
  }
}
