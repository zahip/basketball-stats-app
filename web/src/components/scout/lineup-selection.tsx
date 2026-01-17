'use client'

import * as React from 'react'
import { CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Game } from '@/types/game'
import { useSetStarters } from '@/lib/hooks/use-game'

interface LineupSelectionProps {
  game: Game
  onComplete: () => void
  className?: string
}

export function LineupSelection({ game, onComplete, className }: LineupSelectionProps) {
  const [homeSelected, setHomeSelected] = React.useState<string[]>([])
  const [awaySelected, setAwaySelected] = React.useState<string[]>([])
  const setStarters = useSetStarters()

  const togglePlayer = React.useCallback(
    (playerId: string, team: 'home' | 'away') => {
      const selected = team === 'home' ? homeSelected : awaySelected
      const setSelected = team === 'home' ? setHomeSelected : setAwaySelected

      if (selected.includes(playerId)) {
        setSelected(selected.filter((id) => id !== playerId))
      } else if (selected.length < 5) {
        setSelected([...selected, playerId])
      }
    },
    [homeSelected, awaySelected]
  )

  const handleStartGame = React.useCallback(() => {
    if (homeSelected.length !== 5 || awaySelected.length !== 5) return

    setStarters.mutate(
      {
        gameId: game.id,
        homeStarters: homeSelected,
        awayStarters: awaySelected,
      },
      {
        onSuccess: () => {
          onComplete()
        },
      }
    )
  }, [homeSelected, awaySelected, game.id, setStarters, onComplete])

  const isStartEnabled = homeSelected.length === 5 && awaySelected.length === 5

  return (
    <div className={cn('min-h-screen bg-slate-50 p-6', className)}>
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Select Starting Lineups</h1>
        <p className="text-slate-600">Choose 5 players for each team to start the game</p>
      </div>

      {/* Two-Column Team Selection */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Home Team */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-violet-600 mb-2">{game.homeTeam.name}</h2>
          <p className="text-sm text-slate-600 mb-4">
            {homeSelected.length} / 5 selected
          </p>

          {/* Player List */}
          <div className="space-y-2">
            {game.homeTeam.players.map((player) => (
              <button
                key={player.id}
                onClick={() => togglePlayer(player.id, 'home')}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all',
                  homeSelected.includes(player.id)
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-slate-200 bg-white hover:border-violet-300'
                )}
              >
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-violet-700">{player.jerseyNumber}</span>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="font-medium text-slate-900 truncate">{player.name}</div>
                  <div className="text-xs text-slate-500">{player.position}</div>
                </div>
                {homeSelected.includes(player.id) && (
                  <CheckCircle className="w-5 h-5 text-violet-600 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Away Team */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-sky-600 mb-2">{game.awayTeam.name}</h2>
          <p className="text-sm text-slate-600 mb-4">
            {awaySelected.length} / 5 selected
          </p>

          {/* Player List */}
          <div className="space-y-2">
            {game.awayTeam.players.map((player) => (
              <button
                key={player.id}
                onClick={() => togglePlayer(player.id, 'away')}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all',
                  awaySelected.includes(player.id)
                    ? 'border-sky-500 bg-sky-50'
                    : 'border-slate-200 bg-white hover:border-sky-300'
                )}
              >
                <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-sky-700">{player.jerseyNumber}</span>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="font-medium text-slate-900 truncate">{player.name}</div>
                  <div className="text-xs text-slate-500">{player.position}</div>
                </div>
                {awaySelected.includes(player.id) && (
                  <CheckCircle className="w-5 h-5 text-sky-600 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Start Game Button */}
      <div className="max-w-6xl mx-auto">
        <button
          onClick={handleStartGame}
          disabled={!isStartEnabled || setStarters.isPending}
          className={cn(
            'w-full py-4 rounded-xl font-semibold text-lg transition-all',
            isStartEnabled && !setStarters.isPending
              ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-lg active:scale-[0.99]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          )}
        >
          {setStarters.isPending ? 'Starting Game...' : 'Start Game'}
        </button>
      </div>
    </div>
  )
}
