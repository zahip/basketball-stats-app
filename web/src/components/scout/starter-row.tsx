'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { Player } from '@/types/game'

interface StarterRowProps {
  player: Player
  isHome: boolean
  isSelected: boolean
  foulCount: number
  onClick: () => void
  className?: string
}

// Helper to get short name (last name, first 3 chars)
function getShortName(fullName: string): string {
  const parts = fullName.trim().split(' ')
  const lastName = parts[parts.length - 1]
  return lastName.slice(0, 8).toUpperCase()
}

/**
 * StarterRow - Compact row display for on-court players
 * Shows jersey number, name, position, and foul dots
 */
export function StarterRow({ player, isHome, isSelected, foulCount, onClick, className }: StarterRowProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between px-2 py-1.5',
        'border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors',
        'text-left',
        isSelected && [
          'bg-violet-900/30 border-l-4',
          isHome ? 'border-l-violet-500' : 'border-l-sky-500',
        ],
        className
      )}
    >
      {/* Jersey Number Circle */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
          isHome ? 'bg-violet-500/20 text-violet-400' : 'bg-sky-500/20 text-sky-400'
        )}
      >
        {player.jerseyNumber}
      </div>

      {/* Name and Position */}
      <div className="flex-1 ml-2 min-w-0">
        <div className="text-sm font-semibold text-slate-200 truncate">{getShortName(player.name)}</div>
        <div className="text-[10px] text-slate-500">{player.position}</div>
      </div>

      {/* Foul Dots */}
      <div className="flex gap-0.5 shrink-0">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              'w-1.5 h-1.5 rounded-full transition-colors',
              i < foulCount
                ? foulCount >= 5
                  ? 'bg-red-500'
                  : foulCount >= 3
                  ? 'bg-orange-500'
                  : 'bg-slate-400'
                : 'bg-slate-700'
            )}
          />
        ))}
      </div>
    </button>
  )
}
