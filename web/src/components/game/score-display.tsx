'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ScoreDisplayProps {
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  period?: number
  clock?: string
  status?: 'scheduled' | 'active' | 'paused' | 'completed'
  className?: string
}

export function ScoreDisplay({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  period = 1,
  clock = '10:00',
  status = 'active',
  className,
}: ScoreDisplayProps) {
  const isHomeLeading = homeScore > awayScore
  const isAwayLeading = awayScore > homeScore
  const scoreDiff = Math.abs(homeScore - awayScore)

  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return <Badge variant="success" size="lg">Live</Badge>
      case 'paused':
        return <Badge variant="warning" size="lg">Paused</Badge>
      case 'completed':
        return <Badge variant="secondary" size="lg">Final</Badge>
      default:
        return <Badge variant="outline" size="lg">Scheduled</Badge>
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Game Status Header */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" size="lg" className="gap-2">
                <span className="text-xs font-medium">Q{period}</span>
                <span className="text-sm font-bold">{clock}</span>
              </Badge>
              {getStatusBadge()}
            </div>
            {status === 'completed' && (
              <div className="text-sm font-medium text-muted-foreground">
                {homeTeam} vs {awayTeam}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Score Display */}
      <div className="grid grid-cols-2 gap-3">
        {/* Home Team */}
        <Card
          className={cn(
            'bg-gradient-to-br transition-all duration-300',
            isHomeLeading
              ? 'from-home-team/10 to-home-team/5 border-l-4 border-l-home-team shadow-lg'
              : 'from-muted/30 to-background'
          )}
        >
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="home-team" size="lg">
                  Your Team
                </Badge>
                {isHomeLeading && (
                  <Badge variant="success" size="sm">
                    +{scoreDiff}
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {homeTeam}
                </p>
                <p className="text-5xl font-bold text-home-team tracking-tight">
                  {homeScore}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Away Team */}
        <Card
          className={cn(
            'bg-gradient-to-br transition-all duration-300',
            isAwayLeading
              ? 'from-away-team/10 to-away-team/5 border-l-4 border-l-away-team shadow-lg'
              : 'from-muted/30 to-background'
          )}
        >
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="away-team" size="lg">
                  Opponent
                </Badge>
                {isAwayLeading && (
                  <Badge variant="success" size="sm">
                    +{scoreDiff}
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {awayTeam}
                </p>
                <p className="text-5xl font-bold text-away-team tracking-tight">
                  {awayScore}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Comparison Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>{homeTeam}</span>
              <span>{awayTeam}</span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-home-team to-home-team/80 transition-all duration-500"
                style={{
                  width: homeScore + awayScore > 0
                    ? `${(homeScore / (homeScore + awayScore)) * 100}%`
                    : '50%'
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-home-team">{homeScore}</span>
              <span className="text-away-team">{awayScore}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
