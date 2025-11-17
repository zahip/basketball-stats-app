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
    <Card className="border-none shadow-sm flex-shrink-0">
      <CardContent className="p-1">
        <div className="flex items-center justify-between gap-1 min-h-[50px]">
          {/* Court Players */}
          <div className="flex gap-2 flex-1 overflow-x-auto pb-2">
            {courtPlayers.length > 0 ? (
              courtPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex flex-col items-center gap-1 flex-shrink-0"
                >
                  <Button
                    onClick={() => onPlayerSelect(player.id)}
                    variant={activePlayer === player.id ? 'default' : 'outline'}
                    className={cn(
                      'h-10 w-10 p-0 flex flex-col items-center justify-center relative transition-all',
                      activePlayer === player.id && 'ring-2 ring-primary ring-offset-1 shadow-md scale-105'
                    )}
                  >
                    <PlayerAvatar
                      firstName={player.name.split(' ')[0]}
                      lastName={player.name.split(' ')[1] || ''}
                      src={player.avatar}
                      jerseyNumber={player.number}
                      className="h-6 w-6"
                    />
                  </Button>

                  {/* Jersey Number */}
                  <div className="text-[9px] font-bold text-center leading-tight">
                    #{player.number}
                  </div>

                  {/* Playing Time */}
                  <div className="text-[8px] font-semibold text-primary text-center">
                    {formatTime(playingTime[player.id] || 0)}
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full flex items-center justify-center text-sm text-muted-foreground">
                No players on court
              </div>
            )}
          </div>

          {/* Bench Button */}
          <Button
            onClick={onBenchOpen}
            variant="outline"
            className={cn(
              'h-10 w-10 p-0 flex flex-col items-center justify-center gap-0.5 flex-shrink-0 relative',
              benchPlayers.length > 0 && 'ring-2 ring-yellow-500/50'
            )}
          >
            <div className="text-[9px] font-bold text-center">Bench</div>
            {benchPlayers.length > 0 && (
              <>
                <Badge variant="secondary" className="text-[8px] h-3 px-0.5">
                  {benchPlayers.length}
                </Badge>
                <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
