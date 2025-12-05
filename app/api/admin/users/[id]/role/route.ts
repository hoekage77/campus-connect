/**
 * Admin API: Update user role
 * PATCH /api/admin/users/[id]/role
 * Body: { role: "admin" | "user" }
 */

import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/data/admin-auth"
import { dataStore } from "@/lib/data/store"

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Admin auth check (supports params signature)
  const auth = await checkAdminAuth(request)
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error || "Unauthorized" },
      { status: auth.error === "Admin access required" ? 403 : 401 }
    )
  }

  try {
    const { id } = await context.params
    const body = await request.json()
    const role = body?.role as "admin" | "user"

    if (role !== "admin" && role !== "user") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const user = dataStore.getUser(id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const updated = dataStore.updateUser(id, { role })
    if (!updated) {
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: updated })
  } catch (error) {
    console.error("[Admin API] Update role error:", error)
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 })
  }
}
