'use client'

/**
 * Modern Game Layout Examples
 *
 * This file demonstrates how to use the new design system components
 * to create beautiful, modern basketball game interfaces.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScoreDisplay } from '@/components/game/score-display'
import { StatCard, StatComparison, StatProgress } from '@/components/game/stat-card'
import { ActionGrid } from '@/components/game/action-grid'
import { Target, TrendingUp, Users, Zap, Trophy, Activity } from 'lucide-react'

// Example 1: Full Game Dashboard
export function ModernGameDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Live Game
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track stats in real-time
            </p>
          </div>
          <Button variant="gradient" size="lg">
            <Trophy className="h-5 w-5" />
            End Game
          </Button>
        </div>

        {/* Score Display */}
        <ScoreDisplay
          homeTeam="Lakers"
          awayTeam="Warriors"
          homeScore={54}
          awayScore={48}
          period={2}
          clock="5:42"
          status="active"
        />

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Field Goal %"
            icon={Target}
            value="45.5%"
            subtitle="18/40 made"
            variant="home"
          />
          <StatCard
            title="3-Point %"
            icon={TrendingUp}
            value="38.5%"
            subtitle="5/13 made"
            variant="home"
          />
          <StatCard
            title="Assists"
            icon={Users}
            value="12"
            subtitle="Team total"
            variant="success"
          />
          <StatCard
            title="Rebounds"
            icon={Activity}
            value="22"
            subtitle="15 DEF, 7 OFF"
            variant="default"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Actions */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Record Actions</h2>
            <ActionGrid
              selectedPlayer="23"
              onAction={(eventType, data) => {
                console.log('Action:', eventType, data)
              }}
              selectedTeam="home"
            />
          </div>

          {/* Right Column: Stats */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Team Comparison</h2>
            <Card>
              <CardHeader>
                <CardTitle>Quarter Stats</CardTitle>
                <CardDescription>Head-to-head comparison</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                <StatComparison label="Points" homeValue={54} awayValue={48} />
                <StatComparison label="FG%" homeValue="45.5%" awayValue="42.3%" />
                <StatComparison label="3PT%" homeValue="38.5%" awayValue="35.0%" />
                <StatComparison label="Rebounds" homeValue={22} awayValue={18} />
                <StatComparison label="Assists" homeValue={12} awayValue={9} />
                <StatComparison label="Turnovers" homeValue={5} awayValue={8} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Example 2: Compact Game Summary Card
export function CompactGameCard() {
  return (
    <Card className="max-w-md">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Lakers vs Warriors</h3>
              <p className="text-sm text-muted-foreground">November 13, 2025</p>
            </div>
            <Badge variant="success" size="lg">Live</Badge>
          </div>

          {/* Score */}
          <div className="flex items-center justify-center gap-6 py-4">
            <div className="text-center">
              <Badge variant="home-team" className="mb-2">Lakers</Badge>
              <div className="text-4xl font-bold text-home-team">54</div>
            </div>
            <div className="text-2xl font-bold text-muted-foreground">-</div>
            <div className="text-center">
              <Badge variant="away-team" className="mb-2">Warriors</Badge>
              <div className="text-4xl font-bold text-away-team">48</div>
            </div>
          </div>

          {/* Progress */}
          <StatProgress
            label="Game Progress"
            current={2}
            max={4}
            variant="home"
          />

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              View Details
            </Button>
            <Button variant="gradient" className="flex-1">
              <Zap className="h-4 w-4" />
              Continue
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Example 3: Box Score Preview
export function BoxScorePreview() {
  const players = [
    { jersey: 23, name: 'LeBron James', pts: 18, fgm: 7, fga: 15, reb: 6, ast: 8 },
    { jersey: 3, name: 'Anthony Davis', pts: 16, fgm: 6, fga: 12, reb: 9, ast: 2 },
    { jersey: 1, name: 'D\'Angelo Russell', pts: 12, fgm: 4, fga: 10, reb: 2, ast: 5 },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Box Score</CardTitle>
            <CardDescription>Player statistics</CardDescription>
          </div>
          <Badge variant="home-team">Your Team</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-semibold">Player</th>
                <th className="px-3 py-3 text-center font-semibold">PTS</th>
                <th className="px-3 py-3 text-center font-semibold">FG</th>
                <th className="px-3 py-3 text-center font-semibold">REB</th>
                <th className="px-3 py-3 text-center font-semibold">AST</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr
                  key={player.jersey}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" size="sm">#{player.jersey}</Badge>
                      <span className="font-medium">{player.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-home-team">
                    {player.pts}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {player.fgm}/{player.fga}
                  </td>
                  <td className="px-3 py-3 text-center">{player.reb}</td>
                  <td className="px-3 py-3 text-center">{player.ast}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/30 border-t-2 border-border">
              <tr>
                <td className="px-4 py-3 font-bold">Team Total</td>
                <td className="px-3 py-3 text-center font-bold text-home-team">46</td>
                <td className="px-3 py-3 text-center font-semibold">17/37</td>
                <td className="px-3 py-3 text-center font-semibold">17</td>
                <td className="px-3 py-3 text-center font-semibold">15</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// Example 4: Mobile-Optimized Quick Actions
export function MobileQuickActions() {
  return (
    <div className="space-y-3 max-w-md">
      <Card className="bg-gradient-to-br from-home-team/10 to-home-team/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="home-team" size="lg">Player #23</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="success" size="touch" className="h-20 flex-col gap-1">
              <Target className="h-6 w-6" />
              <span className="text-xs">2PT Made</span>
            </Button>
            <Button variant="success" size="touch" className="h-20 flex-col gap-1">
              <Zap className="h-6 w-6" />
              <span className="text-xs">3PT Made</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Example 5: Game Timeline Event
export function TimelineEvent() {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <Badge variant="success" size="sm">3PT</Badge>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">#23 LeBron James</p>
        <p className="text-xs text-muted-foreground">Assisted by #1 D'Angelo Russell</p>
        <p className="text-xs text-muted-foreground mt-0.5">5:42 Q2</p>
      </div>
      <div className="flex flex-col items-end">
        <div className="text-lg font-bold text-success">+3</div>
        <div className="text-xs text-muted-foreground">54-48</div>
      </div>
    </div>
  )
}
