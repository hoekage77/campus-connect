/**
 * Admin API: Optimize database
 * POST /api/admin/database/optimize
 */

import { NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/data/admin-auth"
import { localDB } from "@/lib/data/db"

async function handler(request: NextRequest) {
  try {
    const beforeSize = localDB.getStorageInfo().used
    const success = localDB.optimize()
    const afterSize = localDB.getStorageInfo().used
    
    if (!success) {
      return NextResponse.json(
        { error: "Failed to optimize database" },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      savedBytes: beforeSize - afterSize,
      beforeSize,
      afterSize,
    })
  } catch (error) {
    console.error("[Admin API] Optimize error:", error)
    return NextResponse.json(
      { error: "Failed to optimize database" },
      { status: 500 }
    )
  }
}

export const POST = withAdminAuth(handler)
