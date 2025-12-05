/**
 * Admin API: Clear all data
 * POST /api/admin/database/clear
 */

import { NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/data/admin-auth"
import { localDB } from "@/lib/data/db"

async function handler(request: NextRequest) {
  try {
    // Create backup before clearing
    const backup = localDB.createBackup()
    
    if (!backup) {
      return NextResponse.json(
        { error: "Failed to create backup before clearing" },
        { status: 500 }
      )
    }
    
    const success = localDB.clearAll()
    
    if (!success) {
      return NextResponse.json(
        { error: "Failed to clear database" },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      cleared: true,
      backupCreated: true,
      backupTimestamp: backup.timestamp,
    })
  } catch (error) {
    console.error("[Admin API] Clear error:", error)
    return NextResponse.json(
      { error: "Failed to clear database" },
      { status: 500 }
    )
  }
}

export const POST = withAdminAuth(handler)
