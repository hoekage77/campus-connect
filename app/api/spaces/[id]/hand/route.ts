import { NextRequest, NextResponse } from "next/server"
import { raiseHandSchema } from "@/lib/validations"
import { getUserIdFromRequest } from "@/lib/auth"
import { NotificationService } from "@/services"
import { getSupabaseRepository } from "@/lib/supabase/repository"

// Handler for raise/lower hand
async function handleHandRaise(
  request: NextRequest,
  spaceId: string
) {
  const currentUserId = getUserIdFromRequest(request)

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const repo = getSupabaseRepository()
  const space = await repo.getSpace(spaceId)
  if (!space) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 })
  }

  // Parse and validate request body
  const body = await request.json()
  const validatedData = raiseHandSchema.parse(body)

  // Update hand raised status (active participant)
  const updated = await repo.setParticipantHand(spaceId, currentUserId, validatedData.handRaised)

  if (!updated) {
    return NextResponse.json(
      { error: "Failed to update hand status. You may not be in the space." },
      { status: 400 }
    )
  }

  // If hand is raised, notify the host
  if (validatedData.handRaised) {
    try {
      const user = await repo.getUser(currentUserId)
      await NotificationService.createNotification(
        space.hostId,
        "message",
        "Hand raised in space",
        `${user?.name || user?.username || "Someone"} raised their hand in ${space.title}`,
        `/groups/${space.groupId}/spaces/${space.id}`,
        space.id
      )
    } catch (notifyErr) {
      console.warn("[Spaces API] Notification error:", notifyErr)
    }
  }

  return NextResponse.json({ success: true, handRaised: validatedData.handRaised })
}

// POST /api/spaces/{id}/hand - Raise/lower hand
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: spaceId } = await context.params
    return await handleHandRaise(request, spaceId)
  } catch (error) {
    console.error("[Spaces API] Error updating hand status:", error)

    if (error instanceof Error && (error as any).name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data", details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update hand status" },
      { status: 500 }
    )
  }
}

// PATCH /api/spaces/{id}/hand - Raise/lower hand (alias)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: spaceId } = await context.params
    return await handleHandRaise(request, spaceId)
  } catch (error) {
    console.error("[Spaces API] Error updating hand status:", error)

    if (error instanceof Error && (error as any).name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data", details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update hand status" },
      { status: 500 }
    )
  }
}
