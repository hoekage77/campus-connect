"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { StatCard } from "@/components/admin/stat-card"
import { StorageGauge } from "@/components/admin/storage-gauge"
import {
  Database,
  Users,
  UserSquare2,
  Calendar,
  MessageSquare,
  Bell,
  Shield,
  Download,
  Upload,
  Save,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileJson,
  Sparkles,
} from "lucide-react"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { localDB } from "@/lib/data/db"
import { dataStore } from "@/lib/data/store"
import { useToast } from "@/hooks/use-toast"

type DatabaseStats = {
  totalSize: number
  collections: Array<{ name: string; count: number; size: number }>
  lastModified: string
  version: string
  storage: {
    used: number
    available: number
    percentage: number
  }
}

export default function AdminPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAdminAuth()
  const { toast } = useToast()
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [operationLoading, setOperationLoading] = useState(false)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [integrityResult, setIntegrityResult] = useState<{ valid: boolean; errors: string[] } | null>(null)
  const [users, setUsers] = useState<Array<{ id: string; name: string; username: string; role?: string }>>([])
  const [usersLoading, setUsersLoading] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Preserve intent: send the user back to /admin after admin login
      const next = encodeURIComponent("/admin")
      router.push(`/admin/login?next=${next}`)
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (user) {
      loadStats()
      loadUsers()
    }
  }, [user])

  const loadStats = async () => {
    try {
      setLoading(true)
      const s = localDB.getStats()
      const storage = localDB.getStorageInfo()
      setStats({ ...s, storage })
    } catch (error) {
      toast({ title: "Error", description: "Failed to load statistics", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      setUsersLoading(true)
      const raw = dataStore.getAllUsers()
      const list = raw.map((u: any) => ({ id: u.id, name: u.name, username: u.username, role: u.role || "user" }))
      setUsers(list)
    } catch (e) {
      // ignore
    } finally {
      setUsersLoading(false)
    }
  }

  const toggleUserRole = async (userId: string, currentRole?: string) => {
    try {
      const nextRole = currentRole === "admin" ? "user" : "admin"
      const updated = dataStore.updateUser(userId, { role: nextRole } as any)
      if (!updated) throw new Error("User not found")
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: nextRole } : u)))
      toast({ title: `Role updated`, description: `${updated.username} is now ${nextRole}` })
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  const handleBackup = async () => {
    try {
      setOperationLoading(true)
      const b = localDB.createBackup()
      if (!b) throw new Error("Backup failed")
      toast({ title: "Backup Created", description: `Backup at ${new Date(b.timestamp).toLocaleString()}` })
    } catch (error) {
      toast({ title: "Backup Failed", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" })
    } finally {
      setOperationLoading(false)
    }
  }

  const handleRestore = async () => {
    try {
      setOperationLoading(true)
      const ok = localDB.restoreFromBackup()
      if (!ok) throw new Error("No backup found or checksum mismatch")
      toast({ title: "Restore Complete", description: "Database restored from backup" })
      await loadStats()
    } catch (error) {
      toast({ title: "Restore Failed", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" })
    } finally {
      setOperationLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      setOperationLoading(true)
      const json = localDB.exportToFile()
        const blob = new Blob([json], { type: "application/json" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `campusconnect-backup-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        toast({
          title: "Export Complete",
          description: "Database exported successfully",
        })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setOperationLoading(false)
    }
  }

  const handleImport = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      try {
        setOperationLoading(true)
        const text = await file.text()
        const ok = localDB.importFromFile(text)
        if (!ok) throw new Error("Import failed")
        toast({ title: "Import Complete", description: "Database imported successfully" })
        loadStats()
      } catch (error) {
        toast({
          title: "Import Failed",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        })
      } finally {
        setOperationLoading(false)
      }
    }
    input.click()
  }

  const handleOptimize = async () => {
    try {
      setOperationLoading(true)
      const before = localDB.getStorageInfo()
      const ok = localDB.optimize()
      const after = localDB.getStorageInfo()
      const savedBytes = Math.max(0, before.used - after.used)
      if (!ok) throw new Error("Optimize failed")
      toast({ title: "Optimization Complete", description: `Saved ${(savedBytes / 1024).toFixed(2)} KB` })
      loadStats()
    } catch (error) {
      toast({
        title: "Optimization Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setOperationLoading(false)
    }
  }

  const handleCheckIntegrity = async () => {
    try {
      setOperationLoading(true)
      const data = localDB.validateIntegrity()
      setIntegrityResult(data)
      toast({
        title: data.valid ? "Integrity Check Passed" : "Integrity Issues Found",
        description: data.valid ? "Database is healthy" : `${data.errors.length} error(s) found`,
        variant: data.valid ? "default" : "destructive",
      })
    } catch (error) {
      toast({
        title: "Check Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setOperationLoading(false)
    }
  }

  const handleClear = async () => {
    try {
      setOperationLoading(true)
      const ok = localDB.clearAll()
      if (!ok) throw new Error("Failed to clear data")
      toast({ title: "Database Cleared", description: "All data removed (backup created)" })
      setShowClearDialog(false)
      loadStats()
    } catch (error) {
      toast({
        title: "Clear Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setOperationLoading(false)
    }
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const collectionIcons: Record<string, any> = {
    users: Users,
    groups: UserSquare2,
    sessions: Calendar,
    messages: MessageSquare,
    chatMessages: MessageSquare,
    notifications: Bell,
    rsvps: Calendar,
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Database management and monitoring</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Collections"
              value={stats.collections.length}
              icon={Database}
              subtitle="Active data tables"
              iconClassName="text-blue-500"
            />
            <StatCard
              title="Total Records"
              value={stats.collections.reduce((sum, c) => sum + c.count, 0)}
              icon={FileJson}
              subtitle="Across all collections"
              iconClassName="text-green-500"
            />
            <StatCard
              title="Database Version"
              value={stats.version}
              icon={Sparkles}
              subtitle="Current schema"
              iconClassName="text-purple-500"
            />
            <StatCard
              title="Last Modified"
              value={new Date(stats.lastModified).toLocaleDateString()}
              icon={Calendar}
              subtitle={new Date(stats.lastModified).toLocaleTimeString()}
              iconClassName="text-orange-500"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Storage Gauge */}
          {stats?.storage && (
            <StorageGauge
              used={stats.storage.used}
              total={stats.storage.used + stats.storage.available}
              percentage={stats.storage.percentage}
            />
          )}

          {/* Quick Actions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Database Operations</CardTitle>
              <CardDescription>Manage and maintain your database</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  onClick={handleBackup}
                  disabled={operationLoading}
                  variant="outline"
                  className="flex flex-col h-auto py-4 gap-2"
                >
                  {operationLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  <span className="text-xs">Backup</span>
                </Button>
                <Button
                  onClick={handleRestore}
                  disabled={operationLoading}
                  variant="outline"
                  className="flex flex-col h-auto py-4 gap-2"
                >
                  {operationLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RotateCcw className="w-5 h-5" />}
                  <span className="text-xs">Restore</span>
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={operationLoading}
                  variant="outline"
                  className="flex flex-col h-auto py-4 gap-2"
                >
                  {operationLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  <span className="text-xs">Export</span>
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={operationLoading}
                  variant="outline"
                  className="flex flex-col h-auto py-4 gap-2"
                >
                  {operationLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  <span className="text-xs">Import</span>
                </Button>
                <Button
                  onClick={handleOptimize}
                  disabled={operationLoading}
                  variant="outline"
                  className="flex flex-col h-auto py-4 gap-2"
                >
                  {operationLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  <span className="text-xs">Optimize</span>
                </Button>
                <Button
                  onClick={handleCheckIntegrity}
                  disabled={operationLoading}
                  variant="outline"
                  className="flex flex-col h-auto py-4 gap-2"
                >
                  {operationLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  <span className="text-xs">Check</span>
                </Button>
                <Button
                  onClick={() => setShowClearDialog(true)}
                  disabled={operationLoading}
                  variant="outline"
                  className="flex flex-col h-auto py-4 gap-2 col-span-2 border-red-500/50 text-red-500 hover:bg-red-500/10"
                >
                  {operationLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  <span className="text-xs">Clear All Data</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integrity Result */}
        {integrityResult && (
          <Alert className={`mb-6 ${integrityResult.valid ? "border-green-500/50" : "border-red-500/50"}`}>
            {integrityResult.valid ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <AlertDescription>
              {integrityResult.valid ? (
                "Database integrity check passed. No issues found."
              ) : (
                <div>
                  <p className="font-semibold mb-2">Database issues detected:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {integrityResult.errors.map((error, idx) => (
                      <li key={idx} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Collections Grid */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Collections</CardTitle>
              <CardDescription>Overview of all data collections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.collections.map((collection) => {
                  const Icon = collectionIcons[collection.name] || Database
                  return (
                    <Card key={collection.name} className="hover:border-primary/50 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium capitalize">
                            {collection.name}
                          </CardTitle>
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Records</span>
                            <Badge variant="secondary">{collection.count}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Size</span>
                            <span className="text-xs font-medium">
                              {(collection.size / 1024).toFixed(2)} KB
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Management */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Promote or demote users to manage admin access</CardDescription>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="text-sm text-muted-foreground">Loading users…</div>
            ) : users.length === 0 ? (
              <div className="text-sm text-muted-foreground">No users found.</div>
            ) : (
              <div className="divide-y rounded-md border">
                {users.slice(0, 20).map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3">
                    <div>
                      <div className="font-medium">{u.name || u.username}</div>
                      <div className="text-xs text-muted-foreground">@{u.username} · {u.id}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                        {u.role === "admin" ? "Admin" : "User"}
                      </Badge>
                      <Button size="sm" variant={u.role === "admin" ? "outline" : "default"} onClick={() => toggleUserRole(u.id, u.role)}>
                        {u.role === "admin" ? "Demote" : "Promote"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clear Confirmation Dialog */}
        <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all data from the database. A backup will be created automatically
                before clearing, but this action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClear}
                className="bg-red-500 hover:bg-red-600"
              >
                Clear All Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
