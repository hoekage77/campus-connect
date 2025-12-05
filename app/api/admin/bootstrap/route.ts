/**
 * Bootstrap API: Create the first admin user if none exists yet
 * POST /api/admin/bootstrap
 * Body: {
 *   username: string,
 *   password: string,
 *   name?: string,
 *   email?: string
 * }
 *
 * Security: This endpoint only works if there are no admin users.
 * Once an admin exists, it returns 409 and does nothing.
 */

import { NextRequest, NextResponse } from "next/server"
import { dataStore } from "@/lib/data/store"

export async function POST(request: NextRequest) {
  try {
    const admins = dataStore.getAllUsers().filter((u) => u.role === "admin")
    if (admins.length > 0) {
      return NextResponse.json(
        { error: "Admin already exists" },
        { status: 409 }
      )
    }

    const { username, password, name, email } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: "username and password are required" },
        { status: 400 }
      )
    }

    const created = dataStore.createUser({
      username,
      password,
      name,
      email,
      role: "admin",
    })

    return NextResponse.json({ success: true, user: created })
  } catch (error) {
    console.error("[Bootstrap API] Error:", error)
    return NextResponse.json({ error: "Failed to bootstrap admin" }, { status: 500 })
  }
}
