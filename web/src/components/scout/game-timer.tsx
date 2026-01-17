'use client'

import * as React from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTimerControl } from '@/lib/hooks/use-game'

interface GameTimerProps {
  gameId: string
  initialSeconds: number
  isRunning: boolean
  onTimerUpdate?: (seconds: number) => void
  className?: string
}

export function GameTimer({
  gameId,
  initialSeconds,
  isRunning: initialIsRunning,
  onTimerUpdate,
  className,
}: GameTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = React.useState(initialSeconds)
  const [isRunning, setIsRunning] = React.useState(initialIsRunning)
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null)

  const { startTimer, pauseTimer, resetTimer } = useTimerControl(gameId)

  // Countdown interval - runs every second
  React.useEffect(() => {
    if (isRunning && elapsedSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev - 1
          if (next <= 0) {
            // Auto-pause at 00:00
            handlePause()
            return 0
          }
          return next
        })
      }, 1000) // Update every second
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
  }, [isRunning, elapsedSeconds])

  // Notify parent when timer value changes
  React.useEffect(() => {
    onTimerUpdate?.(elapsedSeconds)
  }, [elapsedSeconds, onTimerUpdate])

  const handleStart = React.useCallback(() => {
    setIsRunning(true)
    startTimer.mutate({ gameId })
  }, [gameId, startTimer])

  const handlePause = React.useCallback(() => {
    setIsRunning(false)
    pauseTimer.mutate({ gameId, elapsedSeconds })
  }, [gameId, elapsedSeconds, pauseTimer])

  const handleReset = React.useCallback(() => {
    setElapsedSeconds(600)
    setIsRunning(false)
    resetTimer.mutate({ gameId })
  }, [gameId, resetTimer])

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Sync state when props change (from real-time updates)
  React.useEffect(() => {
    setElapsedSeconds(initialSeconds)
    setIsRunning(initialIsRunning)
  }, [initialSeconds, initialIsRunning])

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Timer Display */}
      <div
        className={cn(
          'font-mono text-2xl font-bold tabular-nums transition-colors',
          isRunning ? 'text-green-600' : 'text-orange-600',
          elapsedSeconds === 0 && 'text-red-600'
        )}
      >
        {formatTime(elapsedSeconds)}
      </div>

      {/* Play/Pause Button */}
      <button
        onClick={isRunning ? handlePause : handleStart}
        disabled={elapsedSeconds === 0 || startTimer.isPending || pauseTimer.isPending}
        className={cn(
          'p-2 rounded-lg transition-all active:scale-95',
          isRunning
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-orange-100 text-orange-700 hover:bg-orange-200',
          elapsedSeconds === 0 && 'opacity-50 cursor-not-allowed'
        )}
        aria-label={isRunning ? 'Pause timer' : 'Start timer'}
      >
        {isRunning ? <Pause size={18} /> : <Play size={18} />}
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
