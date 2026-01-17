'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftRight, ArrowDown, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Player, Team, Action, PlayerGameStatus } from '@/types/game'
import { calculatePlayerFouls } from '@/lib/stats/calculate-player-fouls'
import { ScrollArea } from '@/components/ui/scroll-area'

interface PlayerSelectorContextValue {
  selectedPlayerId: string | null
  onSelectPlayer: (playerId: string) => void
  actions: Action[]
  playerStatuses: PlayerGameStatus[]
  swapMode: boolean
  swapPlayerOutId: string | null
  pendingSwap: { playerOutId: string; playerInId: string } | null
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
  pendingSwap: { playerOutId: string; playerInId: string } | null
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
  pendingSwap,
  children,
  className,
}: PlayerSelectorRootProps) {
  const value = React.useMemo(
    () => ({ selectedPlayerId, onSelectPlayer, actions, playerStatuses, swapMode, swapPlayerOutId, pendingSwap }),
    [selectedPlayerId, onSelectPlayer, actions, playerStatuses, swapMode, swapPlayerOutId, pendingSwap]
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
    <div className={cn('flex flex-col gap-2 px-1 h-full', className)}>
      {/* On-Court Players - Fixed height section */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Team color indicator bar */}
        <div
          className={cn(
            'w-1 h-10 rounded-full shrink-0',
            isHome ? 'bg-violet-500' : 'bg-sky-500'
          )}
        />

        {/* On-Court Players Grid */}
        <div className="grid grid-cols-5 gap-1.5 flex-1">
          {onCourtPlayers.map((player) => (
            <PlayerSelectorPlayer key={player.id} player={player} isHome={isHome} isOnCourt={true} />
          ))}
        </div>
      </div>

      {/* Bench Players - Scrollable horizontal section */}
      {benchPlayers.length > 0 && (
        <div className="flex-1 min-h-0 pl-2">
          <ScrollArea className="h-full">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex gap-1 pb-2"
            >
              {benchPlayers.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  className="shrink-0"
                >
                  <PlayerSelectorPlayer player={player} isHome={isHome} isOnCourt={false} />
                </motion.div>
              ))}
            </motion.div>
          </ScrollArea>
        </div>
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
  const { selectedPlayerId, onSelectPlayer, actions, swapMode, swapPlayerOutId, pendingSwap } = usePlayerSelector()
  const isSelected = selectedPlayerId === player.id
  const shortName = getShortName(player.name)
  const foulCount = calculatePlayerFouls(actions, player.id)

  // Determine if this player is the swap candidate
  const isSwapCandidate = swapMode && swapPlayerOutId === player.id

  // Check if player is in pending swap
  const isPendingOut = pendingSwap?.playerOutId === player.id
  const isPendingIn = pendingSwap?.playerInId === player.id

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
        // Size based on court status - bench now 50% smaller
        isOnCourt ? 'w-14 h-14' : 'w-7 h-7',
        // Dashed border for bench players
        !isOnCourt && 'border-2 border-dashed border-slate-600',
        // Lower opacity for bench players - more distinct
        !isOnCourt && 'opacity-40',
        // Darker disabled state
        isDisabled && 'opacity-20 cursor-not-allowed',
        // Pending swap visual feedback
        isPendingOut && 'ring-4 ring-red-500 opacity-60',
        isPendingIn && 'ring-4 ring-green-500',
        // Swap candidate pulsing (only if not pending)
        !isPendingOut && !isPendingIn && isSwapCandidate && 'ring-4 ring-amber-500 animate-pulse',
        // Selected state - thick purple/blue ring (brand colors)
        isSelected && !isSwapCandidate && !isPendingOut && !isPendingIn && isOnCourt && [
          'ring-4 scale-105',
          isHome
            ? 'bg-violet-500 text-white ring-violet-400 ring-offset-2 ring-offset-slate-950'
            : 'bg-sky-500 text-white ring-sky-400 ring-offset-2 ring-offset-slate-950',
        ],
        // Unselected state
        !isSelected && !isSwapCandidate && !isPendingOut && !isPendingIn && 'bg-slate-800 hover:bg-slate-700 text-slate-300',
        className
      )}
    >
      {/* Jersey number */}
      <span className={cn(
        'font-bold tabular-nums leading-none',
        isOnCourt ? 'text-lg' : 'text-[10px]'
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

      {/* Pending swap icon overlays */}
      {isPendingOut && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/30 rounded-full">
          <ArrowDown className="w-4 h-4 text-red-400" />
        </div>
      )}
      {isPendingIn && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-500/30 rounded-full">
          <ArrowUp className="w-4 h-4 text-green-400" />
        </div>
      )}
    </motion.button>
  )
}

export const PlayerSelector = {
  Root: PlayerSelectorRoot,
  Team: PlayerSelectorTeam,
  Player: PlayerSelectorPlayer,
}
