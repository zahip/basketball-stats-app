'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Player {
  id: string
  number: number
  name: string
  position: string
}

interface PlayersGridProps {
  homePlayers: Player[]
  awayPlayers: Player[]
  selectedPlayer: string | null
  selectedTeam: 'home' | 'away' | null
  onPlayerSelect: (playerId: string, team: 'home' | 'away') => void
}

// Mock players data
const mockHomePlayers: Player[] = [
  { id: '1', number: 23, name: 'LeBron James', position: 'SF' },
  { id: '2', number: 6, name: 'Anthony Davis', position: 'PF' },
  { id: '3', number: 1, name: 'D\'Angelo Russell', position: 'PG' },
  { id: '4', number: 15, name: 'Austin Reaves', position: 'SG' },
  { id: '5', number: 28, name: 'Rui Hachimura', position: 'PF' },
]

const mockAwayPlayers: Player[] = [
  { id: '6', number: 30, name: 'Stephen Curry', position: 'PG' },
  { id: '7', number: 11, name: 'Klay Thompson', position: 'SG' },
  { id: '8', number: 23, name: 'Draymond Green', position: 'PF' },
  { id: '9', number: 22, name: 'Andrew Wiggins', position: 'SF' },
  { id: '10', number: 5, name: 'Kevon Looney', position: 'C' },
]

export function PlayersGrid({
  homePlayers = mockHomePlayers,
  awayPlayers = mockAwayPlayers,
  selectedPlayer,
  selectedTeam,
  onPlayerSelect
}: PlayersGridProps) {
  const [activeTeamTab, setActiveTeamTab] = useState<'home' | 'away'>('home')

  const PlayerCard = ({ player, team, isSelected }: { player: Player, team: 'home' | 'away', isSelected: boolean }) => (
    <Button
      variant={isSelected ? 'default' : 'outline'}
      className={cn(
        'h-16 flex-col justify-center p-2',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        team === 'home' ? 'border-red-200 hover:border-red-300' : 'border-blue-200 hover:border-blue-300'
      )}
      onClick={() => onPlayerSelect(player.id, team)}
    >
      <div className="text-lg font-bold">#{player.number}</div>
      <div className="text-xs truncate w-full">{player.name}</div>
      <div className="text-xs text-muted-foreground">{player.position}</div>
    </Button>
  )

  const currentPlayers = activeTeamTab === 'home' ? homePlayers : awayPlayers

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">👥 Players</CardTitle>
        
        {/* Team Toggle */}
        <div className="flex rounded-lg bg-muted p-1">
          <Button
            variant={activeTeamTab === 'home' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTeamTab('home')}
            className={cn(
              'flex-1',
              activeTeamTab === 'home' && 'bg-red-600 text-white hover:bg-red-700'
            )}
          >
            🏠 Home
          </Button>
          <Button
            variant={activeTeamTab === 'away' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTeamTab('away')}
            className={cn(
              'flex-1',
              activeTeamTab === 'away' && 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            ✈️ Away
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Current Selection Display */}
        {selectedPlayer && selectedTeam && (
          <div className="mb-4 p-3 bg-primary/10 rounded-lg">
            <div className="text-sm font-medium text-primary">
              Selected: {selectedTeam === 'home' ? '🏠' : '✈️'} Player #{
                currentPlayers.find(p => p.id === selectedPlayer)?.number ||
                (selectedTeam === 'home' ? awayPlayers : homePlayers).find(p => p.id === selectedPlayer)?.number
              }
            </div>
            <div className="text-xs text-muted-foreground">
              {(selectedTeam === activeTeamTab ? currentPlayers : (selectedTeam === 'home' ? homePlayers : awayPlayers))
                .find(p => p.id === selectedPlayer)?.name}
            </div>
          </div>
        )}

        {/* Players Grid */}
        <div className="grid grid-cols-2 gap-2">
          {currentPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              team={activeTeamTab}
              isSelected={selectedPlayer === player.id && selectedTeam === activeTeamTab}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-4 pt-3 border-t">
          <div className="text-xs text-muted-foreground mb-2">Quick Select:</div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => selectedPlayer && onPlayerSelect('', selectedTeam || 'home')}
              disabled={!selectedPlayer}
            >
              Clear
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveTeamTab(activeTeamTab === 'home' ? 'away' : 'home')}
            >
              Switch Team
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}