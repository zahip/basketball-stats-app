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
      className="h-9 flex-col gap-0.5 py-1 px-1 text-[10px] font-semibold hover:shadow-sm transition-shadow"
    >
      <span className="font-bold leading-none">{action.label}</span>
      <span className="text-[8px] opacity-80 leading-none">{action.sublabel}</span>
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
        className="h-8 gap-1 px-1.5 py-1 text-[10px] font-semibold hover:shadow-sm transition-shadow"
      >
        {Icon && <Icon className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">{action.label}</span>
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Selection Status - Compact */}
      <Card className="bg-gradient-to-br from-muted/40 to-muted/20 border-none shadow-sm flex-shrink-0">
        <CardContent className="p-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge
                variant={selectedTeam === 'home' ? 'home-team' : 'away-team'}
                size="sm"
                className="text-[10px]"
              >
                {selectedTeam === 'home' ? 'Your Team' : 'Opponent'}
              </Badge>
              {selectedTeam === 'home' && selectedPlayer && (
                <Badge variant="outline" size="sm" className="text-[9px] font-semibold">
                  #{selectedPlayer}
                </Badge>
              )}
            </div>
            {isActionDisabled && selectedTeam === 'home' && (
              <Badge variant="warning" size="sm" className="text-[8px] font-semibold">
                Select Player
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* All Actions - Side by Side */}
      <div className="flex-1 grid grid-cols-3 gap-2 min-h-0">
        {/* Shooting Actions Column */}
        <Card className="border-l-4 border-l-success shadow-sm flex flex-col min-h-0">
          <CardHeader className="pb-1.5 pt-2 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-success" />
              <CardTitle className="text-xs font-bold">Shots</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-2 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-1.5">
              {shotActions.map((action) => (
                <ShotButton key={action.type} action={action} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Play Actions Column */}
        <Card className="border-l-4 border-l-primary shadow-sm flex flex-col min-h-0">
          <CardHeader className="pb-1.5 pt-2 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <CardTitle className="text-xs font-bold">Plays</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-2 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-1.5">
              {playActions.map((action) => (
                <PlayButton key={action.type} action={action} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Other Actions Column */}
        <Card className="border-l-4 border-l-warning shadow-sm flex flex-col min-h-0">
          <CardHeader className="pb-1.5 pt-2 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <Hand className="h-3.5 w-3.5 text-warning" />
              <CardTitle className="text-xs font-bold">Other</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-2 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-1.5">
              {otherActions.map((action) => (
                <Button
                  key={action.type}
                  onClick={() => handleAction(action.type)}
                  disabled={isActionDisabled}
                  variant={action.variant}
                  size="sm"
                  className="h-8 text-[10px] py-1 px-1 font-semibold hover:shadow-sm transition-shadow w-full"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}