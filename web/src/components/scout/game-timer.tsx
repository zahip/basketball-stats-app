'use client'

import * as React from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTimerControl } from '@/lib/hooks/use-game'
import type { ClockSession } from '@/types/game'

interface GameTimerProps {
  gameId: string
  clockSessions: ClockSession[]
  onTimerUpdate?: (seconds: number) => void
  className?: string
}

export function GameTimer({
  gameId,
  clockSessions,
  onTimerUpdate,
  className,
}: GameTimerProps) {
  // Helper to calculate clock state from sessions
  const getClockState = React.useCallback(() => {
    if (clockSessions.length === 0) {
      return { seconds: 600, isRunning: false }
    }

    const latest = clockSessions[clockSessions.length - 1]
    const isRunning = latest.status === 'RUNNING'

    if (!isRunning) {
      return { seconds: latest.secondsRemaining, isRunning: false }
    }

    // Calculate elapsed time since session started
    const elapsedMs = Date.now() - new Date(latest.systemTimestamp).getTime()
    const currentSeconds = Math.max(0, latest.secondsRemaining - Math.floor(elapsedMs / 1000))

    return { seconds: currentSeconds, isRunning: true }
  }, [clockSessions])

  const clockState = getClockState()
  const serverIsRunning = clockState.isRunning

  // Display value - calculated from server state
  const [displaySeconds, setDisplaySeconds] = React.useState(clockState.seconds)
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null)

  // Track pending mutations to avoid UI jumps
  const isPendingRef = React.useRef(false)

  const { startTimer, pauseTimer, resetTimer } = useTimerControl()

  // Calculate current seconds based on server state
  const calculateCurrentSeconds = React.useCallback(() => {
    return getClockState().seconds
  }, [getClockState])

  // Update display every 100ms for smooth countdown
  React.useEffect(() => {
    if (serverIsRunning && !isPendingRef.current) {
      intervalRef.current = setInterval(() => {
        const current = calculateCurrentSeconds()
        setDisplaySeconds(current)
        onTimerUpdate?.(current)

        // Auto-pause at 00:00
        if (current <= 0) {
          pauseTimer.mutate({ gameId, elapsedSeconds: 0 })
        }
      }, 100)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [serverIsRunning, calculateCurrentSeconds, onTimerUpdate, gameId, pauseTimer])

  // Sync display when server state changes (only if not pending)
  React.useEffect(() => {
    if (!isPendingRef.current) {
      const current = calculateCurrentSeconds()
      setDisplaySeconds(current)
      onTimerUpdate?.(current)
    }
  }, [calculateCurrentSeconds, onTimerUpdate])

  const handleStart = React.useCallback(() => {
    isPendingRef.current = true
    startTimer.mutate(
      { gameId },
      {
        onSettled: () => {
          isPendingRef.current = false
        },
      }
    )
  }, [gameId, startTimer])

  const handlePause = React.useCallback(() => {
    isPendingRef.current = true
    const currentSeconds = calculateCurrentSeconds()

    // Immediately stop the display countdown
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    pauseTimer.mutate(
      { gameId, elapsedSeconds: currentSeconds },
      {
        onSettled: () => {
          isPendingRef.current = false
        },
      }
    )
  }, [gameId, calculateCurrentSeconds, pauseTimer])

  const handleReset = React.useCallback(() => {
    isPendingRef.current = true
    setDisplaySeconds(600)
    resetTimer.mutate(
      { gameId },
      {
        onSettled: () => {
          isPendingRef.current = false
        },
      }
    )
  }, [gameId, resetTimer])

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Timer Display */}
      <div
        className={cn(
          'font-mono text-2xl font-bold tabular-nums transition-colors',
          serverIsRunning ? 'text-green-600' : 'text-orange-600',
          displaySeconds === 0 && 'text-red-600'
        )}
      >
        {formatTime(displaySeconds)}
      </div>

      {/* Play/Pause Button */}
      <button
        onClick={serverIsRunning ? handlePause : handleStart}
        disabled={displaySeconds === 0 || startTimer.isPending || pauseTimer.isPending}
        className={cn(
          'p-2 rounded-lg transition-all active:scale-95',
          serverIsRunning
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-orange-100 text-orange-700 hover:bg-orange-200',
          displaySeconds === 0 && 'opacity-50 cursor-not-allowed'
        )}
        aria-label={serverIsRunning ? 'Pause timer' : 'Start timer'}
      >
        {serverIsRunning ? <Pause size={18} /> : <Play size={18} />}
      </button>

      {/* Reset Button */}
      <button
        onClick={handleReset}
        disabled={resetTimer.isPending}
        className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
        aria-label="Reset timer to 10:00"
      >
        <RotateCcw size={18} />
      </button>
    </div>
  )
}
