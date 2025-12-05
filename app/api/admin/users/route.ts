/**
 * Admin API: Create a new user (supports creating admin users)
 * POST /api/admin/users
 * Body: {
 *   username: string,
 *   password: string,
 *   name?: string,
 *   email?: string,
 *   studentId?: string,
 *   bio?: string,
 *   avatar?: string,
 *   major?: string,
 *   year?: string,
 *   topics?: string[],
 *   squads?: string[],
 *   role?: "admin" | "user"
 * }
 */

import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/data/admin-auth"
import { dataStore } from "@/lib/data/store"

export async function POST(request: NextRequest) {
  const auth = await checkAdminAuth(request)
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error || "Unauthorized" },
      { status: auth.error === "Admin access required" ? 403 : 401 }
    )
  }

  try {
    const body = await request.json()
    const {
      username,
      password,
      name,
      email,
      studentId,
      bio,
      avatar,
      major,
      year,
      topics,
      squads,
      role,
    } = body || {}

    if (!username || !password) {
      return NextResponse.json(
        { error: "username and password are required" },
        { status: 400 }
      )
    }

    // Prevent duplicates
    if (email && dataStore.getUserByEmail(email)) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }

    const created = dataStore.createUser({
      username,
      password,
      name,
      email,
      studentId,
      bio,
      avatar,
      major,
      year,
      topics,
      squads,
      role: role === "admin" ? "admin" : "user",
    })

    return NextResponse.json({ success: true, user: created })
  } catch (error) {
    console.error("[Admin API] Create user error:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
