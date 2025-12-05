/**
 * Admin API: Get collection data
 * GET /api/admin/collections/[name]
 */

import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/data/admin-auth"
import { localDB } from "@/lib/data/db"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ name: string }> }
) {
  // Check admin auth
  const auth = await checkAdminAuth(request)
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error || "Unauthorized" },
      { status: auth.error === "Admin access required" ? 403 : 401 }
    )
  }

  try {
    const { name } = await context.params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    
    const data = localDB.getRawData()
    const collection = data[name]
    
    if (!collection) {
      return NextResponse.json(
        { error: `Collection '${name}' not found` },
        { status: 404 }
      )
    }
    
    // Convert Map entries to array if needed
    let items: any[] = []
    if (Array.isArray(collection)) {
      items = collection
      // Handle Map entries format: [[key, value], [key, value]]
      if (collection.length > 0 && Array.isArray(collection[0]) && collection[0].length === 2) {
        items = collection.map((entry: any) => {
          return { id: entry[0], ...entry[1] }
        })
      }
    } else {
      items = []
    }
    
    // Pagination
    const total = items.length
    const pages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const end = start + limit
    const paginatedItems = items.slice(start, end)
    
    return NextResponse.json({
      collection: name,
      items: paginatedItems,
      total,
      page,
      pages,
      limit,
    })
  } catch (error) {
    console.error("[Admin API] Collection error:", error)
    return NextResponse.json(
      { error: "Failed to get collection" },
      { status: 500 }
    )
  }
}
