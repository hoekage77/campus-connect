// POST /api/groups/[id]/chatrooms - Create a new chat room
import { NextResponse } from "next/server"
import { getSupabaseRepository } from "@/lib/supabase/repository"
import type { ChatRoom } from "@/types"
import { getUserIdFromRequest } from "@/lib/auth"

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const userId = getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const repo = getSupabaseRepository()
    const group = await repo.getGroup(id)
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Require at least membership (owner or member)
    const isOwner = group.ownerId === userId
    const members = await repo.getGroupMembers(id)
    const isMember = members.some(m => m.userId === userId)
    if (!isOwner && !isMember) {
      return NextResponse.json({ error: "Only squad members can create chat rooms" }, { status: 403 })
    }

    const body = await request.json()
    const { name, topic } = body

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Chat room name is required" }, { status: 400 })
    }

    // Generate unique ID for chat room
    const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create the chat room object
    const chatRoom: ChatRoom = {
      id: roomId,
      groupId: id,
      name: name.toLowerCase().trim(),
      topic: topic || "",
      members: [userId],
      messageCount: 0,
      createdAt: new Date(),
    }

    dataStore.createChatRoom(chatRoom)

    return NextResponse.json(chatRoom, { status: 201 })
  } catch (error) {
    console.error("Error creating chat room:", error)
    return NextResponse.json({ error: "Failed to create chat room" }, { status: 500 })
  }
}
