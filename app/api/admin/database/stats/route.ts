/**
 * Admin API: Get database statistics
 * GET /api/admin/database/stats
 */

import { NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/data/admin-auth"
import { localDB } from "@/lib/data/db"

async function handler(request: NextRequest) {
  try {
    const stats = localDB.getStats()
    const storageInfo = localDB.getStorageInfo()
    
    return NextResponse.json({
      ...stats,
      storage: storageInfo,
    })
  } catch (error) {
    console.error("[Admin API] Stats error:", error)
    return NextResponse.json(
      { error: "Failed to get statistics" },
      { status: 500 }
    )
  }
}

export const GET = withAdminAuth(handler)
