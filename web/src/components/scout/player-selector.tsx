'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Player, Team, Action, PlayerGameStatus } from '@/types/game'
import { calculatePlayerFouls } from '@/lib/stats/calculate-player-fouls'

interface PlayerSelectorContextValue {
  selectedPlayerId: string | null
  onSelectPlayer: (playerId: string) => void
  actions: Action[]
  playerStatuses: PlayerGameStatus[]
  swapMode: boolean
  swapPlayerOutId: string | null
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
  actions: Action[]
  playerStatuses: PlayerGameStatus[]
  swapMode: boolean
  swapPlayerOutId: string | null
  children: React.ReactNode
  className?: string
}

function PlayerSelectorRoot({
  selectedPlayerId,
  onSelectPlayer,
  actions,
  playerStatuses,
  swapMode,
  swapPlayerOutId,
  children,
  className,
}: PlayerSelectorRootProps) {
  const value = React.useMemo(
    () => ({ selectedPlayerId, onSelectPlayer, actions, playerStatuses, swapMode, swapPlayerOutId }),
    [selectedPlayerId, onSelectPlayer, actions, playerStatuses, swapMode, swapPlayerOutId]
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
  const { playerStatuses } = usePlayerSelector()

  // Split players into on-court and bench based on playerStatuses
  const onCourtPlayers = team.players.filter((p) => {
    const status = playerStatuses.find((s) => s.playerId === p.id)
    return status?.isOnCourt
  })

  const benchPlayers = team.players.filter((p) => {
    const status = playerStatuses.find((s) => s.playerId === p.id)
    return !status?.isOnCourt
  })

  return (
    <div className={cn('flex flex-col gap-2 px-1', className)}>
      <div className="flex items-center gap-1">
        {/* Team color indicator bar */}
        <div
          className={cn(
            'w-1 h-10 rounded-full shrink-0',
            isHome ? 'bg-violet-500' : 'bg-sky-500'
          )}
        />

        {/* On-Court Players - 5 columns, large buttons */}
        <div className="grid grid-cols-5 gap-1.5 flex-1">
          {onCourtPlayers.map((player) => (
            <PlayerSelectorPlayer key={player.id} player={player} isHome={isHome} isOnCourt={true} />
          ))}
        </div>
      </div>

      {/* Bench Players - smaller buttons */}
      {benchPlayers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-7 gap-1 pl-2"
        >
          {benchPlayers.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
            >
              <PlayerSelectorPlayer player={player} isHome={isHome} isOnCourt={false} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

interface PlayerSelectorPlayerProps {
  player: Player
  isHome?: boolean
  isOnCourt: boolean
  className?: string
}

// Helper to get last name (first 3 chars)
function getShortName(fullName: string): string {
  const parts = fullName.trim().split(' ')
  const lastName = parts[parts.length - 1]
  return lastName.slice(0, 3).toUpperCase()
}

function PlayerSelectorPlayer({ player, isHome = false, isOnCourt, className }: PlayerSelectorPlayerProps) {
  const { selectedPlayerId, onSelectPlayer, actions, swapMode, swapPlayerOutId } = usePlayerSelector()
  const isSelected = selectedPlayerId === player.id
  const shortName = getShortName(player.name)
  const foulCount = calculatePlayerFouls(actions, player.id)

  // Determine if this player is the swap candidate
  const isSwapCandidate = swapMode && swapPlayerOutId === player.id

  // Disable bench players in normal mode (action recording)
  const isDisabled = !swapMode && !isOnCourt

  return (
    <motion.button
      layout
      onClick={() => onSelectPlayer(player.id)}
      disabled={isDisabled}
      className={cn(
        'flex flex-col items-center justify-center transition-all duration-150',
        'active:scale-95 touch-manipulation',
        'focus-visible:outline-none',
        'rounded-full relative',
        // Size based on court status
        isOnCourt ? 'w-14 h-14' : 'w-10 h-10',
        // Opacity for bench players
        !isOnCourt && 'opacity-50',
        // Disabled state
        isDisabled && 'opacity-30 cursor-not-allowed',
        // Swap candidate pulsing
        isSwapCandidate && 'ring-4 ring-amber-500 animate-pulse',
        // Selected state - subtle, no neon
        isSelected && !isSwapCandidate && [
          'ring-2 scale-105',
          isHome
            ? 'bg-violet-500 text-white ring-violet-400'
            : 'bg-sky-500 text-white ring-sky-400',
        ],
        // Unselected state
        !isSelected && !isSwapCandidate && 'bg-slate-800 hover:bg-slate-700 text-slate-300',
        className
      )}
    >
      {/* Jersey number */}
      <span className={cn(
        'font-bold tabular-nums leading-none',
        isOnCourt ? 'text-lg' : 'text-sm'
      )}>
        {player.jerseyNumber}
      </span>

      {/* Short name - only for on-court players */}
      {isOnCourt && (
        <span className="text-[9px] font-semibold uppercase tracking-tight leading-none mt-0.5">
          {shortName}
        </span>
      )}

      {/* Foul indicator dots - only for on-court players */}
      {isOnCourt && (
        <div className="flex gap-0.5 mt-0.5">
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className={cn(
                'w-1 h-1 rounded-full transition-colors',
                index < foulCount
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
      )}

      {/* "Sub" icon overlay when swap candidate */}
      {isSwapCandidate && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-amber-500/20 rounded-full"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          <ArrowLeftRight className="w-4 h-4 text-amber-500" />
        </motion.div>
      )}
    </motion.button>
  )
}

export const PlayerSelector = {
  Root: PlayerSelectorRoot,
  Team: PlayerSelectorTeam,
  Player: PlayerSelectorPlayer,
}
