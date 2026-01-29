'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { useQuery } from '@tanstack/react-query'
import type { ClockSession } from '@/types/game'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

interface LocalTimerState {
  status: 'RUNNING' | 'PAUSED'
  secondsRemaining: number
  currentPeriod: number
  lastUpdateTimestamp: number
}

interface UseLocalTimerReturn {
  displaySeconds: number
  currentPeriod: number
  status: 'RUNNING' | 'PAUSED'
  handleStart: () => void
  handlePause: () => void
  handleReset: () => void
  handleNextPeriod: () => void
  canAdvancePeriod: boolean
  isPendingSync: boolean
  syncFromServer: (session: ClockSession) => void
}

export function useLocalTimer(gameId: string): UseLocalTimerReturn {
  // Local state (source of truth for UI)
  const [localState, setLocalState] = useState<LocalTimerState>({
    status: 'PAUSED',
    secondsRemaining: 600,
    currentPeriod: 1,
    lastUpdateTimestamp: Date.now()
  })

  // Display seconds (updated every 100ms for smooth countdown)
  const [displaySeconds, setDisplaySeconds] = useState(600)

  // Pending sync state
  const [pendingSync, setPendingSync] = useState<LocalTimerState | null>(null)

  // Debounce timer ref for rapid clicks
  const debounceTimerRef = useRef<NodeJS.Timeout>()

  // setInterval ref for countdown
  const intervalRef = useRef<NodeJS.Timeout>()

  // Track if initialized from server
  const initializedRef = useRef(false)

  // Calculate current seconds from local state
  const calculateCurrentSeconds = useCallback(() => {
    if (localState.status === 'RUNNING') {
      const elapsedMs = Date.now() - localState.lastUpdateTimestamp
      return Math.max(0, localState.secondsRemaining - Math.floor(elapsedMs / 1000))
    }
    return localState.secondsRemaining
  }, [localState])

  // Debounced action handler
  const debouncedAction = useCallback((action: 'start' | 'pause' | 'reset') => {
    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Calculate current seconds for pause action
    const currentSeconds = action === 'reset' ? 600 : calculateCurrentSeconds()

    // Immediately update local state (instant UI feedback)
    const newState: LocalTimerState = {
      status: action === 'start' ? 'RUNNING' : 'PAUSED',
      secondsRemaining: currentSeconds,
      currentPeriod: localState.currentPeriod, // PRESERVE period
      lastUpdateTimestamp: Date.now()
    }
    setLocalState(newState)

    // Debounce server sync (500ms quiet period)
    debounceTimerRef.current = setTimeout(() => {
      setPendingSync(newState)
    }, 500)
  }, [calculateCurrentSeconds, localState.currentPeriod])

  // Public action handlers
  const handleStart = useCallback(() => {
    debouncedAction('start')
  }, [debouncedAction])

  const handlePause = useCallback(() => {
    debouncedAction('pause')
  }, [debouncedAction])

  const handleReset = useCallback(() => {
    debouncedAction('reset')
  }, [debouncedAction])

  const handleNextPeriod = useCallback(async () => {
    // Only allow if timer is at 0:00 and paused
    if (localState.status === 'RUNNING' || displaySeconds !== 0) {
      console.warn('Cannot advance period: timer must be paused at 0:00')
      return
    }

    try {
      const response = await apiClient(`/api/games/${gameId}/timer/next-period`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to advance period')
      }

      const { session } = await response.json()

      // Update local state
      setLocalState({
        status: 'PAUSED',
        secondsRemaining: 600,
        currentPeriod: session.currentPeriod,
        lastUpdateTimestamp: Date.now()
      })
      setDisplaySeconds(600)
    } catch (error) {
      console.error('Failed to advance period:', error)
    }
  }, [gameId, localState.status, displaySeconds])

  // Sync from server (for realtime updates from other clients)
  const syncFromServer = useCallback((session: ClockSession) => {
    // Only sync if local timer is paused (don't interrupt local control)
    if (localState.status === 'PAUSED') {
      const elapsedMs = Date.now() - new Date(session.systemTimestamp).getTime()
      const currentSeconds = session.status === 'RUNNING'
        ? Math.max(0, session.secondsRemaining - Math.floor(elapsedMs / 1000))
        : session.secondsRemaining

      setLocalState({
        status: session.status,
        secondsRemaining: currentSeconds,
        currentPeriod: session.currentPeriod, // Sync period
        lastUpdateTimestamp: Date.now()
      })
    }
  }, [localState.status])

  // Effect: Initialize from server on mount
  useEffect(() => {
    if (initializedRef.current) return

    const initializeTimer = async () => {
      try {
        const response = await apiClient(`/api/games/${gameId}`)
        if (!response.ok) return

        const game = await response.json()
        const clockSessions: ClockSession[] = game.clockSessions || []
        const latestSession = clockSessions[clockSessions.length - 1]

        if (latestSession) {
          const elapsedMs = Date.now() - new Date(latestSession.systemTimestamp).getTime()
          const currentSeconds = latestSession.status === 'RUNNING'
            ? Math.max(0, latestSession.secondsRemaining - Math.floor(elapsedMs / 1000))
            : latestSession.secondsRemaining

          setLocalState({
            status: latestSession.status,
            secondsRemaining: currentSeconds,
            currentPeriod: latestSession.currentPeriod, // Extract period
            lastUpdateTimestamp: Date.now()
          })
          setDisplaySeconds(currentSeconds)
        }

        initializedRef.current = true
      } catch (error) {
        console.error('Failed to initialize timer:', error)
        initializedRef.current = true // Mark as initialized even on error
      }
    }

    initializeTimer()
  }, [gameId])

  // Effect: Update display seconds every 100ms for smooth countdown
  useEffect(() => {
    if (localState.status === 'RUNNING') {
      intervalRef.current = setInterval(() => {
        const elapsedMs = Date.now() - localState.lastUpdateTimestamp
        const currentSeconds = Math.max(
          0,
          localState.secondsRemaining - Math.floor(elapsedMs / 1000)
        )

        setDisplaySeconds(currentSeconds)

        // Auto-pause at 0:00
        if (currentSeconds === 0 && localState.status === 'RUNNING') {
          debouncedAction('pause')
        }
      }, 100)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = undefined
      }
      setDisplaySeconds(localState.secondsRemaining)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = undefined
      }
    }
  }, [localState, debouncedAction])

  // Effect: Background sync to server
  useEffect(() => {
    if (!pendingSync) return

    const syncToServer = async () => {
      try {
        if (pendingSync.status === 'RUNNING') {
          const response = await apiClient(`/api/games/${gameId}/timer/start`, {
            method: 'POST',
          })
          if (!response.ok) {
            throw new Error('Failed to start timer')
          }
        } else {
          const response = await apiClient(`/api/games/${gameId}/timer/pause`, {
            method: 'POST',
            body: JSON.stringify({ secondsRemaining: pendingSync.secondsRemaining }),
          })
          if (!response.ok) {
            throw new Error('Failed to pause timer')
          }
        }
        setPendingSync(null) // Clear after successful sync
      } catch (error) {
        console.error('Timer sync failed:', error)
        // Keep pendingSync for retry - will attempt again on next change
      }
    }

    syncToServer()
  }, [pendingSync, gameId])

  // Effect: Sync on page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const shouldSync = pendingSync || localState.status === 'RUNNING'

      if (shouldSync) {
        // Best-effort sync using sendBeacon (non-blocking)
        const syncState = pendingSync || localState
        const currentSeconds = calculateCurrentSeconds()

        const payload = JSON.stringify({
          status: syncState.status,
          secondsRemaining: currentSeconds,
          timestamp: Date.now()
        })

        navigator.sendBeacon(
          `${API_URL}/api/games/${gameId}/timer/sync`,
          new Blob([payload], { type: 'application/json' })
        )

        // Optional: Show warning if timer is running
        if (localState.status === 'RUNNING') {
          e.preventDefault()
          e.returnValue = 'Timer is running. Close anyway?'
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [localState, pendingSync, gameId, calculateCurrentSeconds])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const canAdvancePeriod = localState.status === 'PAUSED' && displaySeconds === 0

  return {
    displaySeconds,
    currentPeriod: localState.currentPeriod,
    status: localState.status,
    handleStart,
    handlePause,
    handleReset,
    handleNextPeriod,
    canAdvancePeriod,
    isPendingSync: pendingSync !== null,
    syncFromServer
  }
}
