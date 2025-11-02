'use client'

import Link from 'next/link'
import { useRoleAccess } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Mock data for now - will be replaced with real API calls
const mockGames = [
  {
    id: '1',
    homeTeam: 'Lakers',
    awayTeam: 'Warriors',
    homeScore: 98,
    awayScore: 102,
    status: 'completed',
    period: 4,
    clock: '00:00',
    date: '2024-01-15'
  },
  {
    id: '2', 
    homeTeam: 'Celtics',
    awayTeam: 'Heat',
    homeScore: 78,
    awayScore: 71,
    status: 'active',
    period: 3,
    clock: '08:42',
    date: '2024-01-16'
  },
  {
    id: '3',
    homeTeam: 'Bulls',
    awayTeam: 'Nets',
    homeScore: 0,
    awayScore: 0,
    status: 'scheduled',
    period: 0,
    clock: '12:00',
    date: '2024-01-17'
  }
]

export default function GamesPage() {
  const { canEdit, canManage } = useRoleAccess()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'completed': return 'bg-gray-500'
      case 'scheduled': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Live'
      case 'completed': return 'Final'
      case 'scheduled': return 'Scheduled'
      default: return status
    }
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
        {mockGames.map((game) => (
          <Card key={game.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-xl">
                    {game.awayTeam} @ {game.homeTeam}
                  </CardTitle>
                  <CardDescription>
                    {new Date(game.date).toLocaleDateString()}
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
                  {game.awayTeam} {game.awayScore} - {game.homeScore} {game.homeTeam}
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  {game.status === 'active' && (
                    <>
                      <div>Q{game.period}</div>
                      <div>{game.clock}</div>
                    </>
                  )}
                  {game.status === 'completed' && <div>Final</div>}
                  {game.status === 'scheduled' && <div>Not Started</div>}
                </div>
              </div>
              
              <div className="mt-4 flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/games/${game.id}`}>View Details</Link>
                </Button>
                {game.status === 'active' && canEdit && (
                  <Button asChild size="sm">
                    <Link href={`/games/${game.id}/live`}>📊 Live Track</Link>
                  </Button>
                )}
                {game.status === 'scheduled' && canManage && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/games/${game.id}/start`}>Start Game</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {mockGames.length === 0 && (
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