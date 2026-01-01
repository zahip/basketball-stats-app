'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import type { Game } from '@/types/game'

interface GameHeaderProps {
  game: Game
  className?: string
}

export function GameHeader({ game, className }: GameHeaderProps) {
  return (
    <Card className={cn('p-6', className)}>
      <div className="text-center space-y-4">
        {/* Teams */}
        <div className="flex items-center justify-center gap-3">
          <span className="text-lg font-semibold">{game.homeTeam.name}</span>
          <span className="text-muted-foreground">vs</span>
          <span className="text-lg font-semibold">{game.awayTeam.name}</span>
        </div>

        {/* Score */}
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-home-team tabular-nums">
              {game.scoreHome}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Home</div>
          </div>
          <div className="text-3xl text-muted-foreground font-light">-</div>
          <div className="text-center">
            <div className="text-5xl font-bold text-away-team tabular-nums">
              {game.scoreAway}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Away</div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-center gap-2">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              game.status === 'LIVE' && 'bg-success animate-pulse',
              game.status === 'SCHEDULED' && 'bg-warning',
              game.status === 'FINISHED' && 'bg-muted-foreground'
            )}
          />
          <span className="text-sm font-medium text-muted-foreground">
            {game.status}
          </span>
        </div>
      </div>
    </Card>
  )
}
