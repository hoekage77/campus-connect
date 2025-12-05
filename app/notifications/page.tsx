"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Bell, MessageSquare, Users, Award, Sparkles, CalendarCheck, CheckCheck, Trash2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useUserNotifications, useAllGroups } from "@/hooks/use-queries"
import Link from "next/link"
import type { ReactNode } from "react"

export default function NotificationsPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()
  const { data: notifications, isLoading: notifsLoading } = useUserNotifications(user?.id || null, 100)
  const { data: allGroups } = useAllGroups()
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all")

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading || notifsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const unreadNotifs = (notifications || []).filter((n) => !n.read)
  const displayNotifs = activeTab === "unread" ? unreadNotifs : notifications || []

  const iconMap: Record<string, ReactNode> = {
    message: <MessageSquare className="w-5 h-5 text-blue-500" />,
    "event-reminder": <CalendarCheck className="w-5 h-5 text-emerald-500" />,
    "squad-invite": <Users className="w-5 h-5 text-amber-500" />,
    "level-up": <Award className="w-5 h-5 text-purple-500" />,
    "interest-match": <Sparkles className="w-5 h-5 text-pink-500" />,
  }

  const bubbleClass: Record<string, string> = {
    message: "from-blue-500/20 to-blue-500/5",
    "event-reminder": "from-emerald-500/20 to-emerald-500/5",
    "squad-invite": "from-amber-500/20 to-amber-500/5",
    "level-up": "from-purple-500/20 to-purple-500/5",
    "interest-match": "from-pink-500/20 to-pink-500/5",
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center relative">
                <Bell className="w-6 h-6 text-white" />
                {unreadNotifs.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                    {unreadNotifs.length > 9 ? "9+" : unreadNotifs.length}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold">Notifications</h1>
                <p className="text-muted-foreground">
                  {unreadNotifs.length > 0
                    ? `${unreadNotifs.length} unread notification${unreadNotifs.length > 1 ? "s" : ""}`
                    : "You're all caught up!"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="all">All ({notifications?.length || 0})</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unreadNotifs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {displayNotifs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <Bell className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
                  <p className="text-muted-foreground">
                    Join squads and interact with the community to receive notifications
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {displayNotifs.map((n) => {
                  const group = allGroups?.find((g) => g.id === n.relatedId)
                  const createdAt = new Date(n.createdAt as any)
                  const minutes = Math.floor((Date.now() - createdAt.getTime()) / 60000)
                  const timeAgo =
                    minutes < 1 ? "Just now" : minutes < 60 ? `${minutes}m ago` : `${Math.floor(minutes / 60)}h ago`

                  return (
                    <Card key={n.id} className={`transition-colors ${!n.read ? "border-primary/50 bg-primary/5" : ""}`}>
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <div
                            className={`w-10 h-10 bg-gradient-to-br ${
                              bubbleClass[n.type] || "from-primary/20 to-primary/5"
                            } rounded-full flex items-center justify-center flex-shrink-0`}
                          >
                            {iconMap[n.type] || <Bell className="w-5 h-5 text-primary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold">{n.title}</p>
                                {!n.read && (
                                  <Badge variant="default" className="h-5 text-[10px] px-2">
                                    New
                                  </Badge>
                                )}
                                {group && (
                                  <Badge variant="outline" className="h-5 text-[10px] px-2 rounded-full">
                                    {group.title}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo}</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed mb-3">{n.message}</p>
                            {n.actionUrl && (
                              <Link href={n.actionUrl}>
                                <Button variant="outline" size="sm" className="h-7 text-xs">
                                  View
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="unread" className="mt-6">
            {unreadNotifs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 mx-auto mb-4 flex items-center justify-center">
                    <CheckCheck className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                  <p className="text-muted-foreground">You have no unread notifications</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {unreadNotifs.map((n) => {
                  const group = allGroups?.find((g) => g.id === n.relatedId)
                  const createdAt = new Date(n.createdAt as any)
                  const minutes = Math.floor((Date.now() - createdAt.getTime()) / 60000)
                  const timeAgo =
                    minutes < 1 ? "Just now" : minutes < 60 ? `${minutes}m ago` : `${Math.floor(minutes / 60)}h ago`

                  return (
                    <Card key={n.id} className="border-primary/50 bg-primary/5 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <div
                            className={`w-10 h-10 bg-gradient-to-br ${
                              bubbleClass[n.type] || "from-primary/20 to-primary/5"
                            } rounded-full flex items-center justify-center flex-shrink-0`}
                          >
                            {iconMap[n.type] || <Bell className="w-5 h-5 text-primary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold">{n.title}</p>
                                <Badge variant="default" className="h-5 text-[10px] px-2">
                                  New
                                </Badge>
                                {group && (
                                  <Badge variant="outline" className="h-5 text-[10px] px-2 rounded-full">
                                    {group.title}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo}</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed mb-3">{n.message}</p>
                            {n.actionUrl && (
                              <Link href={n.actionUrl}>
                                <Button variant="outline" size="sm" className="h-7 text-xs">
                                  View
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
