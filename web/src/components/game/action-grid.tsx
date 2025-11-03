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
    { type: 'field_goal_made', label: '🏀 FG Made', color: 'bg-green-600' },
    { type: 'field_goal_missed', label: '❌ FG Miss', color: 'bg-red-600' },
    { type: 'three_point_made', label: '🎯 3PT Made', color: 'bg-green-600' },
    { type: 'three_point_missed', label: '❌ 3PT Miss', color: 'bg-red-600' },
    { type: 'free_throw_made', label: '✅ FT Made', color: 'bg-green-600' },
    { type: 'free_throw_missed', label: '❌ FT Miss', color: 'bg-red-600' },
  ]

  const playActions = [
    { type: 'assist', label: '🤝 Assist', color: 'bg-blue-600' },
    { type: 'rebound_offensive', label: '↗️ Off Reb', color: 'bg-orange-600' },
    { type: 'rebound_defensive', label: '↘️ Def Reb', color: 'bg-purple-600' },
    { type: 'steal', label: '🔥 Steal', color: 'bg-yellow-600' },
    { type: 'block', label: '🚫 Block', color: 'bg-red-600' },
    { type: 'turnover', label: '😔 Turnover', color: 'bg-gray-600' },
  ]

  const foulActions = [
    { type: 'personal_foul', label: '🟡 Personal', color: 'bg-yellow-500' },
    { type: 'technical_foul', label: '🟠 Technical', color: 'bg-orange-500' },
    { type: 'flagrant_foul', label: '🔴 Flagrant', color: 'bg-red-500' },
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
    </div>
  )
}