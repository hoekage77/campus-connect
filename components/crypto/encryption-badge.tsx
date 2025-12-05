/**
 * EncryptionBadge
 * 
 * Visual indicator showing encryption status.
 * Shows a lock icon with different states.
 */

'use client'

import { Lock, LockOpen, Shield, ShieldOff, ShieldCheck } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface EncryptionBadgeProps {
  encrypted: boolean
  unlocked?: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function EncryptionBadge({
  encrypted,
  unlocked = true,
  size = 'md',
  showLabel = false,
  className,
}: EncryptionBadgeProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const containerClasses = {
    sm: 'text-xs gap-1',
    md: 'text-sm gap-1.5',
    lg: 'text-base gap-2',
  }

  if (!encrypted) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('inline-flex items-center text-muted-foreground', containerClasses[size], className)}>
              <ShieldOff className={sizeClasses[size]} />
              {showLabel && <span>Not encrypted</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Messages are not end-to-end encrypted</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (!unlocked) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('inline-flex items-center text-amber-500', containerClasses[size], className)}>
              <Lock className={sizeClasses[size]} />
              {showLabel && <span>Locked</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Enter your encryption password to view messages</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('inline-flex items-center text-green-500', containerClasses[size], className)}>
            <ShieldCheck className={sizeClasses[size]} />
            {showLabel && <span>Encrypted</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>End-to-end encrypted. Only you and recipients can read these messages.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default EncryptionBadge
