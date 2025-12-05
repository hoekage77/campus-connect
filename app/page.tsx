"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Users, Zap, MessageSquare, Sparkles, ArrowRight, TrendingUp, Award } from "lucide-react"
import { Icon } from "@iconify/react"
import type { GroupPrivacy } from "@/types"
import { useAllGroups } from "@/hooks/use-queries"
import { Skeleton } from "@/components/ui/skeleton"

type SquadSummary = {
  id: string
  name: string
  description: string
  interests: string[]
  memberCount: number
  privacy: GroupPrivacy
  location?: string
}

const mapGroupResponse = (group: any): SquadSummary => {
  const interests = Array.isArray(group.topics) ? group.topics : []
  const memberCount = typeof group.memberCount === "number" ? group.memberCount : 0
  const id = typeof group.id === "string" && group.id.length > 0 ? group.id : `group-${Math.random().toString(36).slice(2, 10)}`

  return {
    id,
    name: typeof group.title === "string" && group.title.length > 0 ? group.title : "Untitled Group",
    description: typeof group.description === "string" ? group.description : "",
    interests,
    memberCount,
    privacy: (group.privacy ?? "public") as GroupPrivacy,
    location: typeof group.location === "string" ? group.location : undefined,
  }
}

export default function HomePage() {
  const { data: groups, isLoading, fetch } = useAllGroups()
  const [squads, setSquads] = useState<SquadSummary[]>([])
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])

  useEffect(() => {
    fetch()
  }, [fetch])

  useEffect(() => {
    if (groups) {
      setSquads(groups.map(mapGroupResponse))
    }
  }, [groups])

  const filteredSquads = useMemo(() => {
    if (selectedInterests.length === 0) return squads
    return squads.filter((squad) => squad.interests.some((interest) => selectedInterests.includes(interest)))
  }, [selectedInterests, squads])

  const interests = [
    "Study Groups",
    "Sports & Fitness",
    "Computer Science",
    "Creative Arts",
    "Social Events",
    "Career & Professional",
  ]

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Absolute mode background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 h-80 w-80 rounded-full bg-gradient-to-br from-primary/25 to-primary/0 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 h-80 w-80 rounded-full bg-gradient-to-br from-accent/25 to-accent/0 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 h-px w-[600px] -translate-x-1/2 bg-gradient-to-r from-transparent via-border/40 to-transparent" />
        <div className="absolute bottom-24 left-8 h-40 w-40 rounded-3xl border border-border/40 bg-gradient-to-br from-background/40 to-background/5 backdrop-blur-xl" />
      </div>

      {/* Hero */}
      <section className="relative border-b border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-center">
            <div className="text-center lg:text-left space-y-8">
              <div className="inline-flex items-center rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-accent/25">
                  <Icon icon="solar:radar-2-bold-duotone" className="h-3.5 w-3.5 text-primary" />
                </span>
                Campus Connect
              </div>

              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-semibold tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Connect. Study. Vibe.
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
                  A focused layer over campus life for squads, sessions, and real collaboration—without the noise.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link href="/groups">
                  <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all">
                    <Icon icon="solar:users-group-two-rounded-bold-duotone" className="h-5 w-5" />
                    Explore squads
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 border-border/70 bg-background/70 hover:bg-background"
                  >
                    <Icon icon="solar:chart-bold-duotone" className="h-4 w-4" />
                    View dashboard
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/70 px-3 py-1">
                  <Icon icon="solar:shield-check-bold-duotone" className="h-3.5 w-3.5 text-primary" />
                  <span>Designed for real campus teams</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/70 px-3 py-1">
                  <Icon icon="solar:bolt-bold-duotone" className="h-3.5 w-3.5 text-accent" />
                  <span>Instant squad onboarding</span>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -inset-8 rounded-3xl bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 blur-2xl" />
              <Card className="relative border-border/60 bg-background/80 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
                <CardHeader className="border-b border-border/60 pb-4 flex flex-row items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Live snapshot</p>
                    <p className="text-sm font-medium">Today on Campus Connect</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon icon="solar:clock-circle-bold-duotone" className="h-3.5 w-3.5" />
                    <span>Realtime</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-3">
                      <p className="text-[11px] text-muted-foreground mb-1">Active squads</p>
                      <p className="text-xl font-semibold">50+</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 to-background px-3 py-3">
                      <p className="text-[11px] text-muted-foreground mb-1">Study sessions</p>
                      <p className="text-xl font-semibold">18</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-3">
                      <p className="text-[11px] text-muted-foreground mb-1">Messages today</p>
                      <p className="text-xl font-semibold">12k</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-gradient-to-r from-primary/10 via-background to-accent/10 px-4 py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-background/70">
                        <Icon icon="solar:chat-line-bold-duotone" className="h-4 w-4 text-primary" />
                      </span>
                      <div>
                        <p className="font-medium">Late night study rooms are filling up</p>
                        <p className="text-[11px] text-muted-foreground">Drop into a live space from the dashboard.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-full border-border/60">
                      <Icon icon="solar:arrow-right-up-line-duotone" className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-12 text-center">Why Choose Campus Connect?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Users,
                color: "text-primary",
                title: "Connect",
                desc: "Build meaningful relationships with peers who share your academic interests and goals",
              },
              {
                icon: Sparkles,
                color: "text-accent",
                title: "Study",
                desc: "Join study groups, share resources, and collaborate on assignments together",
              },
              {
                icon: Zap,
                color: "text-secondary",
                title: "Vibe",
                desc: "Create unforgettable campus experiences through events, achievements, and community",
              },
              {
                icon: MessageSquare,
                color: "text-accent",
                title: "Chat & Collaborate",
                desc: "Discuss ideas, share knowledge, and support each other's academic journey",
              },
            ].map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div key={idx} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-accent/0 group-hover:from-primary/10 group-hover:to-accent/10 rounded-2xl transition-all duration-300" />
                  <Card className="relative h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur group-hover:bg-card/80">
                    <CardHeader className="pb-3">
                      <Icon className={`w-10 h-10 mb-3 ${feature.color}`} />
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{feature.desc}</p>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-b py-8 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold mb-4">Filter by Interest</h2>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <Badge
                key={interest}
                variant={selectedInterests.includes(interest) ? "default" : "outline"}
                className={`cursor-pointer px-3 py-1.5 transition-all ${
                  selectedInterests.includes(interest) ? "shadow-lg" : "hover:border-primary hover:bg-primary/5"
                }`}
                onClick={() =>
                  setSelectedInterests((prev) =>
                    prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
                  )
                }
              >
                {interest}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b py-16 bg-gradient-to-b from-accent/5 to-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              <span className="text-sm font-semibold text-accent">TRENDING NOW</span>
            </div>
            <h2 className="text-3xl font-bold">Featured Squads</h2>
            <p className="text-muted-foreground mt-2">Join the most active squads in the community</p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="h-full border-0 bg-card/60 shadow-md animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded-md w-3/4" />
                    <div className="mt-3 h-4 bg-muted/80 rounded-md w-full" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-muted rounded-md" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredSquads.slice(0, 4).length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredSquads.slice(0, 4).map((squad) => (
                <Link key={squad.id} href={`/groups/${squad.id}`}>
                  <Card className="h-full border-0 shadow-md hover:shadow-lg transition-all overflow-hidden bg-gradient-to-br from-card/90 to-card/50 hover:from-card hover:to-card/80 group cursor-pointer">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-2">
                        {squad.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{squad.memberCount}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-accent/20 text-accent">
                          {squad.privacy}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm" className="w-full group-hover:bg-primary/10">
                        Explore
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-t py-16 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Ready to Connect, Study, Vibe?</h2>
              <p className="text-muted-foreground mb-6 text-lg">
                Join Campus Connect and transform your campus experience. Build connections, study smarter, and create amazing memories with your peers.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Connect</h3>
                    <p className="text-sm text-muted-foreground">Find your people and build meaningful relationships</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Study</h3>
                    <p className="text-sm text-muted-foreground">Access study groups, resources, and academic support</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-secondary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Vibe</h3>
                    <p className="text-sm text-muted-foreground">Level up with achievements, events, and campus experiences</p>
                  </div>
                </div>
              </div>
              <Link href="/groups" className="mt-8 inline-block">
                <Button size="lg" className="gap-2">
                  Start Your Journey <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl blur-3xl" />
              <Card className="relative border-0 bg-gradient-to-br from-primary/5 to-accent/5 shadow-xl p-8">
                <div className="space-y-6 text-center">
                  <div>
                    <p className="text-5xl font-bold text-primary">1000+</p>
                    <p className="text-muted-foreground">Active Members</p>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-3xl font-bold text-secondary">50+</p>
                      <p className="text-xs text-muted-foreground">Squads</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-accent">100K+</p>
                      <p className="text-xs text-muted-foreground">Messages</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
