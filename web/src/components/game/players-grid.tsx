'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Player, usePlayersStore } from '@/lib/stores/players-store'

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
        'h-12 flex-col justify-center p-1.5',
        isSelected && 'ring-2 ring-primary ring-offset-1'
      )}
      onClick={() => onPlayerSelect(player.id)}
    >
      <div className="text-sm font-bold">#{player.number}</div>
      <div className="text-[10px] truncate w-full leading-tight">{player.name.split(' ')[0]}</div>
    </Button>
  )

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-2 pt-2">
        <CardTitle className="text-sm font-semibold">🏀 Your Team</CardTitle>
      </CardHeader>

      <CardContent className="p-2 pt-0">
        {/* Current Selection Display - Compact */}
        {selectedPlayer && (
          <div className="mb-2 p-2 bg-primary/10 rounded text-xs">
            <div className="font-medium text-primary">
              #{players.find(p => p.id === selectedPlayer)?.number} {players.find(p => p.id === selectedPlayer)?.name}
            </div>
          </div>
        )}

        {/* Players Grid */}
        {players.length > 0 ? (
          <div className="grid grid-cols-2 gap-1.5">
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