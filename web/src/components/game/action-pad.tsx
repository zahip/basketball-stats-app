'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Target, Shield, Zap } from 'lucide-react'

interface ActionPadProps {
  selectedPlayer: string | null
  selectedTeam: 'home' | 'away'
  onAction: (eventType: string, data?: any) => void
  disabled?: boolean
}

export function ActionPad({
  selectedPlayer,
  selectedTeam,
  onAction,
  disabled,
}: ActionPadProps) {
  const isDisabled = disabled || (selectedTeam === 'home' && !selectedPlayer)

  const handleAction = (actionType: string) => {
    if (isDisabled) return
    onAction(actionType, {
      playerId: selectedPlayer,
      timestamp: Date.now(),
    })
  }

  const scoringActions = [
    { type: 'SHOT_2_MADE', label: '2PT', sublabel: 'Made', variant: 'success' as const },
    { type: 'SHOT_2_MISS', label: '2PT', sublabel: 'Miss', variant: 'destructive' as const },
    { type: 'SHOT_3_MADE', label: '3PT', sublabel: 'Made', variant: 'success' as const },
    { type: 'SHOT_3_MISS', label: '3PT', sublabel: 'Miss', variant: 'destructive' as const },
    { type: 'FT_MADE', label: 'FT', sublabel: 'Made', variant: 'success' as const },
    { type: 'FT_MISS', label: 'FT', sublabel: 'Miss', variant: 'destructive' as const },
  ]

  const defenseActions = [
    { type: 'REB_O', label: 'Off Reb', variant: 'secondary' as const },
    { type: 'REB_D', label: 'Def Reb', variant: 'secondary' as const },
    { type: 'BLK', label: 'Block', variant: 'secondary' as const },
    { type: 'TOV', label: 'Turnover', variant: 'warning' as const },
  ]

  const playmakingActions = [
    { type: 'AST', label: 'Assist', variant: 'secondary' as const },
    { type: 'STL', label: 'Steal', variant: 'secondary' as const },
    { type: 'FOUL', label: 'Foul', variant: 'warning' as const },
    { type: 'SUB_IN', label: 'Sub In', variant: 'default' as const },
  ]

  const ActionButton = ({
    label,
    sublabel,
    variant,
    onClick
  }: {
    label: string
    sublabel?: string
    variant: string
    onClick: () => void
  }) => (
    <Button
      onClick={onClick}
      disabled={isDisabled}
      variant={variant as any}
      aria-label={`${label} ${sublabel || ''}`}
      title={`Record: ${label} ${sublabel || ''}`}
      className={cn(
        'h-10 flex-col gap-0.5 py-1 px-1 text-[10px] font-semibold hover:shadow-md transition-all duration-150 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isDisabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span className="font-bold leading-tight">{label}</span>
      {sublabel && (
        <span className="text-xs opacity-75 leading-tight">{sublabel}</span>
      )}
    </Button>
  )

  return (
    <div className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto p-1">
      {/* Player Selection Status */}
      {selectedTeam === 'home' && (
        <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 rounded text-[11px]">
          <Badge
            variant={selectedPlayer ? 'default' : 'outline'}
            className="text-[10px] h-5"
          >
            {selectedPlayer ? `#${selectedPlayer}` : 'No Player'}
          </Badge>
          {!selectedPlayer && (
            <span className="text-[10px] text-muted-foreground font-medium">
              Select player
            </span>
          )}
        </div>
      )}

      {selectedTeam === 'away' && (
        <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/10 rounded text-[11px]">
          <Badge variant="secondary" className="text-[10px] h-5">
            Opponent
          </Badge>
          <span className="text-[10px] text-muted-foreground font-medium">
            Team stats only
          </span>
        </div>
      )}

      {/* Three Sections Side by Side */}
      <div className="flex gap-1 min-h-0">
        {/* Scoring Section */}
        <Card className="border-l-4 border-l-green-500 shadow-sm flex flex-col min-h-0">
          <CardHeader className="pb-1 pt-1 flex-shrink-0 px-2 py-1">
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3 text-green-500" />
              <CardTitle className="text-[10px] font-bold">Score</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-1 pt-0 min-h-0 overflow-y-auto">
            <div className="grid grid-cols-3 gap-1 w-fit">
              {scoringActions.map((action) => (
                <ActionButton
                  key={action.type}
                  label={action.label}
                  sublabel={action.sublabel}
                  variant={action.variant}
                  onClick={() => handleAction(action.type)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Defense Section */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm flex flex-col min-h-0">
          <CardHeader className="pb-1 pt-1 flex-shrink-0 px-2 py-1">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-blue-500" />
              <CardTitle className="text-[10px] font-bold">Defense</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-1 pt-0 min-h-0 overflow-y-auto">
            <div className="grid grid-cols-2 gap-1 w-fit">
              {defenseActions.map((action) => (
                <ActionButton
                  key={action.type}
                  label={action.label}
                  variant={action.variant}
                  onClick={() => handleAction(action.type)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Playmaking Section */}
        <Card className="border-l-4 border-l-purple-500 shadow-sm flex flex-col min-h-0">
          <CardHeader className="pb-1 pt-1 flex-shrink-0 px-2 py-1">
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-purple-500" />
              <CardTitle className="text-[10px] font-bold">Play</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-1 pt-0 min-h-0 overflow-y-auto">
            <div className="grid grid-cols-2 gap-1 w-fit">
              {playmakingActions.map((action) => (
                <ActionButton
                  key={action.type}
                  label={action.label}
                  variant={action.variant}
                  onClick={() => handleAction(action.type)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
