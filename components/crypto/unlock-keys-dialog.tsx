/**
 * UnlockKeysDialog
 * 
 * Dialog for unlocking encryption keys (returning user).
 * Shown when user needs to enter their encryption password.
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
import { Lock, Eye, EyeOff, KeyRound, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface UnlockKeysDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUnlock: (password: string) => Promise<void>
  fingerprint?: string | null
}

export function UnlockKeysDialog({
  open,
  onOpenChange,
  onUnlock,
  fingerprint,
}: UnlockKeysDialogProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUnlock = async () => {
    if (!password) return

    setError(null)
    setIsLoading(true)

    try {
      await onUnlock(password)
      onOpenChange(false)
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && password) {
      handleUnlock()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-blue-500" />
            Unlock Encryption
          </DialogTitle>
          <DialogDescription>
            Enter your encryption password to view encrypted messages.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {fingerprint && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs text-muted-foreground mb-1">Your key fingerprint:</p>
              <code className="text-sm font-mono">{fingerprint}</code>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="unlock-password">Encryption Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="unlock-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your encryption password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9 pr-9"
                disabled={isLoading}
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUnlock}
            disabled={isLoading || !password}
          >
            {isLoading ? 'Unlocking...' : 'Unlock'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default UnlockKeysDialog
