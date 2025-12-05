"use client"

/**
 * GIF Picker Component
 * Uses Tenor API for GIF search
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

// Tenor API key - in production, move to env variable
const TENOR_API_KEY = process.env.NEXT_PUBLIC_TENOR_API_KEY || 'AIzaSyBqRpzDAl-qDsba6s5ZoN7qwDq0jbYfALs' // Free tier key

interface TenorGif {
  id: string
  title: string
  media_formats: {
    gif: { url: string; dims: [number, number] }
    tinygif: { url: string; dims: [number, number] }
    nanogif: { url: string; dims: [number, number] }
  }
}

interface GifPickerProps {
  onSelect: (gif: { url: string; thumbnailUrl: string; width: number; height: number; provider: string }) => void
  trigger?: React.ReactNode
  className?: string
}

export function GifPicker({ onSelect, trigger, className }: GifPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [gifs, setGifs] = useState<TenorGif[]>([])
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<{ searchterm: string; image: string }[]>([])
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // Load trending/featured on open
  useEffect(() => {
    if (open && gifs.length === 0 && !search) {
      loadTrending()
      loadCategories()
    }
  }, [open])

  const loadTrending = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&limit=20&media_filter=gif,tinygif`
      )
      const data = await res.json()
      setGifs(data.results || [])
    } catch (err) {
      console.error('Failed to load trending GIFs:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const res = await fetch(
        `https://tenor.googleapis.com/v2/categories?key=${TENOR_API_KEY}&type=trending`
      )
      const data = await res.json()
      setCategories((data.tags || []).slice(0, 8))
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  const searchGifs = useCallback(async (query: string) => {
    if (!query.trim()) {
      loadTrending()
      return
    }

    setLoading(true)
    try {
      const res = await fetch(
        `https://tenor.googleapis.com/v2/search?key=${TENOR_API_KEY}&q=${encodeURIComponent(query)}&limit=30&media_filter=gif,tinygif`
      )
      const data = await res.json()
      setGifs(data.results || [])
    } catch (err) {
      console.error('Failed to search GIFs:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }
    searchTimeout.current = setTimeout(() => {
      searchGifs(search)
    }, 300)

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }
    }
  }, [search, searchGifs])

  const handleSelect = (gif: TenorGif) => {
    const format = gif.media_formats.gif || gif.media_formats.tinygif
    const thumbnail = gif.media_formats.tinygif || gif.media_formats.nanogif || format
    
    onSelect({
      url: format.url,
      thumbnailUrl: thumbnail.url,
      width: format.dims[0],
      height: format.dims[1],
      provider: 'tenor',
    })
    setOpen(false)
    setSearch('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className={cn("h-8 w-8", className)}>
            <span className="text-lg">GIF</span>
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="start"
        side="top"
      >
        <div className="flex flex-col h-[400px]">
          {/* Search */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Tenor"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
              {search && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => setSearch('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Categories (when not searching) */}
          {!search && categories.length > 0 && (
            <div className="flex gap-1 p-2 overflow-x-auto border-b">
              {categories.map((cat) => (
                <button
                  key={cat.searchterm}
                  onClick={() => setSearch(cat.searchterm)}
                  className="px-2 py-1 text-xs bg-muted rounded-full hover:bg-muted/80 whitespace-nowrap"
                >
                  {cat.searchterm}
                </button>
              ))}
            </div>
          )}

          {/* GIF Grid */}
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : gifs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                {search ? 'No GIFs found' : 'Search for GIFs'}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {gifs.map((gif) => {
                  const preview = gif.media_formats.tinygif || gif.media_formats.nanogif
                  return (
                    <button
                      key={gif.id}
                      onClick={() => handleSelect(gif)}
                      className="relative aspect-video overflow-hidden rounded-md hover:ring-2 hover:ring-primary transition-all"
                    >
                      <img
                        src={preview?.url}
                        alt={gif.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Tenor attribution */}
          <div className="p-2 border-t text-center">
            <span className="text-[10px] text-muted-foreground">
              Powered by Tenor
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * GIF Message Display
 */
interface GifMessageProps {
  url: string
  thumbnailUrl?: string
  width?: number
  height?: number
  className?: string
}

export function GifMessage({ url, thumbnailUrl, width, height, className }: GifMessageProps) {
  const [loaded, setLoaded] = useState(false)
  
  // Calculate aspect ratio for proper sizing
  const aspectRatio = width && height ? width / height : 16 / 9
  const maxWidth = 300
  const displayWidth = Math.min(maxWidth, width || maxWidth)
  const displayHeight = displayWidth / aspectRatio

  return (
    <div 
      className={cn("relative overflow-hidden rounded-lg", className)}
      style={{ width: displayWidth, height: displayHeight }}
    >
      {!loaded && thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt="GIF loading..."
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <img
        src={url}
        alt="GIF"
        className={cn(
          "w-full h-full object-cover transition-opacity",
          loaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}
