"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Shield, Home, Users, Database, LogOut, LogIn, Sparkles } from "lucide-react"
import { useAdminAuth } from "@/hooks/use-admin-auth"

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isAuthenticated, user, logout, isLoading } = useAdminAuth()

  const navItems = [
    { href: "/admin", label: "Overview", icon: Shield },
    // Future sections can be added here
    { href: "/dashboard", label: "Back to App", icon: Home },
  ]

  const isActive = (href: string) => pathname === href

  // On admin auth routes (e.g., /admin/login), don't render the admin dock
  if (pathname?.startsWith("/admin/login")) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Admin Dock Sidebar */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50 w-20">
        <div className="bg-card/95 backdrop-blur-md border-r border-border/50 rounded-r-2xl shadow-2xl p-3 flex flex-col items-center space-y-3">
          {/* Admin Logo */}
          <Button
            variant="ghost"
            size="icon"
            className="w-11 h-11 rounded-full hover:bg-primary/10 transition-colors relative group"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
          </Button>

          {/* Navigation */}
          <div className="flex flex-col space-y-2 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? "default" : "ghost"}
                    size="icon"
                    className={`w-11 h-11 rounded-full transition-all duration-200 ${
                      isActive(item.href)
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

          {/* User/Auth */}
          <div className="mt-auto pt-2">
            {isLoading ? (
              <div className="w-11 h-11 bg-muted rounded-full animate-pulse" />
            ) : isAuthenticated && user ? (
              <div className="relative group">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-11 h-11 rounded-full hover:bg-primary/10 hover:scale-105 transition-all duration-200 relative"
                  title={user.name}
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center text-primary font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-full ml-2 top-0 w-11 h-11 rounded-full bg-card/95 backdrop-blur-md border shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                  onClick={logout}
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Link href="/admin/login">
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

      {/* Content */}
      <main className={`flex-1 ml-24`}>
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  )
}
