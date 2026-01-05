'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useGame, useRecordAction, useGameRealtime } from '@/lib/hooks/use-game'
import { GameHeader } from './game-header'
import { PlayerSelector } from './player-selector'
import { ActionPad } from './action-pad'
import { EventLog } from './event-log'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

  const handleAction = React.useCallback(
    (type: ActionType) => {
      if (!selectedPlayerId) return

      recordAction.mutate({
        gameId,
        playerId: selectedPlayerId,
        type,
        quarter: currentQuarter,
      })
    },
    [gameId, selectedPlayerId, currentQuarter, recordAction]
  )

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn('container mx-auto p-4 max-w-6xl space-y-6', className)}>
        <Card className="h-48 animate-pulse bg-muted" />
        <div className="grid grid-cols-2 gap-4">
          <Card className="h-96 animate-pulse bg-muted" />
          <Card className="h-96 animate-pulse bg-muted" />
        </div>
        <Card className="h-64 animate-pulse bg-muted" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={cn('container mx-auto p-4 max-w-6xl', className)}>
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Game</h2>
          <p className="text-muted-foreground">{error.message}</p>
        </Card>
      </div>
    )
  }

  // No data state
  if (!data) {
    return (
      <div className={cn('container mx-auto p-4 max-w-6xl', className)}>
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-semibold mb-2">Game Not Found</h2>
          <p className="text-muted-foreground">The requested game could not be found.</p>
        </Card>
      </div>
    )
  }

  const game = data

  return (
    <div className={cn('container mx-auto p-4 max-w-6xl space-y-6', className)}>
      {/* Game Header */}
      <GameHeader game={game} />

      {/* Quarter Selector */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-muted-foreground">Quarter</span>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((quarter) => (
              <Button
                key={quarter}
                variant={currentQuarter === quarter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentQuarter(quarter)}
                className="w-12"
              >
                {quarter}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Player Selection */}
      <PlayerSelector.Root
        selectedPlayerId={selectedPlayerId}
        onSelectPlayer={setSelectedPlayerId}
      >
        <PlayerSelector.Team team={game.homeTeam} isHome />
        <PlayerSelector.Team team={game.awayTeam} />
      </PlayerSelector.Root>

      {/* Selected Player Indicator */}
      {selectedPlayerId && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Recording for</p>
            <p className="text-lg font-semibold">
              {[...game.homeTeam.players, ...game.awayTeam.players].find(
                p => p.id === selectedPlayerId
              )?.name}
            </p>
          </div>
        </Card>
      )}

      {/* Action Pad */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">Record Action</h3>
        <ActionPad.Root
          onAction={handleAction}
          disabled={!selectedPlayerId}
        >
          {/* First row - Scoring */}
          <ActionPad.Action type="TWO_PT_MAKE" label="+2" variant="success" />
          <ActionPad.Action type="THREE_PT_MAKE" label="+3" variant="success" />
          <ActionPad.Action type="TWO_PT_MISS" label="Miss" variant="secondary" />

          {/* Second row - Stats */}
          <ActionPad.Action type="REB" label="REB" variant="secondary" />
          <ActionPad.Action type="AST" label="AST" variant="secondary" />
          <ActionPad.Action type="STL" label="STL" variant="secondary" />

          {/* Third row - Negative actions */}
          <ActionPad.Action type="BLK" label="BLK" variant="secondary" />
          <ActionPad.Action type="FOUL" label="FOUL" variant="destructive" />
          <ActionPad.Action type="TO" label="TO" variant="destructive" />
        </ActionPad.Root>

        {/* Miss 3PT button (full width) */}
        <div className="mt-3">
          <ActionPad.Root
            onAction={handleAction}
            disabled={!selectedPlayerId}
          >
            <ActionPad.Action
              type="THREE_PT_MISS"
              label="Miss 3PT"
              variant="secondary"
              className="col-span-3"
            />
          </ActionPad.Root>
        </div>
      </Card>

      {/* Event Log */}
      <EventLog actions={game.actions} />
    </div>
  )
}
