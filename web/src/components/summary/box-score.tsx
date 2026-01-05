'use client'

import { Card, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { PlayerStats } from '@/lib/stats-calculator'
import { getTopPerformers } from '@/lib/stats-calculator'

interface BoxScoreProps {
  homeStats: PlayerStats[]
  awayStats: PlayerStats[]
}

export function BoxScore({ homeStats, awayStats }: BoxScoreProps) {
  const homeTop3 = getTopPerformers(homeStats, 3)
  const awayTop3 = getTopPerformers(awayStats, 3)

  return (
    <Card className="p-6">
      <CardTitle className="mb-6">Box Score Highlights</CardTitle>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Home Team Stats */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-home-team" />
            <h3 className="font-semibold">Top Performers</h3>
          </div>

          {homeTop3.length > 0 ? (
            homeTop3.map((stats, idx) => (
              <PlayerStatCard key={stats.player.id} stats={stats} rank={idx + 1} isHome />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No stats available</p>
          )}
        </div>

        {/* Away Team Stats */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-away-team" />
            <h3 className="font-semibold">Top Performers</h3>
          </div>

          {awayTop3.length > 0 ? (
            awayTop3.map((stats, idx) => (
              <PlayerStatCard key={stats.player.id} stats={stats} rank={idx + 1} isHome={false} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No stats available</p>
          )}
        </div>
      </div>
    </Card>
  )
}

function PlayerStatCard({
  stats,
  rank,
  isHome,
}: {
  stats: PlayerStats
  rank: number
  isHome: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg border-2',
        'transition-all duration-200 hover:shadow-md',
        isHome ? 'border-home-team/20 bg-home-team/5' : 'border-away-team/20 bg-away-team/5'
      )}
    >
      {/* Rank Badge */}
      <div
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm',
          rank === 1 ? 'bg-success text-white' : 'bg-muted text-muted-foreground'
        )}
      >
        {rank}
      </div>

      {/* Jersey Number */}
      <div
        className={cn(
          'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg font-bold text-base md:text-lg',
          isHome ? 'bg-home-team text-white' : 'bg-away-team text-white'
        )}
      >
        {stats.player.jerseyNumber}
      </div>

      {/* Player Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate text-sm md:text-base">{stats.player.name}</p>
        <p className="text-xs md:text-sm text-muted-foreground">{stats.player.position}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <StatItem label="PTS" value={stats.points} highlight />
        <StatItem label="REB" value={stats.rebounds} />
        <StatItem label="AST" value={stats.assists} />
      </div>
    </div>
  )
}

function StatItem({
  label,
  value,
  highlight,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div>
      <div
        className={cn(
          'text-xs font-medium',
          highlight ? 'text-success' : 'text-muted-foreground'
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          'text-base md:text-lg font-bold tabular-nums',
          highlight ? 'text-success' : 'text-foreground'
        )}
      >
        {value}
      </div>
    </div>
  )
}
