/**
 * KeyBackupDialog
 * 
 * Dialog for exporting and importing encryption keys.
 */

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Download, Upload, Copy, Check, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { KeyBackup } from '@/lib/crypto'

interface KeyBackupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport: () => Promise<KeyBackup | null>
  onImport: (backup: KeyBackup, password: string) => Promise<void>
  fingerprint?: string | null
}

export function KeyBackupDialog({
  open,
  onOpenChange,
  onExport,
  onImport,
  fingerprint,
}: KeyBackupDialogProps) {
  const [tab, setTab] = useState<'export' | 'import'>('export')
  const [exportedData, setExportedData] = useState<string | null>(null)
  const [importData, setImportData] = useState('')
  const [importPassword, setImportPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleExport = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const backup = await onExport()
      if (backup) {
        setExportedData(JSON.stringify(backup, null, 2))
      } else {
        setError('No keys to export')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!exportedData) return
    await navigator.clipboard.writeText(exportedData)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!exportedData) return
    const blob = new Blob([exportedData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `campus-connect-keys-backup-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async () => {
    setError(null)

    if (!importData.trim()) {
      setError('Please paste your backup data')
      return
    }

    if (!importPassword) {
      setError('Please enter your encryption password')
      return
    }

    setIsLoading(true)

    try {
      const backup = JSON.parse(importData) as KeyBackup
      await onImport(backup, importPassword)
      onOpenChange(false)
      // Reset state
      setImportData('')
      setImportPassword('')
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid backup data format')
      } else {
        setError(err instanceof Error ? err.message : 'Import failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false)
      setExportedData(null)
      setImportData('')
      setImportPassword('')
      setError(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Key Backup</DialogTitle>
          <DialogDescription>
            Export your encryption keys for backup, or import from a previous backup.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'export' | 'import')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            {fingerprint && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground mb-1">Key fingerprint:</p>
                <code className="text-sm font-mono">{fingerprint}</code>
              </div>
            )}

            {!exportedData ? (
              <div className="text-center py-8">
                <Download className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Export your encrypted keys to a backup file.
                </p>
                <Button onClick={handleExport} disabled={isLoading}>
                  {isLoading ? 'Exporting...' : 'Generate Backup'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Store this backup securely. Anyone with this file and your password can read your messages.
                  </AlertDescription>
                </Alert>

                <Textarea
                  value={exportedData}
                  readOnly
                  className="font-mono text-xs h-48"
                />

                <div className="flex gap-2">
                  <Button onClick={handleCopy} variant="outline" className="flex-1">
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button onClick={handleDownload} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-data">Backup Data</Label>
              <Textarea
                id="import-data"
                placeholder="Paste your backup JSON here..."
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="font-mono text-xs h-32"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="import-password">Encryption Password</Label>
              <Input
                id="import-password"
                type="password"
                placeholder="Enter your encryption password"
                value={importPassword}
                onChange={(e) => setImportPassword(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                This is the password you used when you first set up encryption.
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleImport} 
              disabled={isLoading || !importData || !importPassword}
              className="w-full"
            >
              {isLoading ? 'Importing...' : 'Import Keys'}
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default KeyBackupDialog
