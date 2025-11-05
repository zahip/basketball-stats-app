'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useRoleAccess } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { gamesApi } from '@/lib/api-client'

function formatClock(clockSec: number): string {
  const minutes = Math.floor(clockSec / 60)
  const seconds = clockSec % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export default function GamesPage() {
  const { canEdit, canManage } = useRoleAccess()

  const { data, isLoading, error } = useQuery({
    queryKey: ['games'],
    queryFn: () => gamesApi.getAll(),
  })

  const games = data?.games || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE': return 'bg-green-500'
      case 'FINAL': return 'bg-gray-500'
      case 'PLANNED': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'LIVE': return 'Live'
      case 'FINAL': return 'Final'
      case 'PLANNED': return 'Scheduled'
      default: return status
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center min-h-[50vh]">
          <p className="text-muted-foreground">Loading games...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center min-h-[50vh]">
          <p className="text-red-500">Error loading games: {error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Games</h1>
        {canManage && (
          <Button asChild>
            <Link href="/games/new">Create Game</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {games.map((game) => (
          <Card key={game.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-xl">
                    {game.team.name} vs {game.opponent}
                  </CardTitle>
                  <CardDescription>
                    {new Date(game.date).toLocaleDateString()}
                    {game.venue && ` • ${game.venue}`}
                  </CardDescription>
                </div>
                <Badge className={`${getStatusColor(game.status)} text-white`}>
                  {getStatusText(game.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-2xl font-mono">
                  {game.team.name} {game.ourScore} - {game.oppScore} {game.opponent}
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  {game.status === 'LIVE' && (
                    <>
                      <div>Q{game.period}</div>
                      <div>{formatClock(game.clockSec)}</div>
                    </>
                  )}
                  {game.status === 'FINAL' && <div>Final</div>}
                  {game.status === 'PLANNED' && <div>Not Started</div>}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/games/${game.id}`}>View Details</Link>
                </Button>
                {game.status === 'LIVE' && canEdit && (
                  <Button asChild size="sm">
                    <Link href={`/games/${game.id}/live`}>Live Track</Link>
                  </Button>
                )}
                {game.status === 'PLANNED' && canManage && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/games/${game.id}/start`}>Start Game</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {games.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground mb-4">No games scheduled</p>
              {canManage && (
                <Button asChild>
                  <Link href="/games/new">Create Your First Game</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}