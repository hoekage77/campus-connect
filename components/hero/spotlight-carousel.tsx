'use client'

import { ReactNode } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

export type SpotlightSlide = {
  id: string
  eyebrow?: string
  title: string
  description: string
  accent?: string
  stats?: Array<{ label: string; value: string }>
  tags?: string[]
  action?: { label: string; href: string }
  media?: ReactNode
}

interface SpotlightCarouselProps {
  slides: SpotlightSlide[]
  className?: string
}

export function SpotlightCarousel({ slides, className }: SpotlightCarouselProps) {
  if (!slides.length) return null

  return (
    <div className={cn("relative w-full", className)}>
      <Carousel className="w-full">
        <CarouselContent>
          {slides.map((slide) => (
            <CarouselItem key={slide.id}>
              <div
                className={cn(
                  "rounded-3xl border border-border/50 bg-gradient-to-br text-white overflow-hidden shadow-2xl",
                  "p-6 sm:p-8 lg:p-12",
                  slide.accent ?? "from-primary/80 via-purple-600/70 to-indigo-600/60"
                )}
              >
                <div className="flex flex-col gap-6 lg:gap-10 lg:flex-row lg:items-center">
                  <div className="flex-1 space-y-4">
                    {slide.eyebrow && (
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur">
                        {slide.eyebrow}
                      </Badge>
                    )}
                    <div className="space-y-2">
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
                        {slide.title}
                      </h2>
                      <p className="text-white/90 text-sm sm:text-base max-w-2xl">
                        {slide.description}
                      </p>
                    </div>
                    {slide.tags && slide.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {slide.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs font-semibold uppercase tracking-wide text-white/80 bg-white/15 border border-white/25 rounded-full px-3 py-1"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {slide.stats && slide.stats.length > 0 && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {slide.stats.map((stat) => (
                          <div key={stat.label} className="rounded-2xl bg-white/10 border border-white/20 p-4">
                            <p className="text-2xl font-semibold leading-tight">{stat.value}</p>
                            <p className="text-xs uppercase tracking-wide text-white/70">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {slide.action && (
                      <Button
                        asChild
                        size="lg"
                        variant="secondary"
                        className="bg-white text-primary hover:bg-white/90 font-semibold"
                      >
                        <Link href={slide.action.href}>{slide.action.label}</Link>
                      </Button>
                    )}
                  </div>
                  {slide.media && (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-full max-w-sm">{slide.media}</div>
                    </div>
                  )}
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex border-white/40 text-white hover:bg-white/20" />
        <CarouselNext className="hidden md:flex border-white/40 text-white hover:bg-white/20" />
      </Carousel>
    </div>
  )
}
