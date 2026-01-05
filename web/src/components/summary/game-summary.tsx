'use client'

import { useMemo } from 'react'
import { useGame } from '@/lib/hooks/use-game'
import { useFinishGame } from '@/lib/hooks/use-finish-game'
import { calculateGameStats } from '@/lib/stats-calculator'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FinalScore } from './final-score'
import { AIArticle } from './ai-article'
import { BoxScore } from './box-score'
import { ShareButton } from './share-button'
import { Loader2 } from 'lucide-react'

interface GameSummaryProps {
  gameId: string
}

export function GameSummary({ gameId }: GameSummaryProps) {
  const { data: game, isLoading, error } = useGame(gameId)
  const finishGame = useFinishGame()

  // Calculate stats with useMemo
  const stats = useMemo(() => {
    if (!game) return null
    return calculateGameStats(game.actions, game.homeTeamId, game.awayTeamId)
  }, [game])

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl space-y-6">
        <Card className="p-8">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading game summary...</p>
          </div>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-4xl space-y-6">
        <Card className="p-8 border-destructive">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-destructive mb-2">Error</h2>
            <p className="text-muted-foreground">
              {error.message || 'Failed to load game summary'}
            </p>
          </div>
        </Card>
      </div>
    )
  }

  // No data state
  if (!game) {
    return (
      <div className="container mx-auto p-4 max-w-4xl space-y-6">
        <Card className="p-8">
          <p className="text-center text-muted-foreground">Game not found</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      {/* Final Score Banner */}
      <FinalScore game={game} />

      {/* Show Finish button if not FINISHED */}
      {game.status !== 'FINISHED' && (
        <Card className="p-6">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold mb-1">Finish Game</h3>
              <p className="text-sm text-muted-foreground">
                Generate AI summary and finalize the game
              </p>
            </div>
            <Button
              onClick={() => finishGame.mutate(gameId)}
              disabled={finishGame.isPending}
              size="lg"
              className="w-full md:w-auto"
            >
              {finishGame.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finishing Game...
                </>
              ) : (
                'Finish Game & Generate Summary'
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Loading state during summary generation */}
      {finishGame.isPending && (
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <p className="font-semibold">Generating AI Summary...</p>
              <p className="text-sm text-muted-foreground">This may take 5-15 seconds</p>
            </div>
          </div>
        </Card>
      )}

      {/* Show article if summary exists */}
      {game.summary && <AIArticle summary={game.summary} />}

      {/* Show error if finished but no summary */}
      {game.status === 'FINISHED' && !game.summary && !finishGame.isPending && (
        <Card className="p-6 border-warning">
          <div className="text-center space-y-3">
            <p className="text-warning font-medium">
              Summary generation failed or is not available
            </p>
            <Button onClick={() => finishGame.mutate(gameId)} variant="outline">
              Try Again
            </Button>
          </div>
        </Card>
      )}

      {/* Box score always shown if actions exist */}
      {stats && (stats.homeStats.length > 0 || stats.awayStats.length > 0) && (
        <BoxScore homeStats={stats.homeStats} awayStats={stats.awayStats} />
      )}

      {/* Empty state if no actions */}
      {game.actions.length === 0 && (
        <Card className="p-8">
          <p className="text-center text-muted-foreground">
            No game actions recorded yet. Start recording actions to see player statistics.
          </p>
        </Card>
      )}

      {/* Share button only if FINISHED */}
      {game.status === 'FINISHED' && game.summary && (
        <ShareButton game={game} stats={stats} />
      )}
    </div>
  )
}
