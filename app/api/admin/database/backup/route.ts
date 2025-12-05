/**
 * Admin API: Create backup
 * POST /api/admin/database/backup
 */

import { NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/data/admin-auth"
import { localDB } from "@/lib/data/db"

async function handler(request: NextRequest) {
  try {
    const backup = localDB.createBackup()
    
    if (!backup) {
      return NextResponse.json(
        { error: "Failed to create backup" },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      timestamp: backup.timestamp,
      checksum: backup.checksum,
    })
  } catch (error) {
    console.error("[Admin API] Backup error:", error)
    return NextResponse.json(
      { error: "Failed to create backup" },
      { status: 500 }
    )
  }
}

export const POST = withAdminAuth(handler)
