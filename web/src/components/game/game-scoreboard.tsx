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
    <div className="bg-gradient-to-br from-primary/5 via-background to-background border-b border-primary/10 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Top Control Row */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={onPlayPause}
              size="sm"
              variant={isActive ? 'destructive' : 'default'}
              className="h-10 w-10 p-0 flex items-center justify-center font-bold transition-all hover:shadow-lg text-lg"
            >
              {isActive ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>

            <div className="flex items-baseline gap-2 bg-white/50 backdrop-blur px-4 py-2 rounded-lg border border-primary/20">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Q{period}</span>
              <span className="text-3xl font-black font-mono tabular-nums text-foreground">{clock}</span>
            </div>

            {isActive && (
              <Badge variant="default" className="animate-pulse gap-2 bg-green-500 hover:bg-green-600">
                <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse"></span>
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
                className="h-10 px-4 text-sm font-semibold transition-all hover:shadow-lg border-primary/30"
              >
                Next Period
              </Button>
            )}

            {onSettings && (
              <Button
                onClick={onSettings}
                size="sm"
                variant="ghost"
                className="h-10 w-10 p-0 transition-all hover:shadow-lg hover:bg-muted"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Scores Section - Modern Card Design */}
        <div className="grid grid-cols-2 gap-4">
          {/* Home Team Card */}
          <Card
            className={cn(
              'p-6 transition-all duration-300 ease-out flex flex-col relative overflow-hidden bg-gradient-to-br shadow-lg hover:shadow-xl',
              isHomeLeading
                ? 'from-primary/20 via-primary/10 to-primary/5 border-t-4 border-t-primary scale-105'
                : 'from-white/80 to-muted/20 border-t-4 border-t-muted/40'
            )}
          >
            {isHomeLeading && (
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent"></div>
            )}
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
              Your Team
            </div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <span className="text-xl font-bold text-foreground line-clamp-1 flex-1">
                  {homeTeam}
                </span>
              </div>
              <span
                className={cn(
                  'text-6xl font-black font-mono tabular-nums transition-all duration-200',
                  isHomeLeading ? 'text-primary drop-shadow-lg scale-110' : 'text-muted-foreground'
                )}
              >
                {homeScore}
              </span>
            </div>
          </Card>

          {/* Away Team Card */}
          <Card
            className={cn(
              'p-6 transition-all duration-300 ease-out flex flex-col relative overflow-hidden bg-gradient-to-br shadow-lg hover:shadow-xl',
              isAwayLeading
                ? 'from-blue-500/20 via-blue-500/10 to-blue-500/5 border-t-4 border-t-blue-500 scale-105'
                : 'from-white/80 to-muted/20 border-t-4 border-t-muted/40'
            )}
          >
            {isAwayLeading && (
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-blue-500/50 to-transparent"></div>
            )}
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
              Opponent
            </div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <span className="text-xl font-bold text-foreground line-clamp-1 flex-1">
                  {awayTeam}
                </span>
              </div>
              <span
                className={cn(
                  'text-6xl font-black font-mono tabular-nums transition-all duration-200',
                  isAwayLeading ? 'text-blue-500 drop-shadow-lg scale-110' : 'text-muted-foreground'
                )}
              >
                {awayScore}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
