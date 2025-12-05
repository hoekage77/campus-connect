/**
 * Admin API: Validate integrity
 * GET /api/admin/database/integrity
 */

import { NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/data/admin-auth"
import { localDB } from "@/lib/data/db"

async function handler(request: NextRequest) {
  try {
    const result = localDB.validateIntegrity()
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("[Admin API] Integrity check error:", error)
    return NextResponse.json(
      { error: "Failed to validate integrity" },
      { status: 500 }
    )
  }
}

export const GET = withAdminAuth(handler)
