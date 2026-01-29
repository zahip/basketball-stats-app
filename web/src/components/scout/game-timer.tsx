'use client'

import * as React from 'react'
import { Play, Pause, RotateCcw, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocalTimer } from '@/lib/hooks/use-local-timer'
import { supabase } from '@/lib/supabase'
import type { ClockSession } from '@/types/game'

interface GameTimerProps {
  gameId: string
  onTimerUpdate?: (seconds: number) => void
  onPeriodUpdate?: (period: number) => void
  className?: string
}

export function GameTimer({
  gameId,
  onTimerUpdate,
  onPeriodUpdate,
  className,
}: GameTimerProps) {
  const {
    displaySeconds,
    currentPeriod,
    status,
    handleStart,
    handlePause,
    handleReset,
    handleNextPeriod,
    canAdvancePeriod,
    isPendingSync,
    syncFromServer
  } = useLocalTimer(gameId)

  // Notify parent of timer updates
  React.useEffect(() => {
    onTimerUpdate?.(displaySeconds)
  }, [displaySeconds, onTimerUpdate])

  // Notify parent of period changes
  React.useEffect(() => {
    onPeriodUpdate?.(currentPeriod)
  }, [currentPeriod, onPeriodUpdate])

  // Subscribe to realtime timer updates from other clients
  React.useEffect(() => {
    if (!supabase) return

    const channel = supabase
      .channel(`game:${gameId}`)
      .on('broadcast', { event: 'TIMER_START' }, ({ payload }: { payload: { session: ClockSession } }) => {
        if (payload?.session) {
          syncFromServer(payload.session)
        }
      })
      .on('broadcast', { event: 'TIMER_PAUSE' }, ({ payload }: { payload: { session: ClockSession } }) => {
        if (payload?.session) {
          syncFromServer(payload.session)
        }
      })
      .on('broadcast', { event: 'TIMER_RESET' }, ({ payload }: { payload: { session: ClockSession } }) => {
        if (payload?.session) {
          syncFromServer(payload.session)
        }
      })
      .on('broadcast', { event: 'PERIOD_CHANGE' }, ({ payload }: { payload: { session: ClockSession } }) => {
        if (payload?.session) {
          syncFromServer(payload.session)
        }
      })
      .subscribe()

    return () => {
      if (supabase) {
        supabase.removeChannel(channel)
      }
    }
  }, [gameId, syncFromServer])

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Get period label (Q1, Q2, Q3, Q4, OT1, OT2, etc.)
  const getPeriodLabel = (period: number) => {
    if (period <= 4) return `Q${period}`
    return `OT${period - 4}`
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Period Badge */}
      <div className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">
        {getPeriodLabel(currentPeriod)}
      </div>

      {/* Timer Display */}
      <div
        className={cn(
          'font-mono text-2xl font-bold tabular-nums transition-colors',
          status === 'RUNNING' ? 'text-green-600' : 'text-orange-600',
          displaySeconds === 0 && 'text-red-600'
        )}
      >
        {formatTime(displaySeconds)}
      </div>

      {/* Sync Indicator */}
      {isPendingSync && (
        <span className="text-xs text-gray-400 ml-1">⏳</span>
      )}

      {/* Play/Pause Button */}
      <button
        onClick={status === 'RUNNING' ? handlePause : handleStart}
        disabled={displaySeconds === 0}
        className={cn(
          'p-2 rounded-lg transition-all active:scale-95',
          status === 'RUNNING'
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-orange-100 text-orange-700 hover:bg-orange-200',
          displaySeconds === 0 && 'opacity-50 cursor-not-allowed'
        )}
        aria-label={status === 'RUNNING' ? 'Pause timer' : 'Start timer'}
      >
        {status === 'RUNNING' ? <Pause size={18} /> : <Play size={18} />}
      </button>

      {/* Reset Button */}
      <button
        onClick={handleReset}
        className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all active:scale-95"
        aria-label="Reset timer to 10:00"
      >
        <RotateCcw size={18} />
      </button>

      {/* Next Period Button - Only shown at 0:00 */}
      {canAdvancePeriod && (
        <button
          onClick={handleNextPeriod}
          className="px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-all active:scale-95 flex items-center gap-1 text-sm font-semibold"
          aria-label="Advance to next period"
        >
          Next Period
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  )
}
