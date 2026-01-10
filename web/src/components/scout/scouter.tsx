'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useGame, useRecordAction, useGameRealtime } from '@/lib/hooks/use-game'
import { GameHeader } from './game-header'
import { PlayerSelector } from './player-selector'
import { ActionPad } from './action-pad'
import { HistorySheet } from './event-log'
import type { ActionType } from '@/types/game'

interface ScouterProps {
  gameId: string
  className?: string
}

export function Scouter({ gameId, className }: ScouterProps) {
  const { data, isLoading, error } = useGame(gameId)
  const recordAction = useRecordAction()

  // Subscribe to realtime updates for this game
  useGameRealtime(gameId)

  const [selectedPlayerId, setSelectedPlayerId] = React.useState<string | null>(null)
  const [currentQuarter, setCurrentQuarter] = React.useState(1)
  const [historyOpen, setHistoryOpen] = React.useState(false)

  const handleAction = React.useCallback(
    (type: ActionType | 'UNDO') => {
      if (!selectedPlayerId) return

      // Handle undo - delete the last action
      if (type === 'UNDO') {
        if (data?.actions && data.actions.length > 0) {
          const lastAction = data.actions[data.actions.length - 1]
          handleDeleteAction(lastAction.id)
        }
        return
      }

      recordAction.mutate({
        gameId,
        playerId: selectedPlayerId,
        type,
        quarter: currentQuarter,
      })
    },
    [gameId, selectedPlayerId, currentQuarter, recordAction, data]
  )

  const handleDeleteAction = React.useCallback(
    (actionId: string) => {
      // TODO: Implement delete action API call
      console.log('Delete action:', actionId)
      // Will be implemented after adding useDeleteAction hook
    },
    []
  )

  const game = data

  // Loading skeleton - dark themed
  if (isLoading || !game) {
    return (
      <div className={cn('h-[100dvh] flex flex-col bg-slate-950 overflow-hidden', className)}>
        <div className="h-[15vh] flex items-center justify-center border-b border-slate-800/50">
          <div className="h-8 w-48 animate-pulse bg-slate-800 rounded" />
        </div>
        <div className="h-[25vh] flex items-center justify-center px-3">
          <div className="w-full h-16 animate-pulse bg-slate-800 rounded-lg" />
        </div>
        <div className="h-[60vh] px-3 pb-3">
          <div className="h-full animate-pulse bg-slate-800 rounded-lg" />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={cn('h-[100dvh] flex items-center justify-center p-4 bg-slate-950 overflow-hidden', className)}>
        <div className="p-6 text-center max-w-sm rounded-lg bg-slate-900/80 border border-slate-800">
          <h2 className="text-lg font-semibold text-red-400 mb-2">Error Loading Game</h2>
          <p className="text-sm text-slate-400">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('h-[100dvh] flex flex-col bg-slate-950 overflow-hidden', className)}>
      {/* Header - 15vh */}
      <GameHeader
        game={game}
        currentQuarter={currentQuarter}
        onQuarterChange={setCurrentQuarter}
        onHistoryClick={() => setHistoryOpen(true)}
      />

      {/* Player Keypad - 25vh */}
      <div className="h-[25vh] flex items-center px-3">
        <PlayerSelector.Root
          selectedPlayerId={selectedPlayerId}
          onSelectPlayer={setSelectedPlayerId}
        >
          <PlayerSelector.Team team={game.homeTeam} isHome />
          <PlayerSelector.Team team={game.awayTeam} />
        </PlayerSelector.Root>
      </div>

      {/* Action Command Center - 60vh */}
      <div className="h-[60vh] px-3 pb-3 overflow-hidden">
        <ActionPad.Root
          onAction={handleAction}
          disabled={!selectedPlayerId}
          className="h-full grid-rows-4"
        >
          {/* Row 1 - Scoring */}
          <ActionPad.TwoPtMake />
          <ActionPad.ThreePtMake />
          <ActionPad.FtMake />
          <ActionPad.FtMiss />

          {/* Row 2 - Misses + Critical */}
          <ActionPad.TwoPtMiss />
          <ActionPad.ThreePtMiss />
          <ActionPad.Foul />
          <ActionPad.Turnover />

          {/* Row 3 - Stats */}
          <ActionPad.Rebound />
          <ActionPad.Assist />
          <ActionPad.Steal />
          <ActionPad.Block />

          {/* Row 4 - Undo */}
          <ActionPad.Undo className="col-span-4" />
        </ActionPad.Root>
      </div>

      {/* History Sheet - slides from bottom (mobile) or right (desktop) */}
      <HistorySheet
        actions={game.actions}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onDeleteAction={handleDeleteAction}
      />
    </div>
  )
}
