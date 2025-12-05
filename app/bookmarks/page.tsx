"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bookmark, Search, MessageSquare, Users, ArrowRight, Trash2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useAllGroups } from "@/hooks/use-queries"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function BookmarksPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()
  const { data: allGroups, isLoading: groupsLoading } = useAllGroups()
  const [searchQuery, setSearchQuery] = useState("")

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
          <p className="text-muted-foreground">Loading bookmarks...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  // For now, bookmarked squads = user's squads (can extend to save specific messages/posts later)
  const bookmarkedSquads = (allGroups || []).filter(
    (group) => user.squads?.includes(group.id) || group.ownerId === user.id
  )

  const filteredSquads = searchQuery
    ? bookmarkedSquads.filter((squad) =>
        squad.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : bookmarkedSquads

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <Bookmark className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Bookmarks</h1>
              <p className="text-muted-foreground">Your saved squads and content</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Coming soon:</strong> Bookmark individual messages, posts, and events for quick access!
            </p>
          </CardContent>
        </Card>

        {/* Bookmarked Squads */}
        {filteredSquads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Bookmark className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "No bookmarks found" : "No bookmarks yet"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? "Try a different search term"
                  : "Join squads to see them here as bookmarks"}
              </p>
              {!searchQuery && (
                <Link href="/groups">
                  <Button>Explore Squads</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredSquads.map((squad) => (
              <Card
                key={squad.id}
                className="hover:border-primary/50 transition-colors"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={squad.avatar} alt={squad.title} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold">
                          {squad.title.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{squad.title}</CardTitle>
                        <CardDescription className="text-sm truncate">
                          {squad.memberCount} {squad.memberCount === 1 ? "member" : "members"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/groups/${squad.id}`}>
                        <Button variant="ghost" size="sm" className="gap-2">
                          Open
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                {squad.topics && squad.topics.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-1.5">
                      {squad.topics.slice(0, 3).map((topic) => (
                        <Badge key={topic} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                      {squad.topics.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{squad.topics.length - 3}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
