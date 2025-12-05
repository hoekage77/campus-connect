/**
 * Space Jumbotron
 * 
 * Displays pinned/featured content in a space.
 * Hosts can pin announcements, resources, or important information.
 */

"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { 
  Pin, 
  X, 
  ExternalLink, 
  Megaphone, 
  Link2, 
  FileText,
  Plus,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { useState } from "react"

export interface FeaturedContent {
  id: string
  type: 'announcement' | 'resource' | 'link' | 'document'
  title: string
  content?: string
  url?: string
  pinnedBy: string
  pinnedAt: Date
}

interface SpaceJumbotronProps {
  content?: FeaturedContent | null
  isHost: boolean
  onDismiss?: () => void
  onAddContent?: () => void
  className?: string
}

export function SpaceJumbotron({
  content,
  isHost,
  onDismiss,
  onAddContent,
  className,
}: SpaceJumbotronProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // No content and not a host - don't show anything
  if (!content && !isHost) return null

  // Host but no content - show "Add content" prompt
  if (!content && isHost) {
    return (
      <div className={cn("w-full", className)}>
        <Button
          variant="outline"
          className="w-full h-12 border-dashed border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50 text-emerald-400"
          onClick={onAddContent}
        >
          <Plus className="h-4 w-4 mr-2" />
          Pin an announcement or resource for everyone
        </Button>
      </div>
    )
  }

  // Show pinned content
  const getIcon = () => {
    switch (content?.type) {
      case 'announcement': return <Megaphone className="h-4 w-4" />
      case 'resource': return <FileText className="h-4 w-4" />
      case 'link': return <Link2 className="h-4 w-4" />
      case 'document': return <FileText className="h-4 w-4" />
      default: return <Pin className="h-4 w-4" />
    }
  }

  const getTypeLabel = () => {
    switch (content?.type) {
      case 'announcement': return 'Announcement'
      case 'resource': return 'Resource'
      case 'link': return 'Link'
      case 'document': return 'Document'
      default: return 'Pinned'
    }
  }

  return (
    <div className={cn("w-full transition-all", className)}>
      <Card className={cn(
        "bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10",
        "border-emerald-500/30 backdrop-blur-xl shadow-2xl shadow-emerald-500/5",
        "overflow-hidden transition-all",
        isCollapsed && "py-0"
      )}>
        <CardHeader className="flex flex-row items-center justify-between py-2 px-4 space-y-0 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20">
              {getIcon()}
            </div>
            <span className="text-xs uppercase tracking-wider text-emerald-400 font-medium">
              {getTypeLabel()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-zinc-400 hover:text-white"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
            {isHost && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-zinc-400 hover:text-red-400"
                onClick={onDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        {!isCollapsed && (
          <CardContent className="py-3 px-4">
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-white">
                {content?.title}
              </h4>
              
              {content?.content && (
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {content.content}
                </p>
              )}
              
              {content?.url && (
                <a 
                  href={content.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-1.5 text-sm text-emerald-400",
                    "hover:text-emerald-300 hover:underline transition-colors"
                  )}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open resource
                </a>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

export default SpaceJumbotron
