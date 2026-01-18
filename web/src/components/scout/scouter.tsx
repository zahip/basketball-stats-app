'use client'

import * as React from 'react'
import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { useGame, useRecordAction, useGameRealtime, useSubstitution } from '@/lib/hooks/use-game'
import { TeamColumn } from './team-column'
import { ActionPad } from './action-pad'
import { HistorySheet } from './event-log'
import { StarterSelection } from './starter-selection'
import { ShotMapOverlay } from './shot-map-overlay'
import { LineupSelection } from './lineup-selection'
import { BenchDrawer } from './bench-drawer'
import { GameTimer } from './game-timer'
import { useToast } from '@/hooks/use-toast'
import type { ActionType, Game } from '@/types/game'

interface ScouterProps {
  gameId: string
  className?: string
}

export function Scouter({ gameId, className }: ScouterProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useGame(gameId)
  const recordAction = useRecordAction()
  const substitution = useSubstitution()
  const { toast } = useToast()

  // Subscribe to realtime updates for this game
  useGameRealtime(gameId)

  const [selectedPlayerId, setSelectedPlayerId] = React.useState<string | null>(null)
  const [currentQuarter, setCurrentQuarter] = React.useState(1)
  const [historyOpen, setHistoryOpen] = React.useState(false)
  const [startersDialogOpen, setStartersDialogOpen] = React.useState(false)
  const [shotMapOpen, setShotMapOpen] = React.useState(false)
  const [pendingShotType, setPendingShotType] = React.useState<
    'TWO_PT_MAKE' | 'TWO_PT_MISS' | 'THREE_PT_MAKE' | 'THREE_PT_MISS' | null
  >(null)
  const [showLineupSelection, setShowLineupSelection] = React.useState(true)
  const [isSubMode, setIsSubMode] = React.useState(false)
  const [pendingSwap, setPendingSwap] = React.useState<{
    teamId: string
    inId: string
    outId: string
  } | null>(null)
  const [benchDrawerOpen, setBenchDrawerOpen] = React.useState(false)
  const [currentTimerSeconds, setCurrentTimerSeconds] = React.useState(600)

  // Check if starters already set
  React.useEffect(() => {
    if (data && data.playerStatuses.length > 0) {
      setShowLineupSelection(false)
    }
  }, [data])

  const handleOpenBenchDrawer = React.useCallback((_team: 'home' | 'away', teamId: string) => {
    setBenchDrawerOpen(true)
    setIsSubMode(true)
    setPendingSwap({ teamId, inId: '', outId: '' })
  }, [])

  const handleCloseBenchDrawer = React.useCallback(() => {
    setBenchDrawerOpen(false)
    setIsSubMode(false)
    setPendingSwap(null)
  }, [])

  const handleSelectBenchPlayer = React.useCallback((playerId: string) => {
    setPendingSwap((prev) => (prev ? { ...prev, inId: playerId } : null))
    setBenchDrawerOpen(false) // Close drawer after selecting IN player
  }, [])

  const handleSelectOnCourtPlayer = React.useCallback((playerId: string) => {
    setPendingSwap((prev) => (prev ? { ...prev, outId: playerId } : null))
  }, [])

  const handleConfirmSwap = React.useCallback(() => {
    if (!pendingSwap || !pendingSwap.outId || !pendingSwap.inId) return

    // Optimistic update
    queryClient.setQueryData(['game', gameId], (old: Game | undefined) => {
      if (!old) return old
      const newStatuses = old.playerStatuses.map((status) => {
        if (status.playerId === pendingSwap.outId) {
          return { ...status, isOnCourt: false }
        }
        if (status.playerId === pendingSwap.inId) {
          return { ...status, isOnCourt: true }
        }
        return status
      })
      return { ...old, playerStatuses: newStatuses }
    })

    // API call
    substitution.mutate({
      gameId,
      playerOutId: pendingSwap.outId,
      playerInId: pendingSwap.inId,
      quarter: currentQuarter,
    })

    // Reset
    setPendingSwap(null)
    setIsSubMode(false)
    setBenchDrawerOpen(false)
  }, [pendingSwap, gameId, currentQuarter, substitution, queryClient])

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

      // Shot actions open the shot map overlay
      if (
        type === 'TWO_PT_MAKE' ||
        type === 'TWO_PT_MISS' ||
        type === 'THREE_PT_MAKE' ||
        type === 'THREE_PT_MISS'
      ) {
        setPendingShotType(type)
        setShotMapOpen(true)
        return
      }

      // Other actions record immediately
      recordAction.mutate({
        gameId,
        playerId: selectedPlayerId,
        type,
        quarter: currentQuarter,
        elapsedSeconds: currentTimerSeconds,
      })
    },
    [gameId, selectedPlayerId, currentQuarter, currentTimerSeconds, recordAction, data, toast]
  )

  const handleShotLocation = React.useCallback(
    (x: number, y: number) => {
      if (!pendingShotType || !selectedPlayerId) return

      recordAction.mutate({
        gameId,
        playerId: selectedPlayerId,
        type: pendingShotType,
        quarter: currentQuarter,
        locationX: x,
        locationY: y,
        elapsedSeconds: currentTimerSeconds,
      })

      setShotMapOpen(false)
      setPendingShotType(null)
    },
    [pendingShotType, selectedPlayerId, gameId, currentQuarter, currentTimerSeconds, recordAction]
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

  // Show lineup selection if no starters set
  if (game && showLineupSelection) {
    return <LineupSelection game={game} onComplete={() => setShowLineupSelection(false)} />
  }

  // Loading skeleton - light themed
  if (isLoading || !game) {
    return (
      <div className={cn('h-screen flex flex-col bg-slate-50 overflow-hidden', className)}>
        <div className="h-[15vh] flex items-center justify-center border-b border-slate-200 bg-white">
          <div className="h-8 w-48 animate-pulse bg-slate-200 rounded" />
        </div>
        <div className="h-[40vh] flex items-center justify-center p-3">
          <div className="w-full h-16 animate-pulse bg-slate-200 rounded-lg" />
        </div>
        <div className="h-[45vh] p-3">
          <div className="h-full animate-pulse bg-slate-200 rounded-lg" />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div
        className={cn(
          'h-screen flex items-center justify-center p-4 bg-slate-50 overflow-hidden',
          className
        )}
      >
        <div className="p-6 text-center max-w-sm rounded-lg bg-white border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Error Loading Game</h2>
          <p className="text-sm text-slate-600">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('h-screen overflow-hidden flex flex-col bg-slate-50', className)}>
      {/* Header - 15vh */}
      <div className="h-[15vh] flex items-center justify-between px-4 border-b border-slate-200 bg-white shadow-sm">
        {/* Back Button - Left */}
        <button
          onClick={() => router.push('/')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Back to games"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>

        {/* Center Section: Score + Timer */}
        <div className="flex items-center gap-6">
          {/* Score Display */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-[10px] text-violet-600 font-bold uppercase tracking-wide">
                {game.homeTeam.name.slice(0, 3)}
              </div>
              <div className="text-xl font-bold text-slate-900 tabular-nums">{game.scoreHome}</div>
            </div>
            <div className="text-slate-400 text-sm">-</div>
            <div className="text-center">
              <div className="text-[10px] text-sky-600 font-bold uppercase tracking-wide">
                {game.awayTeam.name.slice(0, 3)}
              </div>
              <div className="text-xl font-bold text-slate-900 tabular-nums">{game.scoreAway}</div>
            </div>
          </div>

          {/* Game Timer */}
          <GameTimer
            gameId={game.id}
            clockSessions={game.clockSessions}
            onTimerUpdate={setCurrentTimerSeconds}
          />
        </div>

        {/* Period Selector - Right */}
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((quarter) => (
            <button
              key={quarter}
              onClick={() => setCurrentQuarter(quarter)}
              className={cn(
                'w-7 h-7 text-xs font-bold rounded-lg transition-all active:scale-95',
                currentQuarter === quarter
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {quarter}
            </button>
          ))}
        </div>
      </div>

      {/* Team Sections - 40vh */}
      <div className="h-[40vh] flex gap-3 p-3 overflow-hidden">
        {/* Home Team */}
        <TeamColumn
          team={game.homeTeam}
          isHome={true}
          playerStatuses={game.playerStatuses}
          selectedPlayerId={selectedPlayerId}
          onSelectPlayer={setSelectedPlayerId}
          isSubMode={isSubMode}
          onToggleSubMode={() =>
            isSubMode ? handleCloseBenchDrawer() : handleOpenBenchDrawer('home', game.homeTeam.id)
          }
          pendingSwap={pendingSwap}
          onSelectOnCourtPlayer={handleSelectOnCourtPlayer}
        />

        {/* Away Team */}
        <TeamColumn
          team={game.awayTeam}
          isHome={false}
          playerStatuses={game.playerStatuses}
          selectedPlayerId={selectedPlayerId}
          onSelectPlayer={setSelectedPlayerId}
          isSubMode={isSubMode}
          onToggleSubMode={() =>
            isSubMode ? handleCloseBenchDrawer() : handleOpenBenchDrawer('away', game.awayTeam.id)
          }
          pendingSwap={pendingSwap}
          onSelectOnCourtPlayer={handleSelectOnCourtPlayer}
        />
      </div>

      {/* Action Pad - 45vh */}
      <div className="h-[45vh] bg-white border-t border-slate-200 p-3">
        <ActionPad.Root onAction={handleAction} disabled={!selectedPlayerId || showLineupSelection} className="h-full">
          {/* Row 1 - Scoring Makes */}
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
      <StarterSelection game={game} open={startersDialogOpen} onOpenChange={setStartersDialogOpen} />

      {/* Shot Map Overlay */}
      <ShotMapOverlay
        open={shotMapOpen}
        onClose={() => {
          setShotMapOpen(false)
          setPendingShotType(null)
        }}
        onSelectLocation={handleShotLocation}
        shotType={pendingShotType?.includes('THREE') ? 'THREE_PT' : 'TWO_PT'}
      />

      {/* Bench Drawer - single instance */}
      {pendingSwap && (
        <BenchDrawer
          open={benchDrawerOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseBenchDrawer()
          }}
          benchPlayers={
            pendingSwap.teamId === game.homeTeam.id
              ? game.homeTeam.players.filter((p) => {
                  const status = game.playerStatuses.find((s) => s.playerId === p.id)
                  return !status?.isOnCourt
                })
              : game.awayTeam.players.filter((p) => {
                  const status = game.playerStatuses.find((s) => s.playerId === p.id)
                  return !status?.isOnCourt
                })
          }
          team={pendingSwap.teamId === game.homeTeam.id ? game.homeTeam : game.awayTeam}
          isHome={pendingSwap.teamId === game.homeTeam.id}
          onSelectBenchPlayer={handleSelectBenchPlayer}
        />
      )}

      {/* Instruction Overlay - waiting for OUT selection */}
      {pendingSwap?.inId && !pendingSwap?.outId && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-purple-600 text-white px-6 py-3 rounded-xl shadow-lg font-semibold text-sm">
          👆 Tap player to sub OUT
        </div>
      )}

      {/* Confirm Substitution Button */}
      {pendingSwap?.outId && pendingSwap?.inId && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60]">
          <button
            onClick={handleConfirmSwap}
            className="bg-violet-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-violet-700 transition-all active:scale-[0.99]"
          >
            Confirm Substitution
          </button>
        </div>
      )}
    </div>
  )
}
