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
      size="sm"
      className="h-11 flex-col gap-0.5 py-1.5 px-1 text-xs"
    >
      <span className="font-bold leading-none">{action.label}</span>
      <span className="text-[10px] opacity-90 leading-none">{action.sublabel}</span>
    </Button>
  )

  const PlayButton = ({ action }: { action: typeof playActions[0] }) => {
    const Icon = action.icon
    return (
      <Button
        onClick={() => handleAction(action.type)}
        disabled={isActionDisabled}
        variant={action.variant}
        size="sm"
        className="h-10 gap-1 px-2 py-1.5 text-xs"
      >
        {Icon && <Icon className="h-3.5 w-3.5" />}
        <span className="font-semibold">{action.label}</span>
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      {/* Selection Status - Compact */}
      <Card className="bg-gradient-to-br from-muted/30 to-muted/10 border-none shadow-sm">
        <CardContent className="p-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge
                variant={selectedTeam === 'home' ? 'home-team' : 'away-team'}
                size="sm"
              >
                {selectedTeam === 'home' ? 'Your Team' : 'Opponent'}
              </Badge>
              {selectedTeam === 'home' && selectedPlayer && (
                <Badge variant="outline" size="sm" className="text-xs">
                  #{selectedPlayer}
                </Badge>
              )}
            </div>
            {isActionDisabled && selectedTeam === 'home' && (
              <Badge variant="warning" size="sm" className="text-[10px]">
                Select
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Shooting Actions - 3x2 Grid */}
      <Card className="border-l-4 border-l-success shadow-sm">
        <CardHeader className="pb-1.5 pt-2">
          <div className="flex items-center gap-1.5">
            <Target className="h-4 w-4 text-success" />
            <CardTitle className="text-xs font-bold">Shots</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          <div className="grid grid-cols-3 gap-1.5">
            {shotActions.map((action) => (
              <ShotButton key={action.type} action={action} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Play Actions - 3x2 Grid */}
      <Card className="border-l-4 border-l-primary shadow-sm">
        <CardHeader className="pb-1.5 pt-2">
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-primary" />
            <CardTitle className="text-xs font-bold">Plays</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          <div className="grid grid-cols-3 gap-1.5">
            {playActions.map((action) => (
              <PlayButton key={action.type} action={action} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Other Actions - 3x1 Grid */}
      <Card className="border-l-4 border-l-warning shadow-sm">
        <CardHeader className="pb-1.5 pt-2">
          <div className="flex items-center gap-1.5">
            <Hand className="h-4 w-4 text-warning" />
            <CardTitle className="text-xs font-bold">Other</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          <div className="grid grid-cols-3 gap-1.5">
            {otherActions.map((action) => (
              <Button
                key={action.type}
                onClick={() => handleAction(action.type)}
                disabled={isActionDisabled}
                variant={action.variant}
                size="sm"
                className="h-10 text-xs py-1.5 px-1"
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