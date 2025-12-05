/**
 * SetupEncryptionDialog
 * 
 * First-time setup dialog for E2EE.
 * Shown when user enables encryption for the first time.
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
import { AlertTriangle, Lock, Eye, EyeOff, Shield } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface SetupEncryptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSetup: (password: string) => Promise<void>
}

export function SetupEncryptionDialog({
  open,
  onOpenChange,
  onSetup,
}: SetupEncryptionDialogProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'warning' | 'password'>('warning')

  const handleSetup = async () => {
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      await onSetup(password)
      onOpenChange(false)
      // Reset state
      setPassword('')
      setConfirmPassword('')
      setStep('warning')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false)
      setPassword('')
      setConfirmPassword('')
      setStep('warning')
      setError(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            Enable End-to-End Encryption
          </DialogTitle>
          <DialogDescription>
            Your messages will be encrypted so only you and recipients can read them.
          </DialogDescription>
        </DialogHeader>

        {step === 'warning' ? (
          <>
            <Alert variant="destructive" className="border-amber-500 bg-amber-50 dark:bg-amber-950">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-amber-700 dark:text-amber-400">Important Warning</AlertTitle>
              <AlertDescription className="text-amber-600 dark:text-amber-300 space-y-2">
                <p>
                  <strong>If you forget your encryption password, your messages cannot be recovered.</strong>
                </p>
                <ul className="list-disc pl-4 space-y-1 text-sm">
                  <li>Your password is never sent to our servers</li>
                  <li>There is no "forgot password" recovery option</li>
                  <li>We cannot help you recover encrypted messages</li>
                  <li>Consider using a password manager</li>
                </ul>
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => setStep('password')}>
                I Understand, Continue
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Encryption Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9"
                    disabled={isLoading}
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
                <p className="text-xs text-muted-foreground">
                  Minimum 8 characters. Use a mix of letters, numbers, and symbols.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9"
                    disabled={isLoading}
                  />
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
                onClick={() => setStep('warning')}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button 
                onClick={handleSetup}
                disabled={isLoading || !password || !confirmPassword}
              >
                {isLoading ? 'Setting up...' : 'Enable Encryption'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default SetupEncryptionDialog
