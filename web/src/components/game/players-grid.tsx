'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Player, usePlayersStore } from '@/lib/stores/players-store'
import { PlayerAvatar } from '@/components/ui/player-avatar'

interface PlayersGridProps {
  selectedPlayer: string | null
  onPlayerSelect: (playerId: string) => void
}

export function PlayersGrid({
  selectedPlayer,
  onPlayerSelect
}: PlayersGridProps) {
  const { getActivePlayers } = usePlayersStore()
  const players = getActivePlayers()

  const PlayerCard = ({ player, isSelected }: { player: Player, isSelected: boolean }) => (
    <Button
      variant={isSelected ? 'default' : 'outline'}
      className={cn(
        'h-auto flex-col justify-center p-3 gap-2 transition-all duration-200',
        isSelected && 'ring-2 ring-primary ring-offset-2 shadow-md'
      )}
      onClick={() => onPlayerSelect(player.id)}
    >
      <PlayerAvatar
        firstName={player.name.split(' ')[0]}
        lastName={player.name.split(' ')[1] || ''}
        src={player.avatar}
        jerseyNumber={player.number}
        className="h-12 w-12"
      />
      <div className="text-[11px] truncate w-full leading-tight text-center font-medium">{player.name.split(' ')[0]}</div>
    </Button>
  )

  return (
    <Card className="h-full flex flex-col shadow-sm">
      <CardHeader className="pb-3 pt-3 flex-shrink-0">
        <CardTitle className="text-sm font-bold">🏀 Your Team</CardTitle>
      </CardHeader>

      <CardContent className="p-3 pt-0 flex-1 overflow-y-auto">
        {/* Current Selection Display - Compact */}
        {selectedPlayer && players.find(p => p.id === selectedPlayer) && (
          <div className="mb-3 p-2.5 bg-primary/10 rounded-md text-xs flex items-center gap-2 flex-shrink-0">
            {(() => {
              const player = players.find(p => p.id === selectedPlayer)
              return player ? (
                <>
                  <PlayerAvatar
                    firstName={player.name.split(' ')[0]}
                    lastName={player.name.split(' ')[1] || ''}
                    src={player.avatar}
                    jerseyNumber={player.number}
                    className="h-7 w-7"
                  />
                  <span className="font-semibold text-primary line-clamp-1">
                    #{player.number} {player.name}
                  </span>
                </>
              ) : null
            })()}
          </div>
        )}

        {/* Players Grid */}
        {players.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                isSelected={selectedPlayer === player.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-xs mb-1">No players in roster</p>
            <p className="text-[10px]">
              <a href="/players" className="text-primary hover:underline">
                Add players
              </a>
            </p>
          </div>
        )}

        {/* Quick Actions - Compact */}
        {players.length > 0 && selectedPlayer && (
          <div className="mt-2 pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPlayerSelect('')}
              className="w-full h-7 text-xs"
            >
              Clear
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}