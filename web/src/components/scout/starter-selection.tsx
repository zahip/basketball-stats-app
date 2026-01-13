'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useSetStarters } from '@/lib/hooks/use-game'
import type { Game } from '@/types/game'

interface StarterSelectionProps {
  game: Game
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StarterSelection({ game, open, onOpenChange }: StarterSelectionProps) {
  const [homeStarters, setHomeStarters] = React.useState<string[]>([])
  const [awayStarters, setAwayStarters] = React.useState<string[]>([])

  const setStarters = useSetStarters()

  const toggleHomeStarter = (playerId: string) => {
    setHomeStarters((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : prev.length < 5
        ? [...prev, playerId]
        : prev
    )
  }

  const toggleAwayStarter = (playerId: string) => {
    setAwayStarters((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : prev.length < 5
        ? [...prev, playerId]
        : prev
    )
  }

  const handleSubmit = () => {
    if (homeStarters.length === 5 && awayStarters.length === 5) {
      setStarters.mutate(
        {
          gameId: game.id,
          homeStarters,
          awayStarters,
        },
        {
          onSuccess: () => {
            onOpenChange(false)
          },
        }
      )
    }
  }

  const isSubmitDisabled = homeStarters.length !== 5 || awayStarters.length !== 5

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-slate-50">Select Starting Lineup</DialogTitle>
          <DialogDescription className="text-slate-400">
            Choose 5 starters for each team to begin the game.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Home Team Starters */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-violet-500 rounded-full" />
              <h3 className="text-lg font-semibold text-slate-50">
                {game.homeTeam.name}
              </h3>
              <span className="text-sm text-slate-400">
                ({homeStarters.length}/5 selected)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {game.homeTeam.players.map((player) => (
                <div
                  key={player.id}
                  className={cn(
                    'flex items-center space-x-2 p-3 rounded-lg border transition-colors',
                    homeStarters.includes(player.id)
                      ? 'bg-violet-500/10 border-violet-500'
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-750',
                    homeStarters.length >= 5 && !homeStarters.includes(player.id) && 'opacity-50'
                  )}
                >
                  <Checkbox
                    id={`home-${player.id}`}
                    checked={homeStarters.includes(player.id)}
                    onCheckedChange={() => toggleHomeStarter(player.id)}
                    disabled={homeStarters.length >= 5 && !homeStarters.includes(player.id)}
                    className="border-slate-600"
                  />
                  <Label
                    htmlFor={`home-${player.id}`}
                    className="flex-1 cursor-pointer text-slate-200"
                  >
                    <span className="font-medium">#{player.jerseyNumber}</span> {player.name}
                    <span className="text-xs text-slate-500 ml-2">({player.position})</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Away Team Starters */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-sky-500 rounded-full" />
              <h3 className="text-lg font-semibold text-slate-50">
                {game.awayTeam.name}
              </h3>
              <span className="text-sm text-slate-400">
                ({awayStarters.length}/5 selected)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {game.awayTeam.players.map((player) => (
                <div
                  key={player.id}
                  className={cn(
                    'flex items-center space-x-2 p-3 rounded-lg border transition-colors',
                    awayStarters.includes(player.id)
                      ? 'bg-sky-500/10 border-sky-500'
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-750',
                    awayStarters.length >= 5 && !awayStarters.includes(player.id) && 'opacity-50'
                  )}
                >
                  <Checkbox
                    id={`away-${player.id}`}
                    checked={awayStarters.includes(player.id)}
                    onCheckedChange={() => toggleAwayStarter(player.id)}
                    disabled={awayStarters.length >= 5 && !awayStarters.includes(player.id)}
                    className="border-slate-600"
                  />
                  <Label
                    htmlFor={`away-${player.id}`}
                    className="flex-1 cursor-pointer text-slate-200"
                  >
                    <span className="font-medium">#{player.jerseyNumber}</span> {player.name}
                    <span className="text-xs text-slate-500 ml-2">({player.position})</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled || setStarters.isPending}
            className={cn(
              'w-full',
              !isSubmitDisabled && 'bg-green-600 hover:bg-green-700 text-white'
            )}
          >
            {setStarters.isPending ? 'Setting Starters...' : 'Start Game'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
