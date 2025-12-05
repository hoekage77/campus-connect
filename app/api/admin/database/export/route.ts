/**
 * Admin API: Export database
 * GET /api/admin/database/export
 */

import { NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/data/admin-auth"
import { localDB } from "@/lib/data/db"

async function handler(request: NextRequest) {
  try {
    const jsonData = localDB.exportToFile()
    const timestamp = new Date().toISOString().split("T")[0]
    const filename = `campusconnect-backup-${timestamp}.json`
    
    return new NextResponse(jsonData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("[Admin API] Export error:", error)
    return NextResponse.json(
      { error: "Failed to export database" },
      { status: 500 }
    )
  }
}

export const GET = withAdminAuth(handler)
