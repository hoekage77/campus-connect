/**
 * Admin API: Import database
 * POST /api/admin/database/import
 */

import { NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/data/admin-auth"
import { localDB } from "@/lib/data/db"

async function handler(request: NextRequest) {
  try {
    const body = await request.json()
    const { data } = body
    
    if (!data) {
      return NextResponse.json(
        { error: "No data provided" },
        { status: 400 }
      )
    }
    
    // data should be a JSON string or object
    const jsonString = typeof data === "string" ? data : JSON.stringify(data)
    
    const success = localDB.importFromFile(jsonString)
    
    if (!success) {
      return NextResponse.json(
        { error: "Failed to import database" },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      imported: true,
    })
  } catch (error) {
    console.error("[Admin API] Import error:", error)
    return NextResponse.json(
      { error: "Failed to import database" },
      { status: 500 }
    )
  }
}

export const POST = withAdminAuth(handler)
