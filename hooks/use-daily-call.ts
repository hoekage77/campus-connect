/**
 * useDailyCall Hook
 * 
 * Manages Daily.co call frame lifecycle, media controls, and participant sync.
 * Provides a unified interface for all Daily.co operations in a space.
 */

"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import DailyIframe, { DailyCall, DailyParticipant, DailyEventObjectActiveSpeakerChange } from '@daily-co/daily-js'

export interface DailyCallState {
  status: 'idle' | 'joining' | 'joined' | 'leaving' | 'left' | 'error'
  error?: string
  localAudio: boolean
  localVideo: boolean
  screenSharing: boolean
  activeSpeakerId?: string
  participants: Map<string, DailyParticipant>
}

export interface UseDailyCallOptions {
  roomUrl: string
  token?: string
  userName?: string
  containerRef: React.RefObject<HTMLDivElement | null>
  autoJoin?: boolean
  onJoined?: () => void
  onLeft?: () => void
  onError?: (error: string) => void
  onParticipantJoined?: (participant: DailyParticipant) => void
  onParticipantLeft?: (participant: DailyParticipant) => void
  onActiveSpeakerChange?: (speakerId: string | undefined) => void
}

export function useDailyCall(options: UseDailyCallOptions) {
  const {
    roomUrl,
    token,
    userName,
    containerRef,
    autoJoin = false,
    onJoined,
    onLeft,
    onError,
    onParticipantJoined,
    onParticipantLeft,
    onActiveSpeakerChange,
  } = options

  const callFrameRef = useRef<DailyCall | null>(null)
  const [state, setState] = useState<DailyCallState>({
    status: 'idle',
    localAudio: true,
    localVideo: false,
    screenSharing: false,
    participants: new Map(),
  })

  // Initialize and join call
  const join = useCallback(async () => {
    if (!containerRef.current || !roomUrl) return
    if (callFrameRef.current) {
      console.warn('[useDailyCall] Call frame already exists')
      return
    }

    setState(prev => ({ ...prev, status: 'joining' }))

    try {
      const callFrame = DailyIframe.createFrame(containerRef.current, {
        showLeaveButton: false,
        showFullscreenButton: false,
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: '0',
          borderRadius: '0.75rem',
          backgroundColor: 'transparent',
        },
      })

      // Register event handlers
      callFrame.on('joined-meeting', () => {
        setState(prev => ({ ...prev, status: 'joined' }))
        onJoined?.()
      })

      callFrame.on('left-meeting', () => {
        setState(prev => ({ ...prev, status: 'left', participants: new Map() }))
        onLeft?.()
      })

      callFrame.on('error', (event) => {
        const errorMsg = event?.error?.message || event?.errorMsg || 'Unknown error'
        setState(prev => ({ ...prev, status: 'error', error: errorMsg }))
        onError?.(errorMsg)
      })

      callFrame.on('participant-joined', (event) => {
        if (event?.participant) {
          setState(prev => {
            const newParticipants = new Map(prev.participants)
            newParticipants.set(event.participant.user_id, event.participant)
            return { ...prev, participants: newParticipants }
          })
          onParticipantJoined?.(event.participant)
        }
      })

      callFrame.on('participant-left', (event) => {
        if (event?.participant) {
          setState(prev => {
            const newParticipants = new Map(prev.participants)
            newParticipants.delete(event.participant.user_id)
            return { ...prev, participants: newParticipants }
          })
          onParticipantLeft?.(event.participant)
        }
      })

      callFrame.on('participant-updated', (event) => {
        if (event?.participant) {
          setState(prev => {
            const newParticipants = new Map(prev.participants)
            newParticipants.set(event.participant.user_id, event.participant)
            return { ...prev, participants: newParticipants }
          })
        }
      })

      callFrame.on('active-speaker-change', (event: DailyEventObjectActiveSpeakerChange) => {
        const speakerId = event?.activeSpeaker?.peerId
        setState(prev => ({ ...prev, activeSpeakerId: speakerId }))
        onActiveSpeakerChange?.(speakerId)
      })

      callFrameRef.current = callFrame

      // Join the meeting
      await callFrame.join({
        url: roomUrl,
        token,
        userName,
        startAudioOff: false,
        startVideoOff: true,
      })

      // Sync initial participants
      const participants = callFrame.participants()
      const participantMap = new Map<string, DailyParticipant>()
      Object.values(participants).forEach(p => {
        participantMap.set(p.user_id, p)
      })
      setState(prev => ({ ...prev, participants: participantMap }))

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to join call'
      setState(prev => ({ ...prev, status: 'error', error: errorMsg }))
      onError?.(errorMsg)
    }
  }, [roomUrl, token, userName, containerRef, onJoined, onLeft, onError, onParticipantJoined, onParticipantLeft, onActiveSpeakerChange])

  // Leave call
  const leave = useCallback(async () => {
    if (!callFrameRef.current) return

    setState(prev => ({ ...prev, status: 'leaving' }))

    try {
      await callFrameRef.current.leave()
      callFrameRef.current.destroy()
      callFrameRef.current = null
    } catch (error) {
      console.error('[useDailyCall] Error leaving:', error)
    }
  }, [])

  // Toggle local audio
  const toggleAudio = useCallback(async () => {
    const callFrame = callFrameRef.current
    if (!callFrame) return

    const newState = !state.localAudio
    callFrame.setLocalAudio(newState)
    setState(prev => ({ ...prev, localAudio: newState }))
    return newState
  }, [state.localAudio])

  // Toggle local video
  const toggleVideo = useCallback(async () => {
    const callFrame = callFrameRef.current
    if (!callFrame) return

    const newState = !state.localVideo
    callFrame.setLocalVideo(newState)
    setState(prev => ({ ...prev, localVideo: newState }))
    return newState
  }, [state.localVideo])

  // Toggle screen sharing
  const toggleScreenShare = useCallback(async () => {
    const callFrame = callFrameRef.current
    if (!callFrame) return

    try {
      if (state.screenSharing) {
        callFrame.stopScreenShare()
        setState(prev => ({ ...prev, screenSharing: false }))
      } else {
        await callFrame.startScreenShare()
        setState(prev => ({ ...prev, screenSharing: true }))
      }
    } catch (error) {
      console.error('[useDailyCall] Screen share error:', error)
    }
  }, [state.screenSharing])

  // Set specific audio state
  const setAudio = useCallback((enabled: boolean) => {
    const callFrame = callFrameRef.current
    if (!callFrame) return

    callFrame.setLocalAudio(enabled)
    setState(prev => ({ ...prev, localAudio: enabled }))
  }, [])

  // Set specific video state
  const setVideo = useCallback((enabled: boolean) => {
    const callFrame = callFrameRef.current
    if (!callFrame) return

    callFrame.setLocalVideo(enabled)
    setState(prev => ({ ...prev, localVideo: enabled }))
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callFrameRef.current) {
        try {
          callFrameRef.current.leave()
          callFrameRef.current.destroy()
        } catch {}
        callFrameRef.current = null
      }
    }
  }, [])

  return {
    // State
    status: state.status,
    isConnected: state.status === 'joined',
    audioEnabled: state.localAudio,
    videoEnabled: state.localVideo,
    screenSharing: state.screenSharing,
    activeSpeakerId: state.activeSpeakerId,
    participants: Array.from(state.participants.values()),
    error: state.error,
    // Raw state and call frame
    state,
    callFrame: callFrameRef.current,
    // Actions
    join,
    leave,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    setAudio,
    setVideo,
  }
}

export default useDailyCall
