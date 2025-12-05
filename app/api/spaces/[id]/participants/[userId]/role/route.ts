import { NextRequest, NextResponse } from "next/server"
import { updateSpaceParticipantRoleSchema } from "@/lib/validations"
import { getUserIdFromRequest } from "@/lib/auth"
import { getSupabaseRepository } from "@/lib/supabase/repository"

// PATCH /api/spaces/{id}/participants/{userId}/role - Update participant role
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id: spaceId, userId } = await context.params
    const currentUserId = getUserIdFromRequest(request)

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const repo = getSupabaseRepository()
    const space = await repo.getSpace(spaceId)
    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 })
    }

    // Only host or co-hosts can update roles
    if (space.hostId !== currentUserId && !space.coHostIds.includes(currentUserId)) {
      return NextResponse.json({ error: "Only hosts can update participant roles" }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateSpaceParticipantRoleSchema.parse(body)

    // Update participant role
    const updated = await repo.updateSpaceParticipantRole(spaceId, userId, validatedData.role)

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update participant role. User may not be in the space." },
        { status: 400 }
      )
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[Spaces API] Error updating participant role:", error)

    if (error instanceof Error && (error as any).name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data", details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update participant role" },
      { status: 500 }
    )
  }
}
