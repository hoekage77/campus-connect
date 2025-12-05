"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { useAuth } from "@/hooks/use-auth"
import { getAuthHeaders } from '@/lib/auth'
import { useAllGroups } from "@/hooks/use-queries"
import { formatDistanceToNow } from "date-fns"
import { Users, Radio, Clock, Shield, CalendarClock } from "lucide-react"
import { Icon } from "@iconify/react"
import { SpotlightCarousel, type SpotlightSlide } from "@/components/hero/spotlight-carousel"

interface SpaceResponse {
  id: string
  groupId: string
  title: string
  description?: string
  status: "live" | "ended" | "scheduled"
  privacy: "public" | "members-only" | "invite-only"
  participantIds?: string[]
  // Supabase returns the current active participant count separately
  activeParticipantCount?: number
  startedAt?: string
  endedAt?: string
  createdAt: string
}

export default function SpacesPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const { data: groups, isLoading: groupsLoading } = useAllGroups()
  const [loadingSpaces, setLoadingSpaces] = useState(false)
  const [spaces, setSpaces] = useState<SpaceResponse[]>([])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  const memberGroups = useMemo(() => {
    if (!groups) return []
    return groups.filter(group => group.isMember || group.ownerId === user?.id)
  }, [groups, user?.id])

  const liveSpaces = useMemo(() => spaces.filter((space) => space.status === "live"), [spaces])
  const endedSpaces = useMemo(() => spaces.filter((space) => space.status === "ended"), [spaces])

  const heroSlides: SpotlightSlide[] = useMemo(() => {
    const squadsCount = memberGroups.length
    const totalSpaces = spaces.length
    const liveCount = liveSpaces.length
    const endedCount = endedSpaces.length

    return [
      {
        id: "spaces-live",
        eyebrow: liveCount ? "Live energy" : "Your turn",
        title: liveCount
          ? `${liveCount} squad${liveCount === 1 ? "" : "s"} are co-working right now`
          : "Kick off the next focus room",
        description:
          "Drop into ready-made rooms or spin up a study sprint with one click. Spaces sync to your squads and Daily call rooms automatically.",
        tags: ["Daily rooms", "Audio-first", "Beta"],
        stats: [
          { label: "Live spaces", value: liveCount.toString() },
          { label: "Your squads", value: squadsCount.toString() },
        ],
        action: { label: "Start a space", href: "/groups" },
        accent: "from-emerald-500/80 via-cyan-500/70 to-blue-600/70",
        media: (
          <div className="relative aspect-[4/3] rounded-2xl border border-white/30 bg-white/10 backdrop-blur">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6">
              <Radio className="w-12 h-12 text-white/90" />
              <p className="text-3xl font-semibold">{liveCount || "No"} live</p>
              <p className="text-sm text-white/80">Across {Math.max(squadsCount, 1)} squads you follow</p>
            </div>
          </div>
        ),
      },
      {
        id: "spaces-recap",
        eyebrow: "Smart recaps",
        title: "Keep momentum between sessions",
        description:
          "Review ended spaces, capture next steps, and hand off recordings or resources before the next meetup.",
        tags: ["Follow-ups", "Shared notes"],
        stats: [
          { label: "Ended this week", value: endedCount.toString() },
          { label: "Total spaces", value: totalSpaces.toString() },
        ],
        action: { label: "Browse recaps", href: "/dashboard" },
        accent: "from-indigo-600/80 via-violet-600/70 to-pink-500/70",
        media: (
          <div className="relative aspect-[4/3] rounded-2xl border border-white/25 bg-white/5 p-6">
            <div className="flex h-full flex-col justify-between text-white/90">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-10 h-10" />
                <div>
                  <p className="text-lg font-semibold">Recap queue</p>
                  <p className="text-sm text-white/70">{endedCount || "No"} sessions awaiting notes</p>
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/20 p-4 space-y-2">
                <p className="text-sm uppercase tracking-wide text-white/70">Suggested follow-up</p>
                <p className="text-lg font-semibold">Sync up with your last speakers</p>
                <p className="text-sm text-white/80">Share resources, post action items, keep the streak alive.</p>
              </div>
            </div>
          </div>
        ),
      },
    ]
  }, [endedSpaces.length, liveSpaces.length, memberGroups.length, spaces.length])

  useEffect(() => {
    const loadSpaces = async () => {
      if (!user || memberGroups.length === 0) {
        setSpaces([])
        return
      }

      setLoadingSpaces(true)
      try {
        const results = await Promise.all(
          memberGroups.map(async (group) => {
            try {
              const url = `/api/groups/${group.id}/spaces`
              if (process.env.NODE_ENV === 'development') console.debug('[Spaces] Fetching', url, 'user', user.id)
              const response = await fetch(url, {
                headers: { ...getAuthHeaders(), "x-user-id": user.id },
                cache: "no-store",
              })
              if (!response.ok) return []
              return response.json() as Promise<SpaceResponse[]>
            } catch (error) {
              console.error("[Spaces] Failed to load group spaces", group.id, error)
              return []
            }
          })
        )
        const flattened = results.flat()
        const uniqueSpaces = new Map<string, SpaceResponse>()
        flattened.forEach((space) => {
          uniqueSpaces.set(space.id, space)
        })
        const ordered = Array.from(uniqueSpaces.values()).sort((a, b) => {
          const aTime = new Date(a.startedAt ?? a.createdAt).getTime()
          const bTime = new Date(b.startedAt ?? b.createdAt).getTime()
          return bTime - aTime
        })
        setSpaces(ordered)
      } finally {
        setLoadingSpaces(false)
      }
    }

    loadSpaces()
  }, [user, memberGroups])

  if (isLoading || groupsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-8 w-40 mx-auto" />
          <div className="grid gap-3 md:grid-cols-2 max-w-xl mx-auto">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Sign in to view spaces</EmptyTitle>
            <EmptyDescription>Spaces are personalized to the squads you belong to.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href="/login">
              <Button>Go to login</Button>
            </Link>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  const groupLookup = new Map(memberGroups.map((group) => [group.id, group]))

  // Development debug: show auth status and storage values
  const devUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null

  return (
    <div className="min-h-screen bg-background relative overflow-hidden px-4 py-10 md:px-12 lg:px-16 space-y-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-500/25 to-emerald-500/0 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-cyan-500/25 to-cyan-500/0 blur-3xl" />
      </div>
      {/* Dev banner removed now that Spaces is stable */}
      <div className="relative z-10 flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground w-fit">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
            <Icon icon="solar:soundwave-bold-duotone" className="h-3.5 w-3.5 text-emerald-500" />
          </span>
          Spaces · Live rooms
        </div>
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
          Spaces
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Join live study rooms, office hours, and collab sessions from your squads. Create new spaces directly from any group.
        </p>
      </div>

      <SpotlightCarousel slides={heroSlides} />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Radio className="w-5 h-5" /> Live now
          </h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/groups">
              <Users className="w-4 h-4 mr-2" /> Browse squads
            </Link>
          </Button>
        </div>
        {loadingSpaces ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-32 w-full" />
            ))}
          </div>
        ) : liveSpaces.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No live spaces right now</EmptyTitle>
              <EmptyDescription>When squads go live, they’ll show up here instantly.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href="/dashboard">
                <Button>Return to dashboard</Button>
              </Link>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {liveSpaces.map((space) => (
              <SpaceCard key={space.id} space={space} groupName={groupLookup.get(space.groupId)?.title} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4 pb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5" /> Recent spaces
          </h2>
          <Badge variant="secondary">History</Badge>
        </div>
        {endedSpaces.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No past spaces yet</EmptyTitle>
              <EmptyDescription>Ended spaces will appear here so you can review activity.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {endedSpaces.map((space) => (
              <SpaceCard key={space.id} space={space} groupName={groupLookup.get(space.groupId)?.title} compact />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function SpaceCard({ space, groupName, compact = false }: { space: SpaceResponse; groupName?: string; compact?: boolean }) {
  const router = useRouter()

  return (
    <Card
      className={`group overflow-hidden border bg-card/80 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        compact ? "opacity-90" : ""
      } ${
        space.status === 'live' 
          ? 'border-emerald-500/40 shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:border-emerald-500/60' 
          : 'border-border/60 hover:border-emerald-400/60'
      }`}
    >
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
                <Radio className="h-3 w-3 text-emerald-500" />
              </span>
              {space.status === "live" ? "Live space" : "Past space"}
            </div>
            <CardTitle className="text-base font-semibold line-clamp-2">
              {space.title}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground/90">
              {groupName ? `Hosted in ${groupName}` : `Group ${space.groupId}`}
            </CardDescription>
          </div>
          <Badge
            variant={space.status === "live" ? "default" : "outline"}
            className={
              space.status === "live"
                ? "bg-emerald-500 text-white border-emerald-500 animate-pulse shadow-lg shadow-emerald-500/20"
                : "border-border/60 bg-background/60"
            }
          >
            {space.status === "live" ? "Live" : "Ended"}
          </Badge>
        </div>
        {space.description && !compact && (
          <p className="text-xs text-muted-foreground line-clamp-3">
            {space.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex items-center justify-between border-t border-border/60 bg-background/40 px-4 py-3 text-[11px] text-muted-foreground">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {space.participantIds?.length ?? space.activeParticipantCount ?? 0} participants
          </span>
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" /> {space.privacy.replace(/-/g, " ")}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatDistanceToNow(new Date(space.startedAt ?? space.createdAt), { addSuffix: true })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-7 px-3 text-[11px]"
            onClick={() => router.push(`/groups/${space.groupId}/spaces/${space.id}`)}
          >
            {space.status === "live" ? "Join" : "View"}
          </Button>
          {!compact && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-3 text-[11px]"
              onClick={() => router.push(`/groups/${space.groupId}/spaces`)}
            >
              Group
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
