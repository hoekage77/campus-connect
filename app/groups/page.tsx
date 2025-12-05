"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Search, Users, ArrowRight, Zap, Globe, Lock, Eye, Sparkles } from "lucide-react"
import { Icon } from "@iconify/react"
import type { GroupPrivacy } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { type GroupData } from "@/lib/api-client"
import { events } from "@/lib/event-emitter"
import { useAllGroups, useCreateGroup } from "@/hooks/use-queries"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/use-auth"
import { SpotlightCarousel, type SpotlightSlide } from "@/components/hero/spotlight-carousel"

const INTEREST_OPTIONS = [
  "Study Groups",
  "Sports & Fitness",
  "Computer Science",
  "Creative Arts",
  "Social Events",
  "Career & Professional",
]

export default function GroupsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: groups, isLoading: loading, error, fetch } = useAllGroups()
  const { mutate: createNewGroup, isLoading: isSubmitting } = useCreateGroup()
  const { user } = useAuth()
  const [squads, setSquads] = useState<GroupData[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [newSquadOpen, setNewSquadOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"explore" | "mine">("explore")

  const [formData, setFormData] = useState<{
    name: string
    description: string
    interests: string[]
    privacy: GroupPrivacy
  }>({
    name: "",
    description: "",
    interests: [],
    privacy: "public",
  })

  useEffect(() => {
    fetch()
  }, [fetch])

  useEffect(() => {
    if (groups) {
      setSquads(groups)
    }
  }, [groups])

  const interests = INTEREST_OPTIONS

  const mySquads = useMemo(() => {
    if (!user?.id) return []
    return squads.filter((g) => {
      // Check if user is owner
      if (g.ownerId === user.id) return true
      // Check if user is in members array
      if (g.members && g.members.some((m) => m.userId === user.id)) return true
      // Fallback to user.squads if available
      if (user.squads && user.squads.includes(g.id)) return true
      return false
    })
  }, [user, squads])

  const exploreSquads = useMemo(
    () => squads.filter((g) => g.privacy === "public"),
    [squads]
  )

  const filteredExplore = useMemo(
    () =>
      exploreSquads.filter(
        (squad) =>
          squad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          squad.description.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [exploreSquads, searchQuery],
  )

  const filteredMine = useMemo(
    () =>
      mySquads.filter(
        (squad) =>
          squad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          squad.description.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [mySquads, searchQuery],
  )

  const heroSlides: SpotlightSlide[] = useMemo(() => {
    return [
      {
        id: "squads-explore",
        eyebrow: "Curated for you",
        title: `Discover ${filteredExplore.length} squads with overlapping interests`,
        description:
          "Filter by interest tags, privacy, or vibe. Each squad comes with chat, sessions, and live spaces built in.",
        tags: ["Communities", "Peer support"],
        stats: [
          { label: "Public squads", value: filteredExplore.length.toString() },
          { label: "Joined", value: mySquads.length.toString() },
        ],
        action: { label: "Browse featured squads", href: "#explore-squads" },
        accent: "from-fuchsia-600/80 via-purple-600/70 to-blue-600/70",
        media: (
          <div className="relative aspect-[4/3] rounded-2xl border border-white/25 bg-white/10 p-6">
            <div className="rounded-2xl bg-white/15 border border-white/30 p-4 h-full flex flex-col justify-between">
              <div className="flex items-center gap-3 text-white/90">
                <Users className="w-8 h-8" />
                <div>
                  <p className="text-lg font-semibold">Your squad map</p>
                  <p className="text-sm text-white/70">{mySquads.length || "No"} joined</p>
                </div>
              </div>
              <div className="space-y-2 text-white/80">
                <p className="text-sm font-semibold">Top topics</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {interests.slice(0, 4).map((interest) => (
                    <span key={interest} className="px-3 py-1 rounded-full bg-white/10 border border-white/20">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "squads-create",
        eyebrow: "Launch a new crew",
        title: "Create a squad in under two minutes",
        description:
          "Spin up a branded hub with chat, spaces, and sessions already wired. Pick privacy rules and start inviting peers.",
        tags: ["Creator tools", "Instant onboarding"],
        stats: [
          { label: "Visibility modes", value: "3" },
          { label: "Avg setup time", value: "90s" },
        ],
        action: { label: "Create a squad", href: "#create-squad" },
        accent: "from-amber-500/80 via-orange-500/70 to-rose-500/70",
        media: (
          <div className="relative aspect-[4/3] rounded-2xl border border-white/25 bg-white/5 p-6">
            <div className="rounded-2xl bg-white/10 border border-white/20 p-4 space-y-3 text-white/90">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                <p className="font-semibold">Squad builder</p>
              </div>
              <div className="space-y-2 text-sm text-white/80">
                <p>Name, description, topics, and privacy</p>
                <p className="text-xs text-white/70">Preview updates live as you type</p>
              </div>
              <div className="rounded-xl bg-white/10 border border-white/20 p-3 text-sm">
                <p className="font-semibold">Invite preview</p>
                <p className="text-white/80">Share a short link or QR with your campus friends.</p>
              </div>
            </div>
          </div>
        ),
      },
    ]
  }, [filteredExplore.length, mySquads.length])

  const handleCreateSquad = async () => {
    if (!user?.id) {
      toast({
        title: "Not Authenticated",
        description: "Please log in to create a squad.",
        variant: "destructive",
      })
      return
    }

    if (!formData.name || formData.interests.length === 0) {
      toast({
        title: "Missing Information",
        description: "Squad name and at least one interest are required.",
        variant: "destructive",
      })
      return
    }

    try {
      const newSquad = await createNewGroup({
        title: formData.name,
        description: formData.description,
        topics: formData.interests,
        privacy: formData.privacy,
      })

      setSquads((prev) => [newSquad, ...prev])
      setNewSquadOpen(false)
      setFormData({ name: "", description: "", interests: [], privacy: "public" })
      
      // Emit event to trigger refetch in other components (e.g., dashboard)
      events.groupCreated(newSquad)
      
      toast({
        title: "✨ Success!",
        description: `Squad "${newSquad.title}" has been created. Start inviting members!`,
      })

      // Navigate to the newly created squad so it's visible even if not public
      router.push(`/groups/${newSquad.id}`)
    } catch (err) {
      console.error("[Create Squad Error]", err)
      
      let errorMessage = "Failed to create squad."

      if (err instanceof Error) {
        errorMessage = err.message
      }

      // Display the error with proper formatting
      toast({
        title: "⚠️ Error Creating Squad",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const SquadsSkeleton = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="h-full">
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-4 w-5/6 mt-1" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-9 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 h-64 w-64 rounded-full bg-gradient-to-br from-primary/25 to-primary/0 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-accent/25 to-accent/0 blur-3xl" />
        <div className="absolute top-4 left-1/2 h-px w-[640px] -translate-x-1/2 bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/90 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
                  <Icon icon="solar:users-group-two-rounded-bold-duotone" className="h-3.5 w-3.5 text-primary" />
                </span>
                Squads · Explore
              </div>
              <div>
                <h1 className="text-2xl font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">Squads</h1>
                <p className="text-sm text-muted-foreground">
                  {loading
                    ? "Loading..."
                    : activeTab === "explore"
                      ? `${filteredExplore.length} available`
                      : `${filteredMine.length} in My Squads`}
                </p>
              </div>
            </div>
          <div id="create-squad">
          <Dialog open={newSquadOpen} onOpenChange={setNewSquadOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Squad
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-4 h-4 text-primary" />
                  Create Squad
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground">SQUAD NAME *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Advanced ML Study Group"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isSubmitting}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="description" className="text-xs font-semibold text-muted-foreground">DESCRIPTION</Label>
                  <Textarea
                    id="description"
                    placeholder="What is your squad about?"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={isSubmitting}
                    className="min-h-16 resize-none text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground">TOPICS *</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {interests.map((interest) => (
                      <Badge
                        key={interest}
                        variant={formData.interests.includes(interest) ? "default" : "outline"}
                        className="cursor-pointer px-2 py-1 h-auto justify-center text-xs hover:bg-accent transition-colors"
                        onClick={() =>
                          !isSubmitting &&
                          setFormData((prev) => ({
                            ...prev,
                            interests: prev.interests.includes(interest)
                              ? prev.interests.filter((i) => i !== interest)
                              : [...prev.interests, interest],
                          }))
                        }
                      >
                        {interest.split(' ')[0]}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.interests.length} of 6 selected
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground">VISIBILITY</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'public' as const, label: 'Public', icon: Globe },
                      { value: 'invite-only' as const, label: 'Invite', icon: Eye },
                      { value: 'private' as const, label: 'Private', icon: Lock },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => !isSubmitting && setFormData({ ...formData, privacy: value })}
                        className={`
                          p-2 border rounded-lg transition-all text-xs font-medium flex flex-col items-center gap-1
                          ${formData.privacy === value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/50'
                          }
                          ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleCreateSquad} className="w-full mt-4" disabled={isSubmitting} size="sm">
                  {isSubmitting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-background border-t-current rounded-full animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Create Squad
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
          </div>
        </div>
      </div>

      {/* Tabs, Search & Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <SpotlightCarousel slides={heroSlides} />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="explore">Explore</TabsTrigger>
            <TabsTrigger value="mine">My Squads</TabsTrigger>
          </TabsList>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search squads..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        {/* Explore Tab */}
  <TabsContent value="explore" id="explore-squads">
          {loading ? (
            <SquadsSkeleton />
          ) : error ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Failed to Load Squads</EmptyTitle>
                <EmptyDescription>{error}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </EmptyContent>
            </Empty>
          ) : filteredExplore.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExplore.map((squad) => {
                const joined = mySquads.some((s) => s.id === squad.id)
                return (
                  <Link key={squad.id} href={`/groups/${squad.id}`} passHref>
                    <Card className="group h-full cursor-pointer overflow-hidden border border-border/60 bg-card/80 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg">
                      <CardHeader className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-1">
                            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
                                <Icon icon="solar:users-group-rounded-bold-duotone" className="h-3 w-3 text-primary" />
                              </span>
                              {squad.privacy === 'public' ? 'Public squad' : squad.privacy === 'invite-only' ? 'Invite-only' : 'Private'}
                            </div>
                            <CardTitle className="line-clamp-2 text-base font-semibold">
                              {squad.title}
                            </CardTitle>
                            <CardDescription className="line-clamp-3 text-xs text-muted-foreground/90">
                              {squad.description}
                            </CardDescription>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {joined && (
                              <Badge variant="outline" className="h-5 px-2 text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30 rounded-full">
                                Joined
                              </Badge>
                            )}
                            {squad.privacy && (
                              <div className="flex items-center gap-1 rounded-full bg-muted/70 px-2 py-0.5 text-[11px] text-muted-foreground">
                                {squad.privacy === 'public' ? (
                                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                                ) : squad.privacy === 'invite-only' ? (
                                  <Eye className="w-3.5 h-3.5 text-amber-500" />
                                ) : (
                                  <Lock className="w-3.5 h-3.5 text-red-500" />
                                )}
                                <span className="capitalize">{squad.privacy.replace('-', ' ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {squad.topics.slice(0, 3).map((interest) => (
                            <Badge key={interest} variant="secondary" className="text-[10px]">
                              {interest}
                            </Badge>
                          ))}
                          {squad.topics.length > 3 && (
                            <Badge variant="secondary" className="text-[10px]">
                              +{squad.topics.length - 3}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="flex items-center justify-between border-t border-border/60 bg-background/40 px-4 py-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5" />
                          <span>{squad.memberCount} member{squad.memberCount !== 1 && "s"}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs">
                          {joined ? 'View squad' : 'Preview squad'}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No Squads Found</EmptyTitle>
                <EmptyDescription>
                  No squads match your search. Try a different query or create a new one.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </TabsContent>

        {/* My Squads Tab */}
        <TabsContent value="mine">
          {loading ? (
            <SquadsSkeleton />
          ) : error ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Failed to Load Squads</EmptyTitle>
                <EmptyDescription>{error}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </EmptyContent>
            </Empty>
          ) : filteredMine.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMine.map((squad) => (
                <Link key={squad.id} href={`/groups/${squad.id}`} passHref>
                  <Card className="group h-full cursor-pointer overflow-hidden border border-border/60 bg-card/80 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg">
                    <CardHeader className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
                              <Icon icon="solar:users-group-rounded-bold-duotone" className="h-3 w-3 text-primary" />
                            </span>
                            My squad
                          </div>
                          <CardTitle className="line-clamp-2 text-base font-semibold">
                            {squad.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-3 text-xs text-muted-foreground/90">
                            {squad.description}
                          </CardDescription>
                        </div>
                        {squad.privacy && (
                          <div className="flex items-center gap-1 rounded-full bg-muted/70 px-2 py-0.5 text-[11px] text-muted-foreground">
                            {squad.privacy === 'public' ? (
                              <Globe className="w-3.5 h-3.5 text-blue-500" />
                            ) : squad.privacy === 'invite-only' ? (
                              <Eye className="w-3.5 h-3.5 text-amber-500" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-red-500" />
                            )}
                            <span className="capitalize">{squad.privacy.replace('-', ' ')}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {squad.topics.slice(0, 3).map((interest) => (
                          <Badge key={interest} variant="secondary" className="text-[10px]">
                            {interest}
                          </Badge>
                        ))}
                        {squad.topics.length > 3 && (
                          <Badge variant="secondary" className="text-[10px]">
                            +{squad.topics.length - 3}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between border-t border-border/60 bg-background/40 px-4 py-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" />
                        <span>{squad.memberCount} member{squad.memberCount !== 1 && "s"}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1 text-xs">
                        View squad
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No Squads Yet</EmptyTitle>
                <EmptyDescription>
                  You haven’t joined any squads yet. Explore public squads or create your own.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
