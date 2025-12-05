import { NextResponse } from "next/server"
import { dataStore } from "@/lib/data/store"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const identifier = typeof body.identifier === "string" ? body.identifier.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (!identifier || !password) {
      return NextResponse.json({ error: "Identifier and password are required" }, { status: 400 })
    }

    const user = identifier.includes("@")
      ? dataStore.getUserByEmail(identifier.toLowerCase())
      : dataStore.getUserByStudentId(identifier.toUpperCase())

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Enforce admin role (with first-admin bootstrap convenience)
    const hasAdmin = dataStore.getAllUsers().some((u) => u.role === 'admin')
    if (!hasAdmin) {
      // If no admin exists yet, promote this authenticated user
      dataStore.updateUser(user.id, { role: 'admin' } as any)
    } else if (user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const isValid = dataStore.verifyUserPassword(user.id, password)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
    })
  } catch (e) {
    console.error("[Admin Login] Error:", e)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
