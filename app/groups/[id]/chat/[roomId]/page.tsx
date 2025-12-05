"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { EncryptedChatInterface } from '@/components/chat/encrypted-chat-interface'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function ChatRoomPage() {
  const params = useParams()
  const groupId = params?.id as string
  const roomId = params?.roomId as string
  
  const [roomInfo, setRoomInfo] = useState<{ name: string; topic?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadRoom() {
      try {
        const res = await fetch(`/api/chat/rooms/${roomId}`)
        if (res.ok) {
          const data = await res.json()
          setRoomInfo({ name: data.name, topic: data.topic })
        }
      } catch (err) {
        console.error('Failed to load room:', err)
      } finally {
        setLoading(false)
      }
    }

    if (roomId) {
      loadRoom()
    }
  }, [roomId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link 
          href={`/groups/${groupId}`} 
          className="inline-flex items-center gap-2 mb-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Squad
        </Link>

        <div className="h-[calc(100vh-120px)]">
          <EncryptedChatInterface
            roomId={roomId}
            groupId={groupId}
            title={roomInfo?.name || 'Chat'}
            subtitle={roomInfo?.topic}
            onBack={() => window.history.back()}
          />
        </div>
      </div>
    </div>
  )
}
