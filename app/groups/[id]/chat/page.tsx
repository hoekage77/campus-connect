"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useChatRooms } from "@/hooks/use-queries"
import { Loader2 } from "lucide-react"

export default function GroupChatRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params?.id as string

  const { data: rooms, isLoading } = useChatRooms(groupId)

  useEffect(() => {
    if (!isLoading && rooms && rooms.length > 0) {
      // Find 'general' room or default to first
      const defaultRoom = rooms.find(r => r.name.toLowerCase() === 'general') || rooms[0]
      router.replace(`/groups/${groupId}/chat/${defaultRoom.id}`)
    } else if (!isLoading && rooms && rooms.length === 0) {
      // No rooms exist, redirect back to group page or handle error
      router.replace(`/groups/${groupId}`)
    }
  }, [rooms, isLoading, groupId, router])

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Entering chat room...</p>
    </div>
  )
}
