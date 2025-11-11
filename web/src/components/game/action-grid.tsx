'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ActionGridProps {
  selectedPlayer: string | null
  onAction: (eventType: string, data?: any) => void
  disabled?: boolean
}

export function ActionGrid({ selectedPlayer, onAction, disabled }: ActionGridProps) {
  const shotActions = [
    { type: 'SHOT_2_MADE', label: '🏀 2PT Made', color: 'bg-green-600' },
    { type: 'SHOT_2_MISS', label: '❌ 2PT Miss', color: 'bg-red-600' },
    { type: 'SHOT_3_MADE', label: '🎯 3PT Made', color: 'bg-green-600' },
    { type: 'SHOT_3_MISS', label: '❌ 3PT Miss', color: 'bg-red-600' },
    { type: 'FT_MADE', label: '✅ FT Made', color: 'bg-green-600' },
    { type: 'FT_MISS', label: '❌ FT Miss', color: 'bg-red-600' },
  ]

  const playActions = [
    { type: 'AST', label: '🤝 Assist', color: 'bg-blue-600' },
    { type: 'REB_O', label: '↗️ Off Reb', color: 'bg-orange-600' },
    { type: 'REB_D', label: '↘️ Def Reb', color: 'bg-purple-600' },
    { type: 'STL', label: '🔥 Steal', color: 'bg-yellow-600' },
    { type: 'BLK', label: '🚫 Block', color: 'bg-red-600' },
    { type: 'TOV', label: '😔 Turnover', color: 'bg-gray-600' },
  ]

  const foulActions = [
    { type: 'FOUL', label: '🟡 Foul', color: 'bg-yellow-500' },
  ]

  const substitutionActions = [
    { type: 'SUB_IN', label: '➡️ Sub In', color: 'bg-green-600' },
    { type: 'SUB_OUT', label: '⬅️ Sub Out', color: 'bg-blue-600' },
  ]

  const isActionDisabled = disabled || !selectedPlayer

  const handleAction = (actionType: string) => {
    if (isActionDisabled) return
    onAction(actionType, {
      playerId: selectedPlayer,
      timestamp: Date.now()
    })
  }

  const ActionButton = ({ action, size = 'default' }: { action: any, size?: 'sm' | 'default' | 'lg' }) => (
    <Button
      onClick={() => handleAction(action.type)}
      disabled={isActionDisabled}
      className={`${action.color} hover:opacity-90 text-white font-bold`}
      size={size}
    >
      {action.label}
    </Button>
  )

  return (
    <div className="space-y-4">
      {/* Selection Status */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span>Selected:</span>
              {selectedPlayer ? (
                <Badge variant="outline">Player #{selectedPlayer}</Badge>
              ) : (
                <span className="text-muted-foreground">No player selected</span>
              )}
            </div>
            {isActionDisabled && (
              <span className="text-yellow-600 text-xs">⚠️ Select a player first</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Shooting Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">🏀 Shooting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {shotActions.map((action) => (
              <ActionButton key={action.type} action={action} size="lg" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Play Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">⚡ Plays</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {playActions.map((action) => (
              <ActionButton key={action.type} action={action} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fouls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">⚠️ Fouls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2">
            {foulActions.map((action) => (
              <ActionButton key={action.type} action={action} size="sm" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Substitutions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">↔️ Substitutions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {substitutionActions.map((action) => (
              <ActionButton key={action.type} action={action} size="sm" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}