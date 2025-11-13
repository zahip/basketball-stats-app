'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ActionGridProps {
  selectedPlayer: string | null
  onAction: (eventType: string, data?: any) => void
  disabled?: boolean
  selectedTeam?: 'home' | 'away'
}

export function ActionGrid({ selectedPlayer, onAction, disabled, selectedTeam = 'home' }: ActionGridProps) {
  const shotActions = [
    { type: 'SHOT_2_MADE', label: '🏀 2PT Made', shortLabel: '2PT ✓', color: 'bg-green-600' },
    { type: 'SHOT_2_MISS', label: '❌ 2PT Miss', shortLabel: '2PT ✗', color: 'bg-red-600' },
    { type: 'SHOT_3_MADE', label: '🎯 3PT Made', shortLabel: '3PT ✓', color: 'bg-green-600' },
    { type: 'SHOT_3_MISS', label: '❌ 3PT Miss', shortLabel: '3PT ✗', color: 'bg-red-600' },
    { type: 'FT_MADE', label: '✅ FT Made', shortLabel: 'FT ✓', color: 'bg-green-600' },
    { type: 'FT_MISS', label: '❌ FT Miss', shortLabel: 'FT ✗', color: 'bg-red-600' },
  ]

  const playActions = [
    { type: 'AST', label: '🤝 Assist', shortLabel: '🤝 Ast', color: 'bg-blue-600' },
    { type: 'REB_O', label: '↗️ Off Reb', shortLabel: '↗️ OReb', color: 'bg-orange-600' },
    { type: 'REB_D', label: '↘️ Def Reb', shortLabel: '↘️ DReb', color: 'bg-purple-600' },
    { type: 'STL', label: '🔥 Steal', shortLabel: '🔥 Stl', color: 'bg-yellow-600' },
    { type: 'BLK', label: '🚫 Block', shortLabel: '🚫 Blk', color: 'bg-red-600' },
    { type: 'TOV', label: '😔 Turnover', shortLabel: '😔 TO', color: 'bg-gray-600' },
  ]

  const otherActions = [
    { type: 'FOUL', label: '🟡 Foul', shortLabel: '🟡 Foul', color: 'bg-yellow-500' },
    { type: 'SUB_IN', label: '➡️ Sub In', shortLabel: '➡️ In', color: 'bg-green-600' },
    { type: 'SUB_OUT', label: '⬅️ Sub Out', shortLabel: '⬅️ Out', color: 'bg-blue-600' },
  ]

  const isActionDisabled = disabled || (selectedTeam === 'home' && !selectedPlayer)

  const handleAction = (actionType: string) => {
    if (isActionDisabled) return
    onAction(actionType, {
      playerId: selectedPlayer,
      timestamp: Date.now()
    })
  }

  const ActionButton = ({ action, size = 'sm', useShortLabel = false }: { action: any, size?: 'sm' | 'default' | 'lg', useShortLabel?: boolean }) => (
    <Button
      onClick={() => handleAction(action.type)}
      disabled={isActionDisabled}
      className={`${action.color} hover:opacity-80 active:opacity-100 text-white font-semibold h-auto py-2.5 px-1.5 transition-opacity duration-150 disabled:opacity-50`}
      size={size}
    >
      <span className="text-xs sm:text-sm font-medium leading-tight">
        {useShortLabel ? action.shortLabel : action.label}
      </span>
    </Button>
  )

  return (
    <div className="space-y-1.5">
      {/* Selection Status - Ultra Compact */}
      <Card>
        <CardContent className="p-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-medium">
                {selectedTeam === 'home' ? '🏀 Your Team' : '👥 Opponent'}
              </span>
              {selectedTeam === 'home' && (
                <>
                  {selectedPlayer ? (
                    <Badge variant="outline" className="text-xs h-5">Player #{selectedPlayer}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">No player</span>
                  )}
                </>
              )}
            </div>
            {isActionDisabled && selectedTeam === 'home' && (
              <span className="text-yellow-600 text-[10px]">⚠️ Select player</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Shooting Actions - Responsive grid */}
      <Card className="border-l-4 border-l-green-600">
        <CardHeader className="pb-1.5 pt-2.5 px-3">
          <CardTitle className="text-xs font-bold">🏀 Shooting</CardTitle>
        </CardHeader>
        <CardContent className="p-2.5 pt-0">
          <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
            {shotActions.map((action) => (
              <ActionButton key={action.type} action={action} size="sm" useShortLabel={true} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Play Actions - Responsive grid */}
      <Card className="border-l-4 border-l-blue-600">
        <CardHeader className="pb-1.5 pt-2.5 px-3">
          <CardTitle className="text-xs font-bold">⚡ Plays</CardTitle>
        </CardHeader>
        <CardContent className="p-2.5 pt-0">
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-3 gap-1.5">
            {playActions.map((action) => (
              <ActionButton key={action.type} action={action} size="sm" useShortLabel={true} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fouls & Substitutions - Combined */}
      <Card className="border-l-4 border-l-yellow-500">
        <CardHeader className="pb-1.5 pt-2.5 px-3">
          <CardTitle className="text-xs font-bold">⚠️ Other</CardTitle>
        </CardHeader>
        <CardContent className="p-2.5 pt-0">
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-3 gap-1.5">
            {otherActions.map((action) => (
              <ActionButton key={action.type} action={action} size="sm" useShortLabel={true} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}