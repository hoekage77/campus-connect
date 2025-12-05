# Design System Migration Guide: Campus Connect → Squad 2Go

## Overview

This document outlines the comprehensive migration from the current Campus Connect design system to the new Squad 2Go design system. The new design features a modern, cohesive aesthetic with improved accessibility, better component consistency, and enhanced user experience.

## Current State Analysis

### Current Design System
- **Framework**: Next.js 16 with Tailwind CSS v4
- **Component Library**: Partial shadcn/ui implementation
- **Color System**: Mixed approach with some CSS variables
- **Navigation**: Top navigation bar + basic sidebar
- **Theme Support**: Limited dark mode implementation

### New Design System Features
- **Complete shadcn/ui Component Library**: 40+ production-ready components
- **Advanced Color System**: OKLCH color space with comprehensive semantic tokens
- **Sophisticated Sidebar**: Collapsible, mobile-responsive with keyboard shortcuts
- **Modern Typography**: Geist font family with improved hierarchy
- **Enhanced Theming**: Full dark/light mode support with next-themes
- **Better Accessibility**: Improved focus states, ARIA support, and keyboard navigation

## Migration Phases

### Phase 1: Foundation Setup

#### 1.1 Update Package Dependencies

**Current dependencies to update:**
```json
// Update these in package.json
{
  "dependencies": {
    "@radix-ui/*": "latest", // Update all Radix components
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.454.0",
    "next-themes": "^0.4.6",
    "tailwind-merge": "^2.5.5",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.9",
    "tailwindcss": "^4.1.9"
  }
}
```

**New dependencies to add:**
```json
{
  "dependencies": {
    "react-resizable-panels": "^2.1.7",
    "recharts": "2.15.4",
    "sonner": "^1.7.4",
    "vaul": "^0.9.9"
  }
}
```

#### 1.2 Replace Global Styles

**File**: `src/app/globals.css`

**Replace current content with:**
```css
@import 'tailwindcss';
@import 'tw-animate-css';

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.145 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.145 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.396 0.141 25.723);
  --destructive-foreground: oklch(0.637 0.237 25.331);
  --border: oklch(0.269 0 0);
  --input: oklch(0.269 0 0);
  --ring: oklch(0.439 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(0.269 0 0);
  --sidebar-ring: oklch(0.439 0 0);
}

@theme inline {
  --font-sans: 'Geist', 'Geist Fallback';
  --font-mono: 'Geist Mono', 'Geist Mono Fallback';
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

#### 1.3 Update Layout with Theme Provider

**File**: `src/app/layout.tsx`

**Add theme provider and update structure:**
```tsx
import { ThemeProvider } from "@/components/theme-provider"
// ... existing imports

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navigation />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

#### 1.4 Add Theme Provider Component

**New File**: `src/components/theme-provider.tsx`
```tsx
'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

#### 1.5 Add Mobile Hook

**New File**: `src/hooks/use-mobile.ts`
```tsx
import * as React from 'react'

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener('change', onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isMobile
}
```

### Phase 2: Component Library Migration

#### 2.1 Update Existing Components

**Button Component** (`src/components/ui/button.tsx`):
- Already updated with single quotes and proper styling
- No changes needed

**Card Component** (`src/components/ui/card.tsx`):
- Already uses proper design tokens
- No changes needed

#### 2.2 Add Missing UI Components

Copy all components from `design/components/ui/` to `src/components/ui/`:

**Required new components:**
- `accordion.tsx`
- `alert-dialog.tsx`
- `alert.tsx`
- `aspect-ratio.tsx`
- `avatar.tsx`
- `badge.tsx`
- `breadcrumb.tsx`
- `button-group.tsx`
- `calendar.tsx`
- `carousel.tsx`
- `chart.tsx`
- `checkbox.tsx`
- `collapsible.tsx`
- `command.tsx`
- `context-menu.tsx`
- `dialog.tsx`
- `drawer.tsx`
- `dropdown-menu.tsx`
- `empty.tsx`
- `field.tsx`
- `form.tsx`
- `hover-card.tsx`
- `input-group.tsx`
- `input-otp.tsx`
- `item.tsx`
- `kbd.tsx`
- `menubar.tsx`
- `navigation-menu.tsx`
- `pagination.tsx`
- `popover.tsx`
- `progress.tsx`
- `radio-group.tsx`
- `resizable.tsx`
- `scroll-area.tsx`
- `select.tsx`
- `separator.tsx`
- `sheet.tsx`
- `sidebar.tsx` (advanced version)
- `skeleton.tsx`
- `slider.tsx`
- `sonner.tsx`
- `switch.tsx`
- `table.tsx`
- `tabs.tsx`
- `textarea.tsx`
- `toast.tsx`
- `toaster.tsx`
- `toggle-group.tsx`
- `toggle.tsx`
- `tooltip.tsx`
- `use-mobile.tsx`
- `use-toast.ts`

#### 2.3 Update Sidebar Implementation

**Replace** `src/components/dashboard/Sidebar.tsx` **with advanced sidebar:**

```tsx
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Home, Users, Settings, LogOut } from "lucide-react"

const sidebarItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/profile', label: 'Profile', icon: Users },
  { href: '/dashboard/groups', label: 'Groups', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold">S</span>
          </div>
          <span className="font-semibold">Campus Connect</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => {
            localStorage.clear()
            window.location.href = '/'
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
```

#### 2.4 Update Dashboard Layout

**File**: `src/app/dashboard/page.tsx`

**Wrap with SidebarProvider:**
```tsx
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/Sidebar"

export default function DashboardPage() {
  // ... existing code

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center gap-2 mb-6">
          <SidebarTrigger />
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        {/* ... existing content */}
      </main>
    </SidebarProvider>
  )
}
```

### Phase 3: Page and Layout Updates

#### 3.1 Update Landing Page

**File**: `src/app/page.tsx`

**Replace with modern design:**
```tsx
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Users, Zap, MessageSquare, Sparkles, ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6">
              <Badge className="px-4 py-1.5 bg-accent/20 text-accent border-accent/30">
                <Sparkles className="w-3 h-3 mr-2" />
                Join 1000+ Students Connected
              </Badge>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Connect. Study. Vibe.
            </h1>
            <p className="text-xl text-muted-foreground mb-2 max-w-2xl">
              Your all-in-one platform to find study groups, host events, and vibe with your squad.
            </p>
            <p className="text-sm text-muted-foreground mb-10 max-w-xl">
              Study, party, connect—all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/groups/new">
                <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all">
                  <span className="text-xl">📚</span>
                  Create Study Squad
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/sessions/new">
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 border-secondary/50 hover:bg-secondary/5"
                >
                  <span className="text-xl">🎉</span>
                  Host an Event
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto mt-12">
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 backdrop-blur-sm">
                <div className="text-3xl font-bold text-primary mb-1">1000+</div>
                <div className="text-sm font-medium text-muted-foreground">Students Connected</div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 backdrop-blur-sm">
                <div className="text-3xl font-bold text-accent mb-1">500+</div>
                <div className="text-sm font-medium text-muted-foreground">Study Sessions</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Why Choose Campus Connect?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Zap,
                color: "text-accent",
                title: "Level Up Together",
                desc: "Earn points, unlock achievements, and progress through levels with your study squad",
              },
              {
                icon: Sparkles,
                color: "text-primary",
                title: "Smart Matching",
                desc: "Find study partners and groups based on your courses, interests, and schedule",
              },
              {
                icon: Users,
                color: "text-secondary",
                title: "Build Community",
                desc: "Connect with peers who share your academic goals and social interests",
              },
              {
                icon: MessageSquare,
                color: "text-accent",
                title: "Secure Messaging",
                desc: "End-to-end encrypted chats keep your conversations private and secure",
              },
            ].map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`w-12 h-12 ${feature.color} mx-auto mb-4`}>
                    <feature.icon className="w-12 h-12" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
```

#### 3.2 Update Navigation Component

**File**: `src/components/navigation.tsx`

**Replace with modern navigation:**
```tsx
"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import NotificationsBell from '@/components/notifications-bell'
import { Moon, Sun, Sparkles } from 'lucide-react'
import { useTheme } from 'next-themes'

export function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<{ name: string; email: string; id?: string } | null>(null)

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    const userName = localStorage.getItem('userName')
    const userEmail = localStorage.getItem('userEmail')

    if (userId && userName && userEmail) {
      setUser({ name: userName, email: userEmail, id: userId })
    }
  }, [])

  // Hide navigation on dashboard pages
  if (pathname && pathname.startsWith('/dashboard')) {
    return null
  }

  const handleLogout = () => {
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    localStorage.removeItem('userEmail')
    setUser(null)
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-primary-foreground font-bold shadow-lg group-hover:shadow-xl transition-shadow">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Squad
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-9 w-9"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-1">
                  <span className="text-sm font-medium text-muted-foreground">Welcome,</span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    {user.name.split(' ')[0]}
                  </Badge>
                </div>
                <NotificationsBell userId={user.id ?? null} />
                <Button asChild size="sm" className="font-semibold shadow-lg">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button onClick={handleLogout} variant="outline" size="sm">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild size="sm" className="shadow-lg">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
```

### Phase 4: Testing and Polish

#### 4.1 Update Components.json

**File**: `components.json`

**Update paths:**
```json
{
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

#### 4.2 Add Toast Notifications

**File**: `src/app/layout.tsx`

**Add Toaster:**
```tsx
import { Toaster } from "@/components/ui/toaster"
// ... existing imports

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navigation />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

#### 4.3 Update Metadata

**File**: `src/app/layout.tsx`

**Update metadata:**
```tsx
export const metadata: Metadata = {
  title: "Campus Connect - Study Groups & Hangouts",
  description: "Join study groups and campus hangouts with end-to-end encrypted messaging. Earn points, level up, and build connections.",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}
```

## Migration Checklist

### Pre-Migration
- [ ] Backup current codebase
- [ ] Test current functionality
- [ ] Document custom components/styles

### Foundation (Phase 1)
- [ ] Update package.json dependencies
- [ ] Replace globals.css with new design system
- [ ] Add ThemeProvider to layout
- [ ] Create theme-provider.tsx
- [ ] Add use-mobile.ts hook
- [ ] Update utils.ts if needed

### Components (Phase 2)
- [ ] Copy all UI components from design system
- [ ] Update existing components to use new tokens
- [ ] Replace sidebar with advanced implementation
- [ ] Update dashboard layout with SidebarProvider

### Pages & Layout (Phase 3)
- [ ] Update landing page with new design
- [ ] Update navigation with theme toggle
- [ ] Add toast notifications
- [ ] Update metadata and icons

### Testing (Phase 4)
- [ ] Test all pages in light/dark mode
- [ ] Verify mobile responsiveness
- [ ] Test sidebar functionality
- [ ] Check component interactions
- [ ] Validate accessibility

## Key Design Changes

### Color System
- **Old**: Limited CSS variables, mixed color approaches
- **New**: Comprehensive OKLCH color space with semantic tokens

### Typography
- **Old**: Basic font stacks
- **New**: Geist font family with improved hierarchy

### Components
- **Old**: Partial shadcn/ui implementation
- **New**: Complete component library with consistent variants

### Navigation
- **Old**: Basic top nav + simple sidebar
- **New**: Advanced sidebar with mobile support + theme toggle

### Theming
- **Old**: Limited dark mode
- **New**: Full system theme support with next-themes

## Benefits of Migration

1. **Consistency**: Unified design system across all components
2. **Accessibility**: Better focus states, ARIA support, keyboard navigation
3. **Performance**: Optimized CSS with modern color space
4. **Maintainability**: Standardized component APIs and variants
5. **User Experience**: Better mobile support, theme switching, animations
6. **Developer Experience**: Comprehensive component library, better TypeScript support

## Rollback Plan

If issues arise during migration:

1. **Component Level**: Revert individual components to previous versions
2. **Styling Level**: Keep old globals.css as backup, switch via components.json
3. **Full Rollback**: Restore from backup, gradually reapply changes

## Timeline Estimate

- **Phase 1**: 2-3 hours (Foundation setup)
- **Phase 2**: 4-6 hours (Component migration)
- **Phase 3**: 3-4 hours (Page updates)
- **Phase 4**: 2-3 hours (Testing and polish)

**Total**: 11-16 hours for complete migration</content>
<parameter name="filePath">/Users/macbookpro/csc456/campus-connect/DESIGN_MIGRATION_GUIDE.md