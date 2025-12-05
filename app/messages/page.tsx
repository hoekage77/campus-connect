"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Search, Users, ArrowRight, User, Clock, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useAllGroups, useChatRooms } from "@/hooks/use-queries"
import Link from "next/link"
import { EncryptedChatInterface } from "@/components/chat/encrypted-chat-interface"
import { cn } from "@/lib/utils"

type ConversationType = {
  id: string
  type: "direct" | "squad"
  title: string
  avatar?: string
  lastMessage?: string
  timestamp?: string
  unreadCount?: number
  memberCount?: number
  topics?: string[]
}

export default function MessagesPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()
  const { data: allGroups, isLoading: groupsLoading } = useAllGroups()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedConversation, setSelectedConversation] = useState<ConversationType | null>(null)
  const [lastConversationLoaded, setLastConversationLoaded] = useState(false)
  
  // Fetch rooms for selected squad
  const { data: squadRooms, isLoading: roomsLoading } = useChatRooms(
    selectedConversation?.type === 'squad' ? selectedConversation.id : null
  )

  // Determine active room ID
  const activeRoomId = squadRooms?.find(r => r.name.toLowerCase() === 'general')?.id || squadRooms?.[0]?.id

  // Save last conversation to localStorage when it changes
  useEffect(() => {
    if (selectedConversation) {
      localStorage.setItem('lastConversation', JSON.stringify(selectedConversation))
    }
  }, [selectedConversation])

  // Restore last conversation on mount (after groups are loaded)
  useEffect(() => {
    if (!lastConversationLoaded && allGroups && !groupsLoading && user) {
      const saved = localStorage.getItem('lastConversation')
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as ConversationType
          // Verify the conversation still exists (user is still a member)
          const userSquadIds = user.squads || []
          if (parsed.type === 'squad') {
            const stillMember = allGroups.some(g => 
              g.id === parsed.id && (userSquadIds.includes(g.id) || g.ownerId === user.id)
            )
            if (stillMember) {
              setSelectedConversation(parsed)
            }
          } else {
            setSelectedConversation(parsed)
          }
        } catch {}
      }
      setLastConversationLoaded(true)
    }
  }, [allGroups, groupsLoading, user, lastConversationLoaded])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading || groupsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  // Filter user's squads
  const userSquads = (allGroups || []).filter((group) =>
    user.squads?.includes(group.id) || group.ownerId === user.id
  )

  // Create squad conversations
  const squadConversations: ConversationType[] = userSquads.map((squad) => ({
    id: squad.id,
    type: "squad",
    title: squad.title,
    avatar: squad.avatar,
    memberCount: squad.memberCount,
    topics: squad.topics,
    lastMessage: "Squad chat room available",
    timestamp: "Now",
    unreadCount: 0,
  }))

  // Placeholder for direct conversations
  const directConversations: ConversationType[] = []

  // Combine all conversations
  const allConversations = [...directConversations, ...squadConversations]

  // Filter conversations based on search
  const filteredConversations = searchQuery
    ? allConversations.filter((conv) =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allConversations

  // Filter by tab
  const displayConversations =
    activeTab === "direct"
      ? filteredConversations.filter((c) => c.type === "direct")
      : activeTab === "squads"
      ? filteredConversations.filter((c) => c.type === "squad")
      : filteredConversations

  // Format timestamp
  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return ""
    return timestamp
  }

  return (
    <div className="h-screen bg-background overflow-hidden">
      <div className="h-full px-4 sm:px-6 lg:px-8 py-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          {/* Left Column: List */}
          <div className={cn(
            "lg:col-span-1 flex flex-col h-full min-h-0 lg:border-r lg:border-border/50 lg:pr-4",
            selectedConversation ? "hidden lg:flex" : "flex"
          )}>
            {/* Header */}
            <div className="flex-shrink-0 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Messages</h1>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="flex-shrink-0 mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/30"
                />
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-shrink-0 mb-3">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="direct">Direct</TabsTrigger>
                <TabsTrigger value="squads">Squads</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Conversations List */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent">
              {displayConversations.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                    {activeTab === "direct" ? (
                      <User className="w-6 h-6 text-muted-foreground" />
                    ) : (
                      <Users className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm font-medium mb-1">
                    {searchQuery
                      ? "No conversations found"
                      : activeTab === "direct"
                      ? "No direct messages"
                      : "No squads yet"}
                  </p>
                  {!searchQuery && activeTab !== "direct" && (
                    <Link href="/groups">
                      <Button variant="link" size="sm">Explore Squads</Button>
                    </Link>
                  )}
                </div>
              ) : (
                displayConversations.map((conversation) => (
                  <div 
                    key={conversation.id} 
                    onClick={() => setSelectedConversation(conversation)}
                    className={cn(
                      "group p-3 rounded-xl transition-colors cursor-pointer border border-transparent",
                      selectedConversation?.id === conversation.id 
                        ? "bg-accent border-border/50" 
                        : "hover:bg-accent/50 hover:border-border/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={conversation.avatar} alt={conversation.title} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold text-xs">
                            {conversation.title.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.type === "squad" && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-background flex items-center justify-center">
                            <Users className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-medium text-sm truncate">{conversation.title}</span>
                          {conversation.timestamp && (
                            <span className="text-[10px] text-muted-foreground">
                              {formatTimestamp(conversation.timestamp)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                            {conversation.lastMessage || "No messages yet"}
                          </p>
                          {conversation.unreadCount && conversation.unreadCount > 0 && (
                            <Badge variant="default" className="h-4 px-1 text-[10px]">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Chat Interface */}
          <div className={cn(
            "lg:col-span-2 h-full min-h-0 overflow-hidden",
            selectedConversation ? "block" : "hidden lg:block"
          )}>
            {selectedConversation ? (
              roomsLoading ? (
                <div className="h-full flex items-center justify-center bg-muted/5 rounded-2xl border border-border/50">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : activeRoomId ? (
                <EncryptedChatInterface 
                  roomId={activeRoomId}
                  groupId={selectedConversation.id}
                  title={selectedConversation.title}
                  subtitle={selectedConversation.type === 'squad' ? 'Squad Chat' : 'Direct Message'}
                  avatar={selectedConversation.avatar}
                  onBack={() => setSelectedConversation(null)}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-muted/5 rounded-2xl border border-border/50 p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <MessageSquare className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1">Chat unavailable</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Could not connect to the chat room for this squad.
                  </p>
                  <Button variant="outline" onClick={() => setSelectedConversation(null)}>
                    Go back
                  </Button>
                </div>
              )
            ) : (
              <div className="h-full flex items-center justify-center bg-muted/5 rounded-2xl border border-dashed border-border/50">
                <div className="text-center max-w-md p-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <MessageSquare className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Select a conversation</h2>
                  <p className="text-muted-foreground text-sm">
                    Choose a chat from the list to start messaging your squad or friends.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

