'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Player, usePlayersStore } from '@/lib/stores/players-store'
import { PlayerAvatar } from '@/components/ui/player-avatar'

interface PlayersRosterProps {
  selectedPlayer: string | null
  onPlayerSelect: (playerId: string) => void
  courtPlayers: string[] // Player IDs on court
  onCourtChange: (playerIds: string[]) => void // When player enters/leaves court
}

export function PlayersRoster({
  selectedPlayer,
  onPlayerSelect,
  courtPlayers,
  onCourtChange,
}: PlayersRosterProps) {
  const { getActivePlayers } = usePlayersStore()
  const allPlayers = getActivePlayers()
  const [playingTime, setPlayingTime] = useState<Record<string, number>>({}) // playerId -> seconds

  const court = allPlayers.filter(p => courtPlayers.includes(p.id))
  const bench = allPlayers.filter(p => !courtPlayers.includes(p.id))

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const PlayerButtonSmall = ({ player, isSelected }: { player: Player; isSelected: boolean }) => (
    <Button
      variant={isSelected ? 'default' : 'outline'}
      className={cn(
        'h-auto flex-col justify-center p-2 gap-1',
        isSelected && 'ring-2 ring-primary ring-offset-1 shadow-md'
      )}
      onClick={() => onPlayerSelect(player.id)}
    >
      <PlayerAvatar
        firstName={player.name.split(' ')[0]}
        lastName={player.name.split(' ')[1] || ''}
        src={player.avatar}
        jerseyNumber={player.number}
        className="h-8 w-8"
      />
      <div className="text-[9px] truncate w-full leading-tight text-center font-medium">
        #{player.number}
      </div>
    </Button>
  )

  const PlayerRowSmall = ({ player, isOnCourt }: { player: Player; isOnCourt: boolean }) => (
    <div
      className={cn(
        'p-2 rounded border flex items-center justify-between gap-2',
        isOnCourt ? 'bg-green-50 dark:bg-green-950/30 border-green-300' : 'bg-slate-50 dark:bg-slate-950/30 border-slate-200'
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <PlayerAvatar
          firstName={player.name.split(' ')[0]}
          lastName={player.name.split(' ')[1] || ''}
          src={player.avatar}
          jerseyNumber={player.number}
          className="h-6 w-6"
        />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold truncate">#{player.number} {player.name.split(' ')[0]}</div>
          {isOnCourt && (
            <div className="text-[10px] text-green-700 dark:text-green-300 font-medium">
              On court: {formatTime(playingTime[player.id] || 0)}
            </div>
          )}
        </div>
      </div>
      <Button
        variant={isOnCourt ? 'destructive' : 'default'}
        size="sm"
        className="h-6 px-2 text-xs font-semibold"
        onClick={() => {
          if (isOnCourt) {
            // Player leaving court - update total playing time
            onCourtChange(courtPlayers.filter(id => id !== player.id))
          } else {
            // Player entering court
            onCourtChange([...courtPlayers, player.id])
          }
        }}
      >
        {isOnCourt ? 'Sub Out' : 'Sub In'}
      </Button>
    </div>
  )

  return (
    <Card className="h-full flex flex-col shadow-sm">
      <CardHeader className="pb-2 pt-3 flex-shrink-0">
        <CardTitle className="text-sm font-bold">🏀 Roster</CardTitle>
      </CardHeader>

      <CardContent className="p-3 pt-0 flex-1 overflow-hidden flex flex-col">
        <Tabs defaultValue="court" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="court" className="text-xs">
              Court ({court.length}/5)
            </TabsTrigger>
            <TabsTrigger value="bench" className="text-xs">
              Bench ({bench.length})
            </TabsTrigger>
          </TabsList>

          {/* Court Tab - Grid of 5 players */}
          <TabsContent value="court" className="flex-1 overflow-y-auto mt-2">
            <div className="grid grid-cols-5 gap-1.5 pb-2">
              {court.length > 0 ? (
                court.map((player) => (
                  <PlayerButtonSmall
                    key={player.id}
                    player={player}
                    isSelected={selectedPlayer === player.id}
                  />
                ))
              ) : (
                <div className="col-span-5 text-center py-4 text-xs text-muted-foreground">
                  No players on court. Add from bench.
                </div>
              )}
            </div>
          </TabsContent>

          {/* Bench Tab - List of substitute players */}
          <TabsContent value="bench" className="flex-1 overflow-y-auto mt-2 space-y-1.5 pb-2">
            {bench.length > 0 ? (
              bench.map((player) => (
                <PlayerRowSmall
                  key={player.id}
                  player={player}
                  isOnCourt={false}
                />
              ))
            ) : (
              <div className="text-center py-4 text-xs text-muted-foreground">
                All players on court
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
