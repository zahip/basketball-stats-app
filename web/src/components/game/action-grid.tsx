'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target, TrendingUp, Shield, Zap, Hand, Users } from 'lucide-react'

interface ActionGridProps {
  selectedPlayer: string | null
  onAction: (eventType: string, data?: any) => void
  disabled?: boolean
  selectedTeam?: 'home' | 'away'
}

export function ActionGrid({ selectedPlayer, onAction, disabled, selectedTeam = 'home' }: ActionGridProps) {
  const shotActions = [
    { type: 'SHOT_2_MADE', label: '2PT', sublabel: 'Made', variant: 'success' as const },
    { type: 'SHOT_2_MISS', label: '2PT', sublabel: 'Miss', variant: 'destructive' as const },
    { type: 'SHOT_3_MADE', label: '3PT', sublabel: 'Made', variant: 'success' as const },
    { type: 'SHOT_3_MISS', label: '3PT', sublabel: 'Miss', variant: 'destructive' as const },
    { type: 'FT_MADE', label: 'FT', sublabel: 'Made', variant: 'success' as const },
    { type: 'FT_MISS', label: 'FT', sublabel: 'Miss', variant: 'destructive' as const },
  ]

  const playActions = [
    { type: 'AST', label: 'AST', icon: Users, variant: 'default' as const },
    { type: 'REB_O', label: 'OReb', icon: TrendingUp, variant: 'default' as const },
    { type: 'REB_D', label: 'DReb', icon: Shield, variant: 'default' as const },
    { type: 'STL', label: 'Steal', icon: Zap, variant: 'default' as const },
    { type: 'BLK', label: 'Block', icon: Hand, variant: 'default' as const },
    { type: 'TOV', label: 'TO', icon: null, variant: 'warning' as const },
  ]

  const otherActions = [
    { type: 'FOUL', label: 'Foul', variant: 'warning' as const },
    { type: 'SUB_IN', label: 'Sub In', variant: 'success' as const },
    { type: 'SUB_OUT', label: 'Sub Out', variant: 'default' as const },
  ]

  const isActionDisabled = disabled || (selectedTeam === 'home' && !selectedPlayer)

  const handleAction = (actionType: string) => {
    if (isActionDisabled) return
    onAction(actionType, {
      playerId: selectedPlayer,
      timestamp: Date.now()
    })
  }

  const ShotButton = ({ action }: { action: typeof shotActions[0] }) => (
    <Button
      onClick={() => handleAction(action.type)}
      disabled={isActionDisabled}
      variant={action.variant}
      size="touch"
      className="h-16 flex-col gap-0.5"
    >
      <span className="text-base font-bold">{action.label}</span>
      <span className="text-xs opacity-90">{action.sublabel}</span>
    </Button>
  )

  const PlayButton = ({ action }: { action: typeof playActions[0] }) => {
    const Icon = action.icon
    return (
      <Button
        onClick={() => handleAction(action.type)}
        disabled={isActionDisabled}
        variant={action.variant}
        size="touch"
        className="h-14"
      >
        {Icon && <Icon className="h-4 w-4" />}
        <span className="text-sm font-semibold">{action.label}</span>
      </Button>
    )
  }

  return (
    <div className="space-y-3">
      {/* Selection Status */}
      <Card className="bg-gradient-to-br from-muted/30 to-muted/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                variant={selectedTeam === 'home' ? 'home-team' : 'away-team'}
                size="lg"
              >
                {selectedTeam === 'home' ? 'Your Team' : 'Opponent'}
              </Badge>
              {selectedTeam === 'home' && selectedPlayer && (
                <Badge variant="outline" size="lg">
                  #{selectedPlayer}
                </Badge>
              )}
            </div>
            {isActionDisabled && selectedTeam === 'home' && (
              <Badge variant="warning" size="sm">
                Select player
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Shooting Actions */}
      <Card className="border-l-4 border-l-success">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-success" />
            <CardTitle className="text-sm font-bold">Shooting</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {shotActions.map((action) => (
              <ShotButton key={action.type} action={action} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Play Actions */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-bold">Plays</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {playActions.map((action) => (
              <PlayButton key={action.type} action={action} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Other Actions */}
      <Card className="border-l-4 border-l-warning">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Hand className="h-5 w-5 text-warning" />
            <CardTitle className="text-sm font-bold">Other</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {otherActions.map((action) => (
              <Button
                key={action.type}
                onClick={() => handleAction(action.type)}
                disabled={isActionDisabled}
                variant={action.variant}
                size="touch"
              >
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}