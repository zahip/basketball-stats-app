'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { GameStatus } from '@/types/game'

interface GameCardProps {
  id: string
  homeTeam: { name: string; logoUrl: string | null }
  awayTeam: { name: string; logoUrl: string | null }
  scoreHome: number
  scoreAway: number
  status: GameStatus
  createdAt: string
}

function StatusBadge({ status }: { status: GameStatus }) {
  if (status === 'LIVE') {
    return (
      <Badge variant="destructive" className="gap-1">
        <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
        LIVE
      </Badge>
    )
  }
  return <Badge variant="secondary">{status}</Badge>
}

export function GameCard({
  id,
  homeTeam,
  awayTeam,
  scoreHome,
  scoreAway,
  status,
  createdAt,
}: GameCardProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <StatusBadge status={status} />
        <span className="text-sm text-muted-foreground">{formattedDate}</span>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Teams and Score */}
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-1">
            <p className="font-semibold text-home-team">{homeTeam.name}</p>
            <p className="font-semibold text-away-team">{awayTeam.name}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-2xl font-bold tabular-nums">{scoreHome}</p>
            <p className="text-2xl font-bold tabular-nums">{scoreAway}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {status === 'FINISHED' ? (
            <Button asChild className="w-full">
              <Link href={`/summary/${id}`}>View Summary</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="outline" className="flex-1">
                <Link href={`/scout/${id}`}>Scout</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href={`/live/${id}`}>View Live</Link>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
