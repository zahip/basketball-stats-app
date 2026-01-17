'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { History } from 'lucide-react'
import type { Game } from '@/types/game'

interface GameHeaderProps {
  game: Game
  currentQuarter: number
  onQuarterChange: (quarter: number) => void
  onHistoryClick: () => void
  className?: string
}

// Get short team name (first 3 letters or abbreviation)
function getTeamAbbrev(name: string): string {
  return name.slice(0, 3).toUpperCase()
}

export function GameHeader({ game, currentQuarter, onQuarterChange, onHistoryClick, className }: GameHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center h-[9vh] px-2 sm:px-4 bg-slate-950 border-b border-slate-800/50 gap-2',
        className
      )}
    >
      {/* Status indicator */}
      <div className="flex items-center gap-2 shrink-0">
        <div
          className={cn(
            'w-2.5 h-2.5 rounded-full transition-all',
            game.status === 'LIVE' && 'bg-emerald-500 animate-pulse',
            game.status === 'SCHEDULED' && 'bg-amber-500',
            game.status === 'FINISHED' && 'bg-slate-500'
          )}
        />
        {game.status === 'LIVE' && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 hidden sm:inline">
            Live
          </span>
        )}
      </div>

      {/* Score display - responsive sizing */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-1 justify-center min-w-0">
        <span className="text-xs sm:text-sm font-bold text-violet-400 uppercase tracking-wide">
          {getTeamAbbrev(game.homeTeam.name)}
        </span>
        <span className="text-2xl sm:text-4xl font-bold tabular-nums text-slate-50 min-w-[2ch] text-center">
          {game.scoreHome}
        </span>
        <span className="text-slate-600 text-sm sm:text-lg font-medium">–</span>
        <span className="text-2xl sm:text-4xl font-bold tabular-nums text-slate-50 min-w-[2ch] text-center">
          {game.scoreAway}
        </span>
        <span className="text-xs sm:text-sm font-bold text-sky-400 uppercase tracking-wide">
          {getTeamAbbrev(game.awayTeam.name)}
        </span>
      </div>

      {/* History button */}
      <button
        onClick={onHistoryClick}
        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors shrink-0"
        aria-label="View history"
      >
        <History size={18} className="sm:w-5 sm:h-5" />
      </button>

      {/* Quarter selector - compact on mobile */}
      <div className="flex gap-1 sm:gap-1.5 shrink-0">
        {[1, 2, 3, 4].map((quarter) => (
          <button
            key={quarter}
            onClick={() => onQuarterChange(quarter)}
            className={cn(
              'w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm font-bold rounded transition-all active:scale-95',
              currentQuarter === quarter
                ? 'bg-violet-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            )}
          >
            {quarter}
          </button>
        ))}
      </div>
    </div>
  )
}
