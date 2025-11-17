'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Play, Pause, MoreVertical } from 'lucide-react'

interface GameScoreboardProps {
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  period: number
  clock: string
  status: 'scheduled' | 'active' | 'paused' | 'completed'
  onPlayPause: () => void
  onNextPeriod?: () => void
  onSettings?: () => void
}

export function GameScoreboard({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  period,
  clock,
  status,
  onPlayPause,
  onNextPeriod,
  onSettings,
}: GameScoreboardProps) {
  const isHomeLeading = homeScore > awayScore
  const isAwayLeading = awayScore > homeScore
  const isActive = status === 'active'

  return (
    <div className="flex flex-col gap-1 p-1 bg-gradient-to-b from-muted/40 to-background border-b shadow-sm">
      {/* Top Control Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            onClick={onPlayPause}
            size="sm"
            variant={isActive ? 'destructive' : 'default'}
            className="h-7 w-7 p-0 flex items-center justify-center font-semibold transition-all hover:shadow-md"
          >
            {isActive ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          <div className="flex items-baseline gap-1">
            <span className="text-[10px] font-semibold text-muted-foreground">Q{period}</span>
            <span className="text-xl font-black font-mono tabular-nums text-foreground">{clock}</span>
          </div>

          {isActive && (
            <Badge variant="success" className="animate-pulse-subtle gap-1.5 ml-1">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
              <span className="text-xs font-bold">LIVE</span>
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onNextPeriod && (
            <Button
              onClick={onNextPeriod}
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs font-semibold transition-all hover:shadow-sm"
            >
              Next Period
            </Button>
          )}

          {onSettings && (
            <Button
              onClick={onSettings}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 transition-all hover:shadow-sm"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Scores Section - Modern Card Design */}
      <div className="grid grid-cols-2 gap-1">
        {/* Home Team Card */}
        <Card
          className={cn(
            'p-2 transition-all duration-300 ease-out flex flex-col relative overflow-hidden',
            isHomeLeading && 'ring-2 ring-primary bg-primary/8 shadow-scoreboard scale-105'
          )}
        >
          {isHomeLeading && (
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-transparent"></div>
          )}
          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
            Your Team
          </div>
          <div className="flex items-end justify-between gap-1 mt-1">
            <span className="text-[10px] font-semibold text-foreground line-clamp-1 flex-1">
              {homeTeam}
            </span>
            <span
              className={cn(
                'text-3xl font-black font-mono tabular-nums transition-all duration-200',
                isHomeLeading && 'text-primary drop-shadow-lg'
              )}
            >
              {homeScore}
            </span>
          </div>
        </Card>

        {/* Away Team Card */}
        <Card
          className={cn(
            'p-2 transition-all duration-300 ease-out flex flex-col relative overflow-hidden',
            isAwayLeading && 'ring-2 ring-blue-500 bg-blue-500/8 shadow-scoreboard scale-105'
          )}
        >
          {isAwayLeading && (
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-transparent"></div>
          )}
          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
            Opponent
          </div>
          <div className="flex items-end justify-between gap-1 mt-1">
            <span className="text-[10px] font-semibold text-foreground line-clamp-1 flex-1">
              {awayTeam}
            </span>
            <span
              className={cn(
                'text-3xl font-black font-mono tabular-nums transition-all duration-200',
                isAwayLeading && 'text-blue-500 drop-shadow-lg'
              )}
            >
              {awayScore}
            </span>
          </div>
        </Card>
      </div>
    </div>
  )
}
