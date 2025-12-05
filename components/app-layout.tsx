"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Home, Users, Radio, Settings, LogOut, Sparkles, LogIn, MessageSquare } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useIsMobile } from "@/hooks/use-mobile"

type DockPosition = "left-center" | "right-center" | "bottom-center"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isAuthenticated, user, logout, isLoading } = useAuth()
  const [isMounted, setIsMounted] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const isMobile = useIsMobile()
  
  // Load dock position preference from localStorage
  const [dockPosition, setDockPosition] = useState<DockPosition>("left-center")

  useEffect(() => {
    setIsMounted(true)
    // Load dock position preference
    const savedPosition = localStorage.getItem("dock-position") as DockPosition
    if (savedPosition && !isMobile) {
      setDockPosition(savedPosition)
    } else if (isMobile) {
      // Always use bottom-center on mobile
      setDockPosition("bottom-center")
    }
  }, [isMobile])

  // Save dock position preference
  const saveDockPosition = (position: DockPosition) => {
    setDockPosition(position)
    localStorage.setItem("dock-position", position)
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const navItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/groups", label: "Groups", icon: Users },
    { href: "/spaces", label: "Spaces", icon: Radio },
    { href: "/messages", label: "Messages", icon: MessageSquare },
    { href: "/lumina", label: "Lumina", icon: Sparkles },
    { href: "/settings", label: "Settings", icon: Settings },
  ]

  const handleLogout = () => {
    logout()
  }

  // Do not render the user dock on admin routes; admin has its own layout
  if (pathname?.startsWith("/admin")) {
    return <>{children}</>
  }

  // Determine dock positioning styles
  const getDockStyles = () => {
    if (isMobile || dockPosition === "bottom-center") {
      return {
        container: "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
        wrapper: "flex flex-row items-center space-x-2 bg-card/95 backdrop-blur-md border border-border/50 rounded-2xl shadow-2xl p-2",
        content: "flex flex-row space-x-1",
        toggle: "bottom-20 left-1/2 -translate-x-1/2"
      }
    } else if (dockPosition === "right-center") {
      return {
        container: "fixed right-0 top-1/2 -translate-y-1/2 z-50",
        wrapper: "bg-card/95 backdrop-blur-md border-l border-border/50 rounded-l-2xl shadow-2xl p-3 flex flex-col items-center space-y-3",
        content: "flex flex-col space-y-2",
        toggle: "right-4 top-1/2 -translate-y-1/2"
      }
    } else { // left-center (default)
      return {
        container: "fixed left-0 top-1/2 -translate-y-1/2 z-50",
        wrapper: "bg-card/95 backdrop-blur-md border-r border-border/50 rounded-r-2xl shadow-2xl p-3 flex flex-col items-center space-y-3",
        content: "flex flex-col space-y-2",
        toggle: "left-4 top-1/2 -translate-y-1/2"
      }
    }
  }

  const dockStyles = getDockStyles()
  const isHorizontal = isMobile || dockPosition === "bottom-center"

  return (
    <div className="flex min-h-screen bg-background">
      {/* Floating Toggle Button (visible when collapsed) */}
      {sidebarCollapsed && (
        <Button
          variant="default"
          size="icon"
          onClick={() => setSidebarCollapsed(false)}
          className={`fixed ${dockStyles.toggle} w-10 h-10 rounded-full shadow-2xl`}
        >
          <Sparkles className="w-4 h-4" />
        </Button>
      )}

      {/* Dock-Style Sidebar */}
      <div className={`${dockStyles.container} transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 scale-100'
      }`}>
        <div className={dockStyles.wrapper}>
          {/* Navigation Items */}
          <div className={`${dockStyles.content} ${isHorizontal ? '' : 'flex-1'}`}>
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="icon"
                    className={`w-11 h-11 rounded-full transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg scale-110"
                        : "hover:bg-accent/10 hover:scale-105"
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5" />
                  </Button>
                </Link>
              )
            })}
          </div>

          {/* User Avatar / Auth Section */}
          <div className={isHorizontal ? "" : "mt-auto pt-2"}>
            {isMounted && isLoading ? (
              <div className="w-11 h-11 bg-muted rounded-full animate-pulse" />
            ) : isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-11 h-11 rounded-full hover:bg-primary/10 hover:scale-105 transition-all duration-200 relative"
                    title={user.name}
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center text-primary font-bold text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isHorizontal ? "center" : "end"} side={isHorizontal ? "top" : "right"} className="min-w-[220px]">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email ?? user.username}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      View Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={(event) => {
                    event.preventDefault()
                    handleLogout()
                  }} variant="destructive">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-11 h-11 rounded-full hover:bg-primary/10 hover:scale-105 transition-all duration-200"
                  title="Login"
                >
                  <LogIn className="w-5 h-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${
        isHorizontal 
          ? 'pb-24' 
          : sidebarCollapsed 
            ? (dockPosition === 'right-center' ? 'mr-0' : 'ml-0') 
            : (dockPosition === 'right-center' ? 'mr-24' : 'ml-24')
      }`}>
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  )
}

// Export dock position setter for settings page
export { type DockPosition }
