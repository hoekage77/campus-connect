import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

/**
 * VideoCacheService
 * 
 * Handles video storage, caching, and retrieval for Lumina animations
 */
export class VideoCacheService {
  private bucket = "lumina-videos"
  private supabase

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    )
  }

  /**
   * Generate cache key from Manim spec
   * Same spec → same key → cache hit
   */
  generateCacheKey(manimSpec: any): string {
    const normalized = JSON.stringify(manimSpec, Object.keys(manimSpec).sort())
    return crypto.createHash("sha256").update(normalized).digest("hex")
  }

  /**
   * Check if video exists in cache
   */
  async getCachedVideo(cacheKey: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from("lumina_video_cache")
        .select("video_url, created_at")
        .eq("cache_key", cacheKey)
        .single()

      if (error || !data) return null

      // Check if cache entry is still valid (e.g., 30 days)
      const age = Date.now() - new Date(data.created_at).getTime()
      const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days
      
      if (age > maxAge) {
        // Cache expired, delete it
        await this.deleteCachedVideo(cacheKey)
        return null
      }

      return data.video_url
    } catch (error) {
      console.error("[VideoCacheService] Cache lookup error:", error)
      return null
    }
  }

  /**
   * Store video in Supabase Storage and cache table
   */
  async storeVideo(
    cacheKey: string,
    videoBuffer: Buffer,
    manimSpec: any
  ): Promise<string> {
    try {
      const filename = `${cacheKey}.mp4`
      const filePath = `videos/${filename}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from(this.bucket)
        .upload(filePath, videoBuffer, {
          contentType: "video/mp4",
          upsert: true,
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.bucket)
        .getPublicUrl(filePath)

      const videoUrl = urlData.publicUrl

      // Store in cache table
      await this.supabase.from("lumina_video_cache").upsert({
        cache_key: cacheKey,
        video_url: videoUrl,
        manim_spec: manimSpec,
        created_at: new Date().toISOString(),
      })

      return videoUrl
    } catch (error) {
      console.error("[VideoCacheService] Store error:", error)
      throw error
    }
  }

  /**
   * Store video from URL (if Xera returns URL directly)
   */
  async cacheVideoUrl(
    cacheKey: string,
    videoUrl: string,
    manimSpec: any
  ): Promise<void> {
    try {
      await this.supabase.from("lumina_video_cache").upsert({
        cache_key: cacheKey,
        video_url: videoUrl,
        manim_spec: manimSpec,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("[VideoCacheService] Cache URL error:", error)
    }
  }

  /**
   * Delete cached video
   */
  async deleteCachedVideo(cacheKey: string): Promise<void> {
    try {
      // Delete from cache table
      await this.supabase
        .from("lumina_video_cache")
        .delete()
        .eq("cache_key", cacheKey)

      // Delete from storage
      const filePath = `videos/${cacheKey}.mp4`
      await this.supabase.storage.from(this.bucket).remove([filePath])
    } catch (error) {
      console.error("[VideoCacheService] Delete error:", error)
    }
  }

  /**
   * Get or create video with caching
   */
  async getOrRenderVideo(
    manimSpec: any,
    renderFn: () => Promise<{ url: string; buffer?: Buffer }>
  ): Promise<string> {
    const cacheKey = this.generateCacheKey(manimSpec)

    // Try cache first
    const cached = await this.getCachedVideo(cacheKey)
    if (cached) {
      console.log("[VideoCacheService] Cache hit:", cacheKey.slice(0, 8))
      return cached
    }

    // Cache miss, render new video
    console.log("[VideoCacheService] Cache miss, rendering:", cacheKey.slice(0, 8))
    const { url, buffer } = await renderFn()

    // Store in cache
    if (buffer) {
      return await this.storeVideo(cacheKey, buffer, manimSpec)
    } else {
      await this.cacheVideoUrl(cacheKey, url, manimSpec)
      return url
    }
  }
}

// Singleton
let videoCacheService: VideoCacheService | null = null

export function getVideoCacheService(): VideoCacheService {
  if (!videoCacheService) {
    videoCacheService = new VideoCacheService()
  }
  return videoCacheService
}
