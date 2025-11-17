'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CompactScoreHeaderProps {
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  period: number
  clock: string
  status: 'scheduled' | 'active' | 'paused' | 'completed'
}

export function CompactScoreHeader({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  period,
  clock,
  status,
}: CompactScoreHeaderProps) {
  const isHomeLeading = homeScore > awayScore
  const isAwayLeading = awayScore > homeScore

  return (
    <div className="flex items-center justify-between gap-4 py-3 px-4">
      {/* Score Display - Single Line */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className={cn(
          "text-lg font-bold transition-all truncate",
          isHomeLeading && "text-primary scale-105"
        )}>
          {homeTeam}
        </div>
        <div className="flex items-baseline gap-3 flex-shrink-0">
          <span className={cn(
            "text-4xl font-black tabular-nums",
            isHomeLeading && "text-primary"
          )}>
            {homeScore}
          </span>
          <span className="text-xl font-medium text-muted-foreground">-</span>
          <span className={cn(
            "text-4xl font-black tabular-nums",
            isAwayLeading && "text-blue-500"
          )}>
            {awayScore}
          </span>
        </div>
        <div className={cn(
          "text-lg font-bold transition-all truncate",
          isAwayLeading && "text-blue-500 scale-105"
        )}>
          {awayTeam}
        </div>
      </div>

      {/* Game Info */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant="secondary" className="text-sm font-mono font-semibold">
          Q{period} {clock}
        </Badge>
        <Badge
          variant={status === 'active' ? 'success' : 'secondary'}
          className={cn(
            "text-sm font-semibold",
            status === 'active' && "animate-pulse"
          )}
        >
          {status === 'active' ? '● LIVE' : status.toUpperCase()}
        </Badge>
      </div>
    </div>
  )
}
