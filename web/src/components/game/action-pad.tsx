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
        'h-16 flex-col gap-1 py-2 px-2 text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isDisabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span className="font-bold leading-tight">{label}</span>
      {sublabel && (
        <span className="text-[11px] opacity-85 leading-tight">{sublabel}</span>
      )}
    </Button>
  )

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto bg-gradient-to-b from-muted/20 to-background p-4">
      {/* Player Selection Status */}
      <div className="max-w-6xl mx-auto w-full">
        {selectedTeam === 'home' && (
          <div className="flex items-center gap-3 px-4 py-3 bg-primary/15 rounded-lg border border-primary/30 backdrop-blur-sm">
            <Badge
              variant="default"
              className="text-xs h-6 px-3"
            >
              {selectedPlayer ? `#${selectedPlayer}` : 'Select Player'}
            </Badge>
            {!selectedPlayer && (
              <span className="text-sm text-muted-foreground font-medium">
                🎯 Tap a player to record their actions
              </span>
            )}
            {selectedPlayer && (
              <span className="text-sm font-semibold text-primary">
                ✓ Ready to record
              </span>
            )}
          </div>
        )}

        {selectedTeam === 'away' && (
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-500/15 rounded-lg border border-blue-500/30 backdrop-blur-sm">
            <Badge variant="secondary" className="text-xs h-6 px-3">
              📊 Opponent Team
            </Badge>
            <span className="text-sm text-muted-foreground font-medium">
              Recording team-level statistics only
            </span>
          </div>
        )}
      </div>

      {/* Three Sections Side by Side */}
      <div className="flex gap-4 min-h-0 max-w-6xl mx-auto w-full justify-center">
        {/* Scoring Section */}
        <Card className="border-t-4 border-t-green-500 shadow-lg hover:shadow-xl transition-shadow flex flex-col min-h-0 flex-1 bg-white/80 backdrop-blur">
          <CardHeader className="pb-2 pt-3 flex-shrink-0 px-4 py-3 border-b border-green-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <CardTitle className="text-sm font-bold text-green-900">Scoring</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 min-h-0 overflow-y-auto flex-1">
            <div className="grid grid-cols-3 gap-3">
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
        <Card className="border-t-4 border-t-blue-500 shadow-lg hover:shadow-xl transition-shadow flex flex-col min-h-0 flex-1 bg-white/80 backdrop-blur">
          <CardHeader className="pb-2 pt-3 flex-shrink-0 px-4 py-3 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-sm font-bold text-blue-900">Defense & Boards</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 min-h-0 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-3">
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
        <Card className="border-t-4 border-t-purple-500 shadow-lg hover:shadow-xl transition-shadow flex flex-col min-h-0 flex-1 bg-white/80 backdrop-blur">
          <CardHeader className="pb-2 pt-3 flex-shrink-0 px-4 py-3 border-b border-purple-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <CardTitle className="text-sm font-bold text-purple-900">Playmaking</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 min-h-0 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-3">
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
