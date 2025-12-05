/**
 * Admin middleware for protecting admin routes
 */

import { NextRequest, NextResponse } from "next/server"
import { dataStore } from "./store"

export type AuthResult = {
  authorized: boolean
  userId?: string
  isAdmin?: boolean
  error?: string
}

/**
 * Check if user is authenticated and is an admin
 */
export async function checkAdminAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Get user ID from header (set by auth middleware)
    const userId = request.headers.get("x-user-id")
    
    if (!userId) {
      return {
        authorized: false,
        error: "Not authenticated",
      }
    }

    // Get user from store
    const user = dataStore.getUser(userId)
    
    if (!user) {
      return {
        authorized: false,
        error: "User not found",
      }
    }

    // Check if user is admin via formal role
    const isAdmin = user.role === "admin"

    if (!isAdmin) {
      return {
        authorized: false,
        userId: user.id,
        isAdmin: false,
        error: "Admin access required",
      }
    }

    return {
      authorized: true,
      userId: user.id,
      isAdmin: true,
    }
  } catch (error) {
    console.error("[Admin Auth] Error:", error)
    return {
      authorized: false,
      error: "Authentication failed",
    }
  }
}

/**
 * Wrapper for admin route handlers
 */
export function withAdminAuth(
  handler: (request: NextRequest, auth: AuthResult) => Promise<Response>
) {
  return async (request: NextRequest) => {
    const auth = await checkAdminAuth(request)
    
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || "Unauthorized" },
        { status: auth.error === "Admin access required" ? 403 : 401 }
      )
    }

    return handler(request, auth)
  }
}

/**
 * Get user ID from request headers
 */
export function getUserIdFromRequest(request: NextRequest | Request): string | null {
  if (request instanceof NextRequest) {
    return request.headers.get("x-user-id")
  }
  return request.headers.get("x-user-id")
}
