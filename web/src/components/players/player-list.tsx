'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Player } from '@/lib/stores/players-store'

interface PlayerListProps {
  players: Player[]
  onEdit?: (player: Player) => void
  onDelete?: (playerId: string) => void
  title: string
  emptyMessage?: string
}

export function PlayerList({ players, onEdit, onDelete, title, emptyMessage }: PlayerListProps) {
  const getPositionColor = (position: string) => {
    const colors = {
      'PG': 'bg-blue-100 text-blue-800',
      'SG': 'bg-green-100 text-green-800',
      'SF': 'bg-yellow-100 text-yellow-800',
      'PF': 'bg-orange-100 text-orange-800',
      'C': 'bg-purple-100 text-purple-800',
    }
    return colors[position as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (players.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            {emptyMessage || 'No players added yet'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Badge variant="outline">{players.length} players</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {/* Jersey Number */}
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold">
                  #{player.number}
                </div>
                
                {/* Player Info */}
                <div>
                  <div className="font-semibold">{player.name}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge className={getPositionColor(player.position)} variant="secondary">
                      {player.position}
                    </Badge>
                    {player.height && <span>{player.height}</span>}
                    {player.weight && <span>{player.weight}</span>}
                  </div>
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center gap-2">
                {player.isActive ? (
                  <Badge className="bg-green-500">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
                
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(player)}
                  >
                    Edit
                  </Button>
                )}
                
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Delete ${player.name}?`)) {
                        onDelete(player.id)
                      }
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}