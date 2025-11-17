'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Player } from '@/lib/stores/players-store'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { ChevronDown } from 'lucide-react'

interface ActivePlayersBarProps {
  activePlayer: string | null
  onPlayerSelect: (playerId: string) => void
  courtPlayers: Player[]
  benchPlayers: Player[]
  playingTime: Record<string, number>
  onBenchOpen: () => void
  selectedTeam: 'home' | 'away'
}

export function ActivePlayersBar({
  activePlayer,
  onPlayerSelect,
  courtPlayers,
  benchPlayers,
  playingTime,
  onBenchOpen,
  selectedTeam,
}: ActivePlayersBarProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (selectedTeam === 'away') {
    return (
      <Card className="border-none shadow-sm flex-shrink-0">
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground text-center">
            Opponent roster management not available in away mode
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-none shadow-2xl bg-gradient-to-r from-white/95 via-white/92 to-white/95 backdrop-blur-md flex-shrink-0 rounded-2xl border border-white/40">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4 min-h-[100px]">
          {/* Court Players */}
          <div className="flex gap-2 flex-1 overflow-x-auto pb-2">
            {courtPlayers.map((player) => (
              <div
                key={player.id}
                className="flex flex-col items-center gap-2 flex-shrink-0"
              >
                <Button
                  onClick={() => onPlayerSelect(player.id)}
                  variant={activePlayer === player.id ? 'default' : 'outline'}
                  className={cn(
                    'h-16 w-16 p-0 rounded-full flex flex-col items-center justify-center relative transition-all shadow-md hover:shadow-lg',
                    activePlayer === player.id && 'ring-4 ring-primary ring-offset-2 shadow-lg scale-110 bg-primary'
                  )}
                >
                  <PlayerAvatar
                    firstName={player.name.split(' ')[0]}
                    lastName={player.name.split(' ')[1] || ''}
                    src={player.avatar}
                    jerseyNumber={player.number}
                    className="h-12 w-12 rounded-full"
                  />
                </Button>

                {/* Jersey Number */}
                <div className="text-xs font-bold text-center leading-tight">
                  #{player.number}
                </div>

                {/* Playing Time */}
                <div className="text-[10px] font-semibold text-primary text-center tabular-nums">
                  {formatTime(playingTime[player.id] || 0)}
                </div>
              </div>
            ))}
          </div>

          {/* Bench Button */}
          <Button
            onClick={onBenchOpen}
            variant="outline"
            className={cn(
              'h-16 w-16 p-0 flex flex-col items-center justify-center gap-1 flex-shrink-0 relative rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-2',
              benchPlayers.length > 0
                ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 ring-2 ring-yellow-400/50 hover:bg-yellow-100 dark:hover:bg-yellow-950/30'
                : 'border-muted-foreground/30 bg-muted/50 hover:bg-muted'
            )}
          >
            <div className="text-xs font-bold text-center leading-tight">
              {benchPlayers.length > 0 ? '🪑' : '📦'}
            </div>
            <div className="text-[11px] font-semibold text-center">Bench</div>
            {benchPlayers.length > 0 && (
              <Badge variant="destructive" className="text-[9px] h-5 px-1.5 font-bold rounded-full">
                {benchPlayers.length}
              </Badge>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
