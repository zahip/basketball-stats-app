'use client'

import * as React from 'react'
import type { Game } from '@/types/game'
import { calculatePlayerBoxScore, formatMinutes } from '@/lib/stats/calculate-box-score'
import { calculateLiveMinutes } from '@/lib/stats/calculate-live-minutes'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface PlayerBoxScoreProps {
  game: Game
  className?: string
}

/**
 * PlayerBoxScore - Individual player statistics table with tabs for home/away teams
 * Shows Points, Rebounds, Assists, and Fouls for each player
 * Highlights "hot" players with >10 points
 * Minutes update every 1 second for on-court players when clock is running
 */
export function PlayerBoxScore({ game, className }: PlayerBoxScoreProps) {
  const [liveMinutes, setLiveMinutes] = React.useState<Map<string, number>>(new Map())

  const homeBoxScore = calculatePlayerBoxScore(game.actions, game.homeTeamId, game.playerStatuses)
  const awayBoxScore = calculatePlayerBoxScore(game.actions, game.awayTeamId, game.playerStatuses)

  // Update live minutes every 1 second when clock is running
  React.useEffect(() => {
    const latestSession = game.clockSessions[game.clockSessions.length - 1]
    const isRunning = latestSession?.status === 'RUNNING'

    if (!isRunning) {
      setLiveMinutes(new Map()) // Clear live updates when paused
      return
    }

    // Update immediately
    const updateLiveMinutes = () => {
      const newLiveMinutes = new Map<string, number>()

      for (const status of game.playerStatuses) {
        if (status.isOnCourt) {
          const live = calculateLiveMinutes(game.clockSessions, status, new Date())
          newLiveMinutes.set(status.playerId, live)
        }
      }

      setLiveMinutes(newLiveMinutes)
    }

    updateLiveMinutes()

    // Update every 1 second
    const interval = setInterval(updateLiveMinutes, 1000)

    return () => clearInterval(interval)
  }, [game.clockSessions, game.playerStatuses])

  // Helper to get display minutes (live if available, otherwise cached)
  const getDisplayMinutes = (playerId: string, cachedMinutes: number) => {
    return liveMinutes.get(playerId) ?? cachedMinutes
  }

  return (
    <div
      className={cn(
        'bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/60">
        <h3 className="text-sm md:text-base font-bold text-slate-50 uppercase tracking-wider">
          Box Score
        </h3>
      </div>

      {/* Tabs for Home/Away teams */}
      <Tabs defaultValue="home" className="w-full">
        <div className="px-4 pt-3">
          <TabsList className="bg-slate-800/50 border border-slate-700 w-full md:w-auto">
            <TabsTrigger
              value="home"
              className="data-[state=active]:bg-slate-900 data-[state=active]:text-violet-400"
            >
              {game.homeTeam.name}
            </TabsTrigger>
            <TabsTrigger
              value="away"
              className="data-[state=active]:bg-slate-900 data-[state=active]:text-sky-400"
            >
              {game.awayTeam.name}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Home Team Tab */}
        <TabsContent value="home" className="mt-0 p-4">
          {homeBoxScore.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-500">No stats recorded yet</p>
            </div>
          ) : (
            <ScrollArea className="w-full">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-xs uppercase text-slate-400 font-semibold px-3 py-2.5 text-left">
                      Player
                    </th>
                    <th className="text-xs uppercase text-slate-400 font-semibold px-3 py-2.5 text-center">
                      MIN
                    </th>
                    <th className="text-xs uppercase text-slate-400 font-semibold px-3 py-2.5 text-center">
                      PTS
                    </th>
                    <th className="text-xs uppercase text-slate-400 font-semibold px-3 py-2.5 text-center">
                      REB
                    </th>
                    <th className="text-xs uppercase text-slate-400 font-semibold px-3 py-2.5 text-center">
                      AST
                    </th>
                    <th className="text-xs uppercase text-slate-400 font-semibold px-3 py-2.5 text-center">
                      FLS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {homeBoxScore.map((playerStats) => (
                    <tr
                      key={playerStats.playerId}
                      className={cn(
                        'border-b border-slate-800 hover:bg-slate-800/30 transition-colors',
                        playerStats.points > 10 &&
                          'bg-violet-500/10 border-l-4 border-l-violet-500'
                      )}
                    >
                      <td className="px-3 py-2.5 text-sm md:px-4 md:py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-200">
                            {playerStats.player.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            #{playerStats.player.jerseyNumber}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-sm md:px-4 md:py-3 text-center font-mono text-slate-300">
                        {formatMinutes(getDisplayMinutes(playerStats.playerId, playerStats.minutes))}
                      </td>
                      <td className="px-3 py-2.5 text-sm md:px-4 md:py-3 text-center font-semibold text-violet-400">
                        {playerStats.points}
                      </td>
                      <td className="px-3 py-2.5 text-sm md:px-4 md:py-3 text-center text-slate-300">
                        {playerStats.rebounds}
                      </td>
                      <td className="px-3 py-2.5 text-sm md:px-4 md:py-3 text-center text-slate-300">
                        {playerStats.assists}
                      </td>
                      <td className="px-3 py-2.5 text-sm md:px-4 md:py-3 text-center text-slate-300">
                        {playerStats.fouls}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Away Team Tab */}
        <TabsContent value="away" className="mt-0 p-4">
          {awayBoxScore.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-500">No stats recorded yet</p>
            </div>
          ) : (
            <ScrollArea className="w-full">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-xs uppercase text-slate-400 font-semibold px-3 py-2.5 text-left">
                      Player
                    </th>
                    <th className="text-xs uppercase text-slate-400 font-semibold px-3 py-2.5 text-center">
                      MIN
                    </th>
                    <th className="text-xs uppercase text-slate-400 font-semibold px-3 py-2.5 text-center">
                      PTS
                    </th>
                    <th className="text-xs uppercase text-slate-400 font-semibold px-3 py-2.5 text-center">
                      REB
                    </th>
                    <th className="text-xs uppercase text-slate-400 font-semibold px-3 py-2.5 text-center">
                      AST
                    </th>
                    <th className="text-xs uppercase text-slate-400 font-semibold px-3 py-2.5 text-center">
                      FLS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {awayBoxScore.map((playerStats) => (
                    <tr
                      key={playerStats.playerId}
                      className={cn(
                        'border-b border-slate-800 hover:bg-slate-800/30 transition-colors',
                        playerStats.points > 10 &&
                          'bg-sky-500/10 border-l-4 border-l-sky-500'
                      )}
                    >
                      <td className="px-3 py-2.5 text-sm md:px-4 md:py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-200">
                            {playerStats.player.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            #{playerStats.player.jerseyNumber}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-sm md:px-4 md:py-3 text-center font-mono text-slate-300">
                        {formatMinutes(getDisplayMinutes(playerStats.playerId, playerStats.minutes))}
                      </td>
                      <td className="px-3 py-2.5 text-sm md:px-4 md:py-3 text-center font-semibold text-sky-400">
                        {playerStats.points}
                      </td>
                      <td className="px-3 py-2.5 text-sm md:px-4 md:py-3 text-center text-slate-300">
                        {playerStats.rebounds}
                      </td>
                      <td className="px-3 py-2.5 text-sm md:px-4 md:py-3 text-center text-slate-300">
                        {playerStats.assists}
                      </td>
                      <td className="px-3 py-2.5 text-sm md:px-4 md:py-3 text-center text-slate-300">
                        {playerStats.fouls}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
