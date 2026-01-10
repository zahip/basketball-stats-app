'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
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
      <div className={cn('flex flex-col gap-3 w-full', className)}>
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
    <div
      className={cn(
        'flex items-center gap-1 px-1',
        className
      )}
    >
      {/* Team color indicator bar */}
      <div
        className={cn(
          'w-1 h-10 rounded-full shrink-0',
          isHome ? 'bg-violet-500' : 'bg-sky-500'
        )}
      />
      {/* 5-column player grid */}
      <div className="grid grid-cols-5 gap-1.5 flex-1">
        {team.players.map((player) => (
          <PlayerSelectorPlayer key={player.id} player={player} isHome={isHome} />
        ))}
      </div>
    </div>
  )
}

interface PlayerSelectorPlayerProps {
  player: Player
  isHome?: boolean
  className?: string
}

// Helper to get last name (first 3 chars)
function getShortName(fullName: string): string {
  const parts = fullName.trim().split(' ')
  const lastName = parts[parts.length - 1]
  return lastName.slice(0, 3).toUpperCase()
}

function PlayerSelectorPlayer({ player, isHome = false, className }: PlayerSelectorPlayerProps) {
  const { selectedPlayerId, onSelectPlayer } = usePlayerSelector()
  const isSelected = selectedPlayerId === player.id
  const shortName = getShortName(player.name)

  return (
    <button
      onClick={() => onSelectPlayer(player.id)}
      className={cn(
        'flex flex-col items-center justify-center transition-all duration-150',
        'active:scale-95 touch-manipulation',
        'focus-visible:outline-none',
        'w-14 h-14 rounded-full',
        // Selected state - subtle, no neon
        isSelected && [
          'ring-2 scale-105',
          isHome
            ? 'bg-violet-500 text-white ring-violet-400'
            : 'bg-sky-500 text-white ring-sky-400',
        ],
        // Unselected state
        !isSelected && 'bg-slate-800 hover:bg-slate-700 text-slate-300',
        className
      )}
    >
      {/* Jersey number - large */}
      <span className="text-lg font-bold tabular-nums leading-none">
        {player.jerseyNumber}
      </span>
      {/* Short name */}
      <span className="text-[9px] font-semibold uppercase tracking-tight leading-none mt-0.5">
        {shortName}
      </span>
    </button>
  )
}

export const PlayerSelector = {
  Root: PlayerSelectorRoot,
  Team: PlayerSelectorTeam,
  Player: PlayerSelectorPlayer,
}
