"use client"

/**
 * Poll Components
 * Create and vote on polls in chat
 */

import { useState } from 'react'
import { Plus, X, BarChart3, Check, Clock, Users, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

// ============================================================================
// TYPES
// ============================================================================

export interface PollOption {
  id: string
  text: string
  votes: string[] // Array of user IDs
}

export interface Poll {
  id: string
  question: string
  options: PollOption[]
  type: 'single' | 'multiple'
  anonymous: boolean
  endsAt?: string
  closed: boolean
  createdBy: string
  createdAt: string
  totalVotes: number
}

// ============================================================================
// CREATE POLL DIALOG
// ============================================================================

interface CreatePollDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (poll: {
    question: string
    options: string[]
    type: 'single' | 'multiple'
    anonymous: boolean
    endsAt?: string
  }) => void
  isSubmitting?: boolean
}

export function CreatePollDialog({ 
  open, 
  onOpenChange, 
  onSubmit,
  isSubmitting = false 
}: CreatePollDialogProps) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [pollType, setPollType] = useState<'single' | 'multiple'>('single')
  const [anonymous, setAnonymous] = useState(false)
  const [hasExpiry, setHasExpiry] = useState(false)
  const [expiryDate, setExpiryDate] = useState('')

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ''])
    }
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = () => {
    const validOptions = options.filter(o => o.trim())
    if (!question.trim() || validOptions.length < 2) return

    onSubmit({
      question: question.trim(),
      options: validOptions,
      type: pollType,
      anonymous,
      endsAt: hasExpiry && expiryDate ? new Date(expiryDate).toISOString() : undefined,
    })

    // Reset form
    setQuestion('')
    setOptions(['', ''])
    setPollType('single')
    setAnonymous(false)
    setHasExpiry(false)
    setExpiryDate('')
  }

  const validOptions = options.filter(o => o.trim()).length
  const canSubmit = question.trim() && validOptions >= 2

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Create Poll
          </DialogTitle>
          <DialogDescription>
            Ask a question and let people vote
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Question */}
          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Input
              id="question"
              placeholder="What would you like to ask?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <Label>Options</Label>
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                />
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {options.length < 10 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            )}
          </div>

          {/* Settings */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow multiple choices</Label>
                <p className="text-xs text-muted-foreground">
                  Users can select more than one option
                </p>
              </div>
              <Switch
                checked={pollType === 'multiple'}
                onCheckedChange={(checked) => setPollType(checked ? 'multiple' : 'single')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Anonymous voting</Label>
                <p className="text-xs text-muted-foreground">
                  Hide who voted for what
                </p>
              </div>
              <Switch
                checked={anonymous}
                onCheckedChange={setAnonymous}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Set expiry</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically close poll at a time
                </p>
              </div>
              <Switch
                checked={hasExpiry}
                onCheckedChange={setHasExpiry}
              />
            </div>

            {hasExpiry && (
              <Input
                type="datetime-local"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Poll'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// POLL DISPLAY COMPONENT
// ============================================================================

interface PollDisplayProps {
  poll: Poll
  onVote: (optionId: string) => void
  onClose?: () => void
  className?: string
}

export function PollDisplay({ poll, onVote, onClose, className }: PollDisplayProps) {
  const { user } = useAuth()
  const userId = user?.id

  // Check if user has voted
  const userVotes = poll.options.flatMap(opt => 
    opt.votes.includes(userId || '') ? [opt.id] : []
  )
  const hasVoted = userVotes.length > 0

  // Calculate percentages
  const maxVotes = Math.max(...poll.options.map(o => o.votes.length), 1)

  // Check if poll is expired
  const isExpired = poll.endsAt ? new Date(poll.endsAt) < new Date() : false
  const isClosed = poll.closed || isExpired

  // Format remaining time
  const getRemainingTime = () => {
    if (!poll.endsAt) return null
    const remaining = new Date(poll.endsAt).getTime() - Date.now()
    if (remaining <= 0) return 'Ended'
    
    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d left`
    }
    if (hours > 0) return `${hours}h ${minutes}m left`
    return `${minutes}m left`
  }

  const handleVote = (optionId: string) => {
    if (isClosed) return
    
    // For single choice, just vote
    // For multiple choice, toggle
    if (poll.type === 'single' && hasVoted) return
    
    onVote(optionId)
  }

  return (
    <div className={cn(
      "bg-muted/30 border rounded-lg p-4 max-w-sm",
      className
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-primary">Poll</span>
          {poll.anonymous && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              Anonymous
            </span>
          )}
        </div>
        {poll.endsAt && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {getRemainingTime()}
          </span>
        )}
      </div>

      {/* Question */}
      <h4 className="font-medium mb-3">{poll.question}</h4>

      {/* Options */}
      <div className="space-y-2">
        {poll.options.map((option) => {
          const percentage = poll.totalVotes > 0 
            ? Math.round((option.votes.length / poll.totalVotes) * 100)
            : 0
          const isSelected = userVotes.includes(option.id)
          const showResults = hasVoted || isClosed

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={isClosed || (poll.type === 'single' && hasVoted && !isSelected)}
              className={cn(
                "w-full relative overflow-hidden rounded-md border p-2 text-left transition-all",
                isSelected 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50",
                (isClosed || (poll.type === 'single' && hasVoted)) && "cursor-default"
              )}
            >
              {/* Progress bar background */}
              {showResults && (
                <div 
                  className={cn(
                    "absolute inset-y-0 left-0 transition-all",
                    isSelected ? "bg-primary/20" : "bg-muted"
                  )}
                  style={{ width: `${percentage}%` }}
                />
              )}
              
              {/* Content */}
              <div className="relative flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                  <span className="text-sm">{option.text}</span>
                </div>
                {showResults && (
                  <span className="text-xs font-medium">
                    {percentage}%
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'}
        </span>
        {poll.type === 'multiple' && !isClosed && (
          <span>Select multiple</span>
        )}
        {isClosed && (
          <span className="text-amber-500">Poll closed</span>
        )}
      </div>

      {/* Close button for creator */}
      {onClose && userId === poll.createdBy && !isClosed && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="w-full mt-2"
        >
          Close Poll
        </Button>
      )}
    </div>
  )
}
