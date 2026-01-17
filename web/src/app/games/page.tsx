'use client'

import { useGames } from '@/lib/hooks/use-games'
import { GameCard } from '@/components/dashboard/game-card'
import { CreateGameDialog } from '@/components/dashboard/create-game-dialog'
import { Button } from '@/components/ui/button'

export default function GamesPage() {
  const { data, isLoading, error } = useGames()

  const games = data?.games ?? []

  return (
    <div className="container mx-auto p-4 max-w-6xl space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Games</h1>
        <CreateGameDialog>
          <Button>New Game</Button>
        </CreateGameDialog>
      </header>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          Loading games...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8 text-destructive">
          Failed to load games. Please try again.
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && games.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No games yet. Create your first game to get started!
        </div>
      )}

      {/* Games List */}
      {games.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard
              key={game.id}
              id={game.id}
              homeTeam={game.homeTeam}
              awayTeam={game.awayTeam}
              scoreHome={game.scoreHome}
              scoreAway={game.scoreAway}
              status={game.status}
              createdAt={game.createdAt}
            />
          ))}
        </div>
      )}
    </div>
  )
}
