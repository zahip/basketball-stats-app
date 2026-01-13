'use client'

import * as React from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGame, useRecordAction, useGameRealtime, useSubstitution } from '@/lib/hooks/use-game'
import { GameHeader } from './game-header'
import { PlayerSelector } from './player-selector'
import { ActionPad } from './action-pad'
import { HistorySheet } from './event-log'
import { StarterSelection } from './starter-selection'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import type { ActionType } from '@/types/game'

interface ScouterProps {
  gameId: string
  className?: string
}

export function Scouter({ gameId, className }: ScouterProps) {
  const { data, isLoading, error } = useGame(gameId)
  const recordAction = useRecordAction()
  const substitution = useSubstitution()
  const { toast } = useToast()

  // Subscribe to realtime updates for this game
  useGameRealtime(gameId)

  const [selectedPlayerId, setSelectedPlayerId] = React.useState<string | null>(null)
  const [currentQuarter, setCurrentQuarter] = React.useState(1)
  const [historyOpen, setHistoryOpen] = React.useState(false)
  const [swapMode, setSwapMode] = React.useState(false)
  const [swapPlayerOutId, setSwapPlayerOutId] = React.useState<string | null>(null)
  const [startersDialogOpen, setStartersDialogOpen] = React.useState(false)

  // Show starters dialog if no player statuses exist
  React.useEffect(() => {
    if (data && data.playerStatuses.length === 0) {
      setStartersDialogOpen(true)
    }
  }, [data])

  const handleSwap = React.useCallback(
    (playerInId: string) => {
      if (!swapPlayerOutId || !data) return

      substitution.mutate(
        {
          gameId,
          playerOutId: swapPlayerOutId,
          playerInId,
          quarter: currentQuarter,
        },
        {
          onSuccess: () => {
            // Reset swap mode
            setSwapPlayerOutId(null)
            setSwapMode(false)
          },
        }
      )
    },
    [swapPlayerOutId, gameId, currentQuarter, substitution, data]
  )

  const handlePlayerClick = React.useCallback(
    (playerId: string) => {
      if (!data) return

      if (!swapMode) {
        // Normal selection mode
        setSelectedPlayerId(playerId)
        return
      }

      // Swap mode logic
      const playerStatus = data.playerStatuses.find((s) => s.playerId === playerId)

      if (!swapPlayerOutId) {
        // First tap - select on-court player to swap out
        if (playerStatus?.isOnCourt) {
          setSwapPlayerOutId(playerId)
        } else {
          toast({
            title: 'Invalid Selection',
            description: 'Please select an on-court player to substitute out',
            variant: 'destructive',
          })
        }
      } else {
        // Second tap - select bench player to swap in or change selection
        if (!playerStatus?.isOnCourt) {
          handleSwap(playerId)
        } else {
          // Tapped another on-court player, change selection
          setSwapPlayerOutId(playerId)
        }
      }
    },
    [swapMode, swapPlayerOutId, data, handleSwap, toast]
  )

  const handleAction = React.useCallback(
    (type: ActionType | 'UNDO') => {
      if (!selectedPlayerId || !data) return

      // Check if player is on court (only if starters have been set)
      if (data.playerStatuses.length > 0) {
        const playerStatus = data.playerStatuses.find((s) => s.playerId === selectedPlayerId)
        if (!playerStatus?.isOnCourt) {
          toast({
            title: 'Player on Bench',
            description: 'Cannot record actions for bench players',
            variant: 'destructive',
          })
          return
        }
      }

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
    [gameId, selectedPlayerId, currentQuarter, recordAction, data, toast]
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
      <div className="h-[25vh] flex flex-col gap-2 items-center px-3">
        {/* Swap Mode Toggle Button */}
        <div className="flex items-center gap-2 justify-center">
          <Button
            variant={swapMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSwapMode(!swapMode)
              setSwapPlayerOutId(null)
            }}
            className={cn(
              'transition-all',
              swapMode && 'bg-amber-500 hover:bg-amber-600 text-white'
            )}
          >
            <ArrowLeftRight className="w-4 h-4 mr-2" />
            {swapMode ? 'Cancel Swap' : 'Swap Players'}
          </Button>

          {swapMode && swapPlayerOutId && (
            <span className="text-xs text-slate-400">
              Select bench player to swap in
            </span>
          )}
        </div>

        {/* Player Selector */}
        <div className="flex-1 flex items-center w-full">
          <PlayerSelector.Root
            selectedPlayerId={selectedPlayerId}
            onSelectPlayer={handlePlayerClick}
            actions={game.actions}
            playerStatuses={game.playerStatuses}
            swapMode={swapMode}
            swapPlayerOutId={swapPlayerOutId}
          >
            <PlayerSelector.Team team={game.homeTeam} isHome />
            <PlayerSelector.Team team={game.awayTeam} />
          </PlayerSelector.Root>
        </div>
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

      {/* Starter Selection Dialog */}
      <StarterSelection
        game={game}
        open={startersDialogOpen}
        onOpenChange={setStartersDialogOpen}
      />
    </div>
  )
}
