"use client"

/**
 * Voice Message Components
 * - VoiceRecorder: Record audio messages
 * - VoicePlayer: Play back voice messages with waveform
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Mic, Square, Play, Pause, Trash2, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ============================================================================
// VOICE RECORDER
// ============================================================================

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void
  onCancel: () => void
  maxDuration?: number // in seconds
  className?: string
}

export function VoiceRecorder({ 
  onRecordingComplete, 
  onCancel,
  maxDuration = 120, // 2 minutes default
  className 
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Auto-stop at max duration
  useEffect(() => {
    if (duration >= maxDuration && isRecording) {
      stopRecording()
    }
  }, [duration, maxDuration, isRecording])

  const startRecording = async () => {
    try {
      setError(null)
      audioChunksRef.current = []
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      })
      
      streamRef.current = stream

      // Set up audio analyzer for visualization
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      // Start level monitoring
      const updateLevel = () => {
        if (!analyserRef.current) return
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        setAudioLevel(average / 255)
        animationRef.current = requestAnimationFrame(updateLevel)
      }
      updateLevel()

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : 'audio/mp4'
      })
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType 
        })
        onRecordingComplete(audioBlob, duration)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)
      setDuration(0)

      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1)
      }, 1000)

    } catch (err) {
      console.error('Failed to start recording:', err)
      setError('Microphone access denied')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    setIsRecording(false)
    setIsPaused(false)
    setAudioLevel(0)
  }

  const cancelRecording = () => {
    stopRecording()
    audioChunksRef.current = []
    setDuration(0)
    onCancel()
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <div className={cn("flex items-center gap-2 p-3 bg-destructive/10 rounded-lg", className)}>
        <span className="text-sm text-destructive">{error}</span>
        <Button variant="ghost" size="sm" onClick={() => setError(null)}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-3 p-3 bg-muted/50 rounded-lg", className)}>
      {!isRecording ? (
        // Not recording - show start button
        <>
          <Button
            variant="default"
            size="icon"
            className="h-10 w-10 rounded-full bg-red-500 hover:bg-red-600"
            onClick={startRecording}
          >
            <Mic className="h-5 w-5" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Tap to record (max {Math.floor(maxDuration / 60)}:{(maxDuration % 60).toString().padStart(2, '0')})
          </span>
          <Button variant="ghost" size="sm" onClick={onCancel} className="ml-auto">
            Cancel
          </Button>
        </>
      ) : (
        // Recording in progress
        <>
          {/* Audio level indicator */}
          <div className="relative">
            <div 
              className="absolute inset-0 bg-red-500/30 rounded-full animate-ping"
              style={{ transform: `scale(${1 + audioLevel * 0.5})` }}
            />
            <Button
              variant="destructive"
              size="icon"
              className="h-10 w-10 rounded-full relative z-10"
              onClick={stopRecording}
            >
              <Square className="h-4 w-4 fill-current" />
            </Button>
          </div>

          {/* Waveform visualization */}
          <div className="flex-1 flex items-center gap-0.5 h-8">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-red-500 rounded-full transition-all duration-75"
                style={{
                  height: `${Math.max(4, Math.random() * audioLevel * 100)}%`,
                  opacity: 0.5 + audioLevel * 0.5,
                }}
              />
            ))}
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-red-500">
              {formatDuration(duration)}
            </span>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>

          {/* Cancel button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={cancelRecording}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  )
}

// ============================================================================
// VOICE PLAYER
// ============================================================================

interface VoicePlayerProps {
  src: string
  duration?: number
  waveformData?: number[] // Pre-computed waveform data
  className?: string
  isOwnMessage?: boolean
}

export function VoicePlayer({ 
  src, 
  duration: initialDuration,
  waveformData,
  className,
  isOwnMessage = false
}: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(initialDuration || 0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Reset state when src changes
    setIsPlaying(false)
    setCurrentTime(0)
    setIsLoading(true)
    setError(null)

    if (!src) {
      setError('No audio source')
      setIsLoading(false)
      return
    }

    // Create audio element
    const audio = new Audio()
    audioRef.current = audio

    // Set up event handlers before setting src
    const handleLoadedMetadata = () => {
      console.log('[VoicePlayer] Audio loaded, duration:', audio.duration)
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
      setIsLoading(false)
    }

    const handleCanPlay = () => {
      console.log('[VoicePlayer] Audio can play')
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleError = (e: Event) => {
      const audioError = (e.target as HTMLAudioElement)?.error
      console.error('[VoicePlayer] Audio error:', audioError?.message || 'Unknown error', audioError?.code)
      setError(audioError?.message || 'Failed to load audio')
      setIsLoading(false)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    // Set preload and src
    audio.preload = 'metadata'
    audio.src = src

    // Force load
    audio.load()

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [src])

  const togglePlay = async () => {
    if (!audioRef.current) {
      console.error('[VoicePlayer] No audio ref')
      return
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      try {
        await audioRef.current.play()
        setIsPlaying(true)
      } catch (err) {
        console.error('[VoicePlayer] Play error:', err)
        setError('Failed to play audio')
      }
    }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current) return

    const rect = progressRef.current.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * duration
    
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // Generate default waveform if none provided - memoize to prevent re-render
  const bars = useMemo(() => {
    return waveformData || Array.from({ length: 30 }, () => Math.random() * 0.7 + 0.3)
  }, [waveformData])

  if (error) {
    return (
      <div className={cn("flex items-center gap-2 p-2 text-muted-foreground text-sm", className)}>
        <Mic className="h-4 w-4" />
        <span title={error}>Voice message unavailable</span>
      </div>
    )
  }

  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-2 min-w-[200px] max-w-[280px]",
        className
      )}
    >
      {/* Play/Pause button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-10 w-10 rounded-full shrink-0",
          isOwnMessage 
            ? "bg-primary-foreground/20 hover:bg-primary-foreground/30" 
            : "bg-primary/10 hover:bg-primary/20"
        )}
        onClick={togglePlay}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5 ml-0.5" />
        )}
      </Button>

      {/* Waveform & Progress */}
      <div className="flex-1 flex flex-col gap-1">
        <div 
          ref={progressRef}
          className="flex items-center gap-0.5 h-6 cursor-pointer"
          onClick={seek}
        >
          {bars.map((height, i) => {
            const barProgress = (i / bars.length) * 100
            const isPlayed = barProgress <= progress
            
            return (
              <div
                key={i}
                className={cn(
                  "flex-1 rounded-full transition-colors",
                  isPlayed
                    ? isOwnMessage 
                      ? "bg-primary-foreground" 
                      : "bg-primary"
                    : isOwnMessage
                      ? "bg-primary-foreground/30"
                      : "bg-primary/30"
                )}
                style={{ height: `${height * 100}%` }}
              />
            )
          })}
        </div>

        {/* Time */}
        <div className="flex justify-between text-[10px] opacity-70">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// VOICE MESSAGE BUTTON (for input area)
// ============================================================================

interface VoiceMessageButtonProps {
  onSend: (audioBlob: Blob, duration: number) => Promise<void>
  disabled?: boolean
  className?: string
}

export function VoiceMessageButton({ onSend, disabled, className }: VoiceMessageButtonProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
    setIsSending(true)
    try {
      await onSend(audioBlob, duration)
    } finally {
      setIsSending(false)
      setIsRecording(false)
    }
  }

  if (isRecording) {
    return (
      <div className="absolute bottom-full left-0 right-0 mb-2 z-50">
        <VoiceRecorder
          onRecordingComplete={handleRecordingComplete}
          onCancel={() => setIsRecording(false)}
        />
      </div>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("h-9 w-9 rounded-full", className)}
      onClick={() => setIsRecording(true)}
      disabled={disabled || isSending}
      title="Record voice message"
    >
      {isSending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  )
}
