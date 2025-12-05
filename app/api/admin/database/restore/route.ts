/**
 * Admin API: Restore from backup
 * POST /api/admin/database/restore
 */

import { NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/data/admin-auth"
import { localDB } from "@/lib/data/db"

async function handler(request: NextRequest) {
  try {
    const success = localDB.restoreFromBackup()
    
    if (!success) {
      return NextResponse.json(
        { error: "Failed to restore from backup" },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      restored: true,
    })
  } catch (error) {
    console.error("[Admin API] Restore error:", error)
    return NextResponse.json(
      { error: "Failed to restore from backup" },
      { status: 500 }
    )
  }
}

export const POST = withAdminAuth(handler)
