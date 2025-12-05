"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { getChatRooms } from "@/lib/api-client"

export default function OpenSquadChatRedirect() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const groupId = (params?.id as string) || ""
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const go = async () => {
      if (!groupId) return
      try {
        const rooms = await getChatRooms(groupId)
        if (rooms && rooms.length > 0) {
          // Prefer a room named 'general' if present
          const preferred = rooms.find((r) => r.name?.toLowerCase() === "general") || rooms[0]
          router.replace(`/groups/${groupId}/chat/${preferred.id}`)
          return
        }
        // No rooms exist – fall back to the squad page
        router.replace(`/groups/${groupId}`)
      } catch (e) {
        toast({ title: "Unable to open chat", description: e instanceof Error ? e.message : "Failed to load rooms", variant: "destructive" })
        router.replace(`/groups/${groupId}`)
      } finally {
        setLoading(false)
      }
    }
    go()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          {loading ? "Opening chat room…" : "Redirecting…"}
        </CardContent>
      </Card>
    </div>
  )
}
