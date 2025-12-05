/**
 * Split-Screen Layout
 * 
 * Used for study-session, project-collab, and peer-review spaces.
 * Shows video grid on one side and a content panel on the other.
 */

"use client"

import { cn } from "@/lib/utils"
import { VideoGridLayout } from "./video-grid-layout"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2, GripVertical } from "lucide-react"
import { useState } from "react"
import type { SpaceFeaturePanel } from "./index"
import type { SpaceLayoutParticipant } from "@/types/spaces"

interface SplitScreenLayoutProps {
  participants: SpaceLayoutParticipant[]
  activeSpeakerId?: string
  currentUserId?: string
  hostId?: string
  contentPanel: SpaceFeaturePanel
  children?: React.ReactNode // Content panel component
  className?: string
}

export function SplitScreenLayout({
  participants,
  activeSpeakerId,
  currentUserId,
  hostId,
  contentPanel,
  children,
  className,
}: SplitScreenLayoutProps) {
  const [panelWidth, setPanelWidth] = useState(50) // percentage
  const [isVideoExpanded, setIsVideoExpanded] = useState(false)

  const getPanelTitle = () => {
    switch (contentPanel) {
      case 'whiteboard': return 'Whiteboard'
      case 'board': return 'Project Board'
      case 'pdf-viewer': return 'Document'
      case 'slides': return 'Slides'
      case 'files': return 'Files'
      default: return 'Content'
    }
  }

  if (isVideoExpanded) {
    return (
      <div className={cn("relative h-full", className)}>
        <VideoGridLayout
          participants={participants}
          activeSpeakerId={activeSpeakerId}
          currentUserId={currentUserId}
          hostId={hostId}
        />
        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 right-4 bg-zinc-900/80 backdrop-blur border-white/10 hover:bg-zinc-800"
          onClick={() => setIsVideoExpanded(false)}
        >
          <Minimize2 className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("flex h-full gap-3 p-4", className)}>
      {/* Video Panel - Left */}
      <div 
        className="relative bg-zinc-900/50 rounded-2xl border border-white/5 overflow-hidden"
        style={{ width: `${100 - panelWidth}%` }}
      >
        <VideoGridLayout
          participants={participants}
          activeSpeakerId={activeSpeakerId}
          currentUserId={currentUserId}
          hostId={hostId}
          compact={panelWidth > 50}
        />
        
        {/* Expand button */}
        <Button
          variant="outline"
          size="icon"
          className="absolute top-3 right-3 h-8 w-8 bg-zinc-900/80 backdrop-blur border-white/10 hover:bg-zinc-800"
          onClick={() => setIsVideoExpanded(true)}
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Resize Handle */}
      <div 
        className="flex items-center justify-center w-2 cursor-col-resize group"
        onMouseDown={(e) => {
          e.preventDefault()
          const startX = e.clientX
          const startWidth = panelWidth
          
          const onMouseMove = (e: MouseEvent) => {
            const diff = e.clientX - startX
            const containerWidth = (e.target as HTMLElement)?.parentElement?.offsetWidth || 1000
            const newWidth = startWidth - (diff / containerWidth * 100)
            setPanelWidth(Math.min(Math.max(newWidth, 30), 70))
          }
          
          const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('mouseup', onMouseUp)
          }
          
          document.addEventListener('mousemove', onMouseMove)
          document.addEventListener('mouseup', onMouseUp)
        }}
      >
        <div className="h-16 w-1 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors" />
      </div>

      {/* Content Panel - Right */}
      <div 
        className="bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden flex flex-col"
        style={{ width: `${panelWidth}%` }}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-zinc-900/80">
          <h3 className="text-sm font-medium text-zinc-200">{getPanelTitle()}</h3>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-white">
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        
        {/* Panel Content */}
        <div className="flex-1 overflow-auto">
          {children || (
            <ContentPanelPlaceholder type={contentPanel} />
          )}
        </div>
      </div>
    </div>
  )
}

function ContentPanelPlaceholder({ type }: { type: SpaceFeaturePanel }) {
  const getPlaceholderContent = () => {
    switch (type) {
      case 'whiteboard':
        return {
          icon: '🎨',
          title: 'Whiteboard',
          description: 'Collaborative drawing and annotation',
        }
      case 'board':
        return {
          icon: '📋',
          title: 'Project Board',
          description: 'Kanban board for task management',
        }
      case 'pdf-viewer':
        return {
          icon: '📄',
          title: 'Document Viewer',
          description: 'View and annotate documents',
        }
      case 'slides':
        return {
          icon: '📊',
          title: 'Slides',
          description: 'Presentation slides',
        }
      case 'files':
        return {
          icon: '📁',
          title: 'Files',
          description: 'Shared files and resources',
        }
      default:
        return {
          icon: '📝',
          title: 'Content',
          description: 'Content panel',
        }
    }
  }

  const content = getPlaceholderContent()

  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500">
      <span className="text-5xl mb-4">{content.icon}</span>
      <h4 className="text-lg font-medium text-zinc-300 mb-2">{content.title}</h4>
      <p className="text-sm">{content.description}</p>
      <p className="text-xs mt-4 text-zinc-600">Coming soon</p>
    </div>
  )
}

export default SplitScreenLayout
