'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import type { Player, Team } from '@/types/game'

interface PlayerSelectorContextValue {
  selectedPlayerId: string | null
  onSelectPlayer: (playerId: string) => void
}

const PlayerSelectorContext = React.createContext<PlayerSelectorContextValue | undefined>(undefined)

function usePlayerSelector() {
  const context = React.useContext(PlayerSelectorContext)
  if (!context) {
    throw new Error('PlayerSelector components must be used within PlayerSelector.Root')
  }
  return context
}

interface PlayerSelectorRootProps {
  selectedPlayerId: string | null
  onSelectPlayer: (playerId: string) => void
  children: React.ReactNode
  className?: string
}

function PlayerSelectorRoot({
  selectedPlayerId,
  onSelectPlayer,
  children,
  className,
}: PlayerSelectorRootProps) {
  const value = React.useMemo(
    () => ({ selectedPlayerId, onSelectPlayer }),
    [selectedPlayerId, onSelectPlayer]
  )

  return (
    <PlayerSelectorContext.Provider value={value}>
      <div className={cn('grid grid-cols-2 gap-4', className)}>
        {children}
      </div>
    </PlayerSelectorContext.Provider>
  )
}

interface PlayerSelectorTeamProps {
  team: Team
  isHome?: boolean
  className?: string
}

function PlayerSelectorTeam({ team, isHome = false, className }: PlayerSelectorTeamProps) {
  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center gap-2 mb-3">
        <div
          className={cn(
            'w-3 h-3 rounded-full',
            isHome ? 'bg-home-team' : 'bg-away-team'
          )}
        />
        <h3 className="text-sm font-semibold">{team.name}</h3>
      </div>
      <div className="space-y-2">
        {team.players.map((player) => (
          <PlayerSelectorPlayer key={player.id} player={player} isHome={isHome} />
        ))}
      </div>
    </Card>
  )
}

interface PlayerSelectorPlayerProps {
  player: Player
  isHome?: boolean
  className?: string
}

function PlayerSelectorPlayer({ player, isHome = false, className }: PlayerSelectorPlayerProps) {
  const { selectedPlayerId, onSelectPlayer } = usePlayerSelector()
  const isSelected = selectedPlayerId === player.id

  return (
    <button
      onClick={() => onSelectPlayer(player.id)}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200',
        'hover:bg-accent/50 active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'min-h-[56px]',
        isSelected && [
          'ring-2 ring-primary bg-primary/10',
          isHome ? 'ring-home-team bg-home-team/10' : 'ring-away-team bg-away-team/10',
        ],
        className
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-lg font-bold text-lg',
          isHome ? 'bg-home-team text-white' : 'bg-away-team text-white'
        )}
      >
        {player.jerseyNumber}
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-semibold">{player.name}</p>
        <p className="text-xs text-muted-foreground">{player.position}</p>
      </div>
    </button>
  )
}

export const PlayerSelector = {
  Root: PlayerSelectorRoot,
  Team: PlayerSelectorTeam,
  Player: PlayerSelectorPlayer,
}
