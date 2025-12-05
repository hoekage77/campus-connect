/**
 * Pin Content Dialog
 * 
 * Dialog for hosts to pin announcements or resources to a space.
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Megaphone, Link2, Loader2 } from "lucide-react"
import type { FeaturedContent } from "./jumbotron"

interface PinContentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (content: Omit<FeaturedContent, 'id' | 'pinnedBy' | 'pinnedAt'>) => Promise<void>
}

export function PinContentDialog({
  open,
  onOpenChange,
  onSubmit,
}: PinContentDialogProps) {
  const [type, setType] = useState<'announcement' | 'resource'>('announcement')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [url, setUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) return
    
    setIsSubmitting(true)
    try {
      await onSubmit({
        type,
        title: title.trim(),
        content: content.trim() || undefined,
        url: type === 'resource' ? url.trim() || undefined : undefined,
      })
      
      // Reset form
      setTitle('')
      setContent('')
      setUrl('')
      setType('announcement')
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isValid = title.trim().length > 0 && 
    (type === 'announcement' || (type === 'resource' && url.trim().length > 0))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-white">Pin Content</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Share an announcement or resource with everyone in the space.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={type} onValueChange={(v) => setType(v as any)} className="mt-4">
          <TabsList className="grid grid-cols-2 bg-zinc-900">
            <TabsTrigger 
              value="announcement" 
              className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
            >
              <Megaphone className="h-4 w-4 mr-2" />
              Announcement
            </TabsTrigger>
            <TabsTrigger 
              value="resource"
              className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
            >
              <Link2 className="h-4 w-4 mr-2" />
              Resource
            </TabsTrigger>
          </TabsList>

          <TabsContent value="announcement" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="announcement-title" className="text-zinc-300">Title</Label>
              <Input
                id="announcement-title"
                placeholder="e.g., Welcome to the study session!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="announcement-content" className="text-zinc-300">
                Message <span className="text-zinc-500">(optional)</span>
              </Label>
              <Textarea
                id="announcement-content"
                placeholder="Add more details..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 resize-none"
              />
            </div>
          </TabsContent>

          <TabsContent value="resource" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="resource-title" className="text-zinc-300">Title</Label>
              <Input
                id="resource-title"
                placeholder="e.g., Lecture slides"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resource-url" className="text-zinc-300">URL</Label>
              <Input
                id="resource-url"
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resource-description" className="text-zinc-300">
                Description <span className="text-zinc-500">(optional)</span>
              </Label>
              <Textarea
                id="resource-description"
                placeholder="Add a description..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={2}
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 resize-none"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-zinc-800 text-zinc-300 hover:bg-zinc-900"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Pinning...
              </>
            ) : (
              'Pin to Space'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PinContentDialog
