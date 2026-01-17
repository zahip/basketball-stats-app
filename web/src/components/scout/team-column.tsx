'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { Team, PlayerGameStatus } from '@/types/game'

interface TeamColumnProps {
  team: Team
  isHome: boolean
  playerStatuses: PlayerGameStatus[]
  selectedPlayerId: string | null
  onSelectPlayer: (playerId: string) => void
  isSubMode: boolean
  onToggleSubMode: () => void
  pendingSwap: { teamId: string; inId: string; outId: string } | null
  onSelectOnCourtPlayer: (playerId: string) => void
  className?: string
}

/**
 * TeamColumn - Mobile-optimized 2-column player grid
 */
export function TeamColumn({
  team,
  isHome,
  playerStatuses,
  selectedPlayerId,
  onSelectPlayer,
  isSubMode,
  onToggleSubMode,
  pendingSwap,
  onSelectOnCourtPlayer,
  className,
}: TeamColumnProps) {
  // Only show on-court players
  const starters = team.players.filter((p) => {
    const status = playerStatuses.find((s) => s.playerId === p.id)
    return status?.isOnCourt
  })

  const isPlayerSelected = (playerId: string) => {
    if (isSubMode && pendingSwap?.teamId === team.id && pendingSwap?.inId && !pendingSwap?.outId) {
      // Waiting for OUT selection - show all on-court players as selectable
      return false
    }
    if (isSubMode && pendingSwap?.outId === playerId) {
      return true
    }
    return !isSubMode && selectedPlayerId === playerId
  }

  const handlePlayerClick = (playerId: string) => {
    if (isSubMode && pendingSwap?.teamId === team.id && pendingSwap?.inId && !pendingSwap?.outId) {
      // Second step: selecting player to sub OUT
      onSelectOnCourtPlayer(playerId)
    } else if (isSubMode) {
      // Should not happen - drawer should be open for IN selection
      return
    } else {
      // Normal action recording mode
      onSelectPlayer(playerId)
    }
  }

  return (
    <div className={cn('flex-1 flex flex-col bg-white rounded-xl shadow-sm p-3', className)}>
      {/* Team Header */}
      <div className="mb-2">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">{team.name}</h3>
      </div>

      {/* 2-Column Player Grid - MOBILE OPTIMIZED */}
      <div className="flex-1 grid grid-cols-2 gap-2 overflow-hidden">
        {starters.map((player) => (
          <button
            key={player.id}
            onClick={() => handlePlayerClick(player.id)}
            className={cn(
              'flex items-center gap-2 p-2 rounded-lg border-2 transition-all active:scale-95',
              isPlayerSelected(player.id)
                ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500 ring-offset-1'
                : 'border-slate-200 bg-white hover:border-purple-300'
            )}
          >
            {/* Jersey Number - Small Circle */}
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0',
                isHome ? 'bg-violet-100 text-violet-700' : 'bg-sky-100 text-sky-700'
              )}
            >
              {player.jerseyNumber}
            </div>

            {/* Name Only - Ultra Compact */}
            <div className="flex-1 min-w-0 text-left">
              <div className="text-[10px] font-semibold text-slate-900 truncate leading-tight">
                {player.name}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Substitute Button */}
      <button
        onClick={onToggleSubMode}
        className={cn(
          'mt-3 py-2 rounded-lg font-medium text-xs transition-all',
          isSubMode
            ? 'bg-slate-200 text-slate-700'
            : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
        )}
      >
        {isSubMode ? '✕ Cancel' : `⇅ Sub ${team.name}`}
      </button>
    </div>
  )
}
