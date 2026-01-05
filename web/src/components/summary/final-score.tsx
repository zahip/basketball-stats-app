'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Game } from '@/types/game'

interface FinalScoreProps {
  game: Game
}

export function FinalScore({ game }: FinalScoreProps) {
  const homeWon = game.scoreHome > game.scoreAway
  const isTie = game.scoreHome === game.scoreAway

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-background p-8">
        <div className="flex items-center justify-center gap-8 md:gap-12">
          {/* Home Team */}
          <div className="text-center space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-home-team">
              {game.homeTeam.name}
            </h2>
            <div
              className={cn(
                'text-6xl md:text-7xl font-black tabular-nums',
                homeWon ? 'text-success' : isTie ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {game.scoreHome}
            </div>
            {homeWon && !isTie && (
              <Badge variant="default" className="bg-success text-white">
                WINNER
              </Badge>
            )}
          </div>

          {/* Separator */}
          <div className="text-4xl md:text-5xl font-light text-muted-foreground">-</div>

          {/* Away Team */}
          <div className="text-center space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-away-team">
              {game.awayTeam.name}
            </h2>
            <div
              className={cn(
                'text-6xl md:text-7xl font-black tabular-nums',
                !homeWon && !isTie ? 'text-success' : isTie ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {game.scoreAway}
            </div>
            {!homeWon && !isTie && (
              <Badge variant="default" className="bg-success text-white">
                WINNER
              </Badge>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center mt-6">
          <Badge
            variant={game.status === 'FINISHED' ? 'secondary' : 'default'}
            className={cn(
              game.status === 'LIVE' && 'bg-success',
              game.status === 'SCHEDULED' && 'bg-warning'
            )}
          >
            {game.status}
          </Badge>
        </div>
      </div>
    </Card>
  )
}
