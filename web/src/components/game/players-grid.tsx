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
        'h-16 flex-col justify-center p-2',
        isSelected && 'ring-2 ring-primary ring-offset-2'
      )}
      onClick={() => onPlayerSelect(player.id)}
    >
      <div className="text-lg font-bold">#{player.number}</div>
      <div className="text-xs truncate w-full">{player.name}</div>
      <div className="text-xs text-muted-foreground">{player.position}</div>
    </Button>
  )

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">🏀 Your Team</CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Current Selection Display */}
        {selectedPlayer && (
          <div className="mb-4 p-3 bg-primary/10 rounded-lg">
            <div className="text-sm font-medium text-primary">
              Selected: Player #{players.find(p => p.id === selectedPlayer)?.number}
            </div>
            <div className="text-xs text-muted-foreground">
              {players.find(p => p.id === selectedPlayer)?.name}
            </div>
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
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-2">No players in your roster</p>
            <p className="text-sm">
              <a href="/players" className="text-primary hover:underline">
                Add players
              </a> to get started
            </p>
          </div>
        )}

        {/* Quick Actions */}
        {players.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <div className="text-xs text-muted-foreground mb-2">Quick Actions:</div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPlayerSelect('')}
                disabled={!selectedPlayer}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}