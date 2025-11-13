'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PlayerStats {
  playerId: string;
  playerNumber: number;
  playerName: string;
  points: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  plusMinus: number;
  minutesPlayed: number;
}

interface TeamStats {
  teamSide: string;
  teamName: string | null;
  points: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  fgPct: number | null;
  fg3Pct: number | null;
  ftPct: number | null;
  efgPct: number | null;
  tsPct: number | null;
  astToRatio: number | null;
}

interface BoxScoreData {
  gameId: string;
  teamStats: TeamStats[];
  playerStats: PlayerStats[];
}

interface BoxScoreProps {
  gameId: string;
}

export function BoxScore({ gameId }: BoxScoreProps) {
  const [highlightedCells, setHighlightedCells] = useState<Set<string>>(new Set());

  const { data: boxScore, isLoading, error, refetch } = useQuery<BoxScoreData>({
    queryKey: ['boxscore', gameId],
    queryFn: async () => {
      const response = await apiClient(`/games/${gameId}/boxscore`);
      if (!response.ok) {
        throw new Error('Failed to fetch box score');
      }
      return response.json();
    },
    refetchInterval: 1000, // Refetch every second for live updates
    staleTime: 0,
  });

  const formatPct = (value: number | null) => {
    if (value === null || value === 0) return '0.0%';
    return `${(value * 100).toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Box Score</CardTitle>
          <CardDescription>Loading statistics...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error || !boxScore || !boxScore.teamStats || !boxScore.playerStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Box Score</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          No box score data available yet. Start recording events to see statistics.
        </CardContent>
      </Card>
    );
  }

  const ourTeam = boxScore.teamStats.find((t) => t.teamSide === 'US');
  const oppTeam = boxScore.teamStats.find((t) => t.teamSide === 'OPP');
  const ourPlayers = boxScore.playerStats.filter((p) => p.playerId !== 'OPP');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Box Score</CardTitle>
        <CardDescription>Live game statistics</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="team" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="team">Team Stats</TabsTrigger>
            <TabsTrigger value="players">Player Stats</TabsTrigger>
          </TabsList>

          {/* Team Stats Tab */}
          <TabsContent value="team" className="space-y-4">
            {/* Live Indicator */}
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live Updates
              </span>
            </div>

            {/* Team Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 dark:bg-slate-900/50">
                    <th className="text-left py-2 px-2 font-semibold">Team</th>
                    <th className="text-center py-2 px-1.5 font-semibold">PTS</th>
                    <th className="text-center py-2 px-1.5 font-semibold">FG</th>
                    <th className="text-center py-2 px-1.5 font-semibold">FG%</th>
                    <th className="text-center py-2 px-1.5 font-semibold">3P</th>
                    <th className="text-center py-2 px-1.5 font-semibold">3P%</th>
                    <th className="text-center py-2 px-1.5 font-semibold">FT</th>
                    <th className="text-center py-2 px-1.5 font-semibold">FT%</th>
                    <th className="text-center py-2 px-1.5 font-semibold">REB</th>
                    <th className="text-center py-2 px-1.5 font-semibold">AST</th>
                    <th className="text-center py-2 px-1.5 font-semibold">STL</th>
                    <th className="text-center py-2 px-1.5 font-semibold">BLK</th>
                    <th className="text-center py-2 px-1.5 font-semibold">TOV</th>
                  </tr>
                </thead>
                <tbody>
                  {ourTeam && (
                    <tr className="border-b bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-900/40">
                      <td className="py-2 px-2 font-semibold text-green-900 dark:text-green-100">
                        🏀 {ourTeam.teamName || 'Your Team'}
                      </td>
                      <td className="text-center py-2 px-1.5 font-bold text-lg">{ourTeam.points}</td>
                      <td className="text-center py-2 px-1.5">
                        {ourTeam.fgm}/{ourTeam.fga}
                      </td>
                      <td className="text-center py-2 px-1.5">{formatPct(ourTeam.fgPct)}</td>
                      <td className="text-center py-2 px-1.5">
                        {ourTeam.fg3m}/{ourTeam.fg3a}
                      </td>
                      <td className="text-center py-2 px-1.5">{formatPct(ourTeam.fg3Pct)}</td>
                      <td className="text-center py-2 px-1.5">
                        {ourTeam.ftm}/{ourTeam.fta}
                      </td>
                      <td className="text-center py-2 px-1.5">{formatPct(ourTeam.ftPct)}</td>
                      <td className="text-center py-2 px-1.5 font-semibold">{ourTeam.reb}</td>
                      <td className="text-center py-2 px-1.5">{ourTeam.ast}</td>
                      <td className="text-center py-2 px-1.5">{ourTeam.stl}</td>
                      <td className="text-center py-2 px-1.5">{ourTeam.blk}</td>
                      <td className="text-center py-2 px-1.5">{ourTeam.tov}</td>
                    </tr>
                  )}
                  {oppTeam && (
                    <tr className="border-b bg-slate-50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-2 font-semibold">
                        👥 {oppTeam.teamName || 'Opponent'}
                      </td>
                      <td className="text-center py-2 px-1.5 font-bold text-lg">{oppTeam.points}</td>
                      <td className="text-center py-2 px-1.5">
                        {oppTeam.fgm}/{oppTeam.fga}
                      </td>
                      <td className="text-center py-2 px-1.5">{formatPct(oppTeam.fgPct)}</td>
                      <td className="text-center py-2 px-1.5">
                        {oppTeam.fg3m}/{oppTeam.fg3a}
                      </td>
                      <td className="text-center py-2 px-1.5">{formatPct(oppTeam.fg3Pct)}</td>
                      <td className="text-center py-2 px-1.5">
                        {oppTeam.ftm}/{oppTeam.fta}
                      </td>
                      <td className="text-center py-2 px-1.5">{formatPct(oppTeam.ftPct)}</td>
                      <td className="text-center py-2 px-1.5 font-semibold">{oppTeam.reb}</td>
                      <td className="text-center py-2 px-1.5">{oppTeam.ast}</td>
                      <td className="text-center py-2 px-1.5">{oppTeam.stl}</td>
                      <td className="text-center py-2 px-1.5">{oppTeam.blk}</td>
                      <td className="text-center py-2 px-1.5">{oppTeam.tov}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Advanced Stats */}
            {ourTeam && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 text-sm">Advanced Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded p-3">
                    <div className="text-xs text-muted-foreground">eFG%</div>
                    <div className="text-lg font-bold">{formatPct(ourTeam.efgPct)}</div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded p-3">
                    <div className="text-xs text-muted-foreground">TS%</div>
                    <div className="text-lg font-bold">{formatPct(ourTeam.tsPct)}</div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded p-3">
                    <div className="text-xs text-muted-foreground">AST/TO</div>
                    <div className="text-lg font-bold">
                      {ourTeam.astToRatio?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded p-3">
                    <div className="text-xs text-muted-foreground">OREB</div>
                    <div className="text-lg font-bold">{ourTeam.oreb}</div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Player Stats Tab */}
          <TabsContent value="players" className="space-y-4">
            {/* Live Indicator */}
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live Updates - {ourPlayers.length} players
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 dark:bg-slate-900/50">
                    <th className="text-center py-2 px-1.5 font-semibold w-8">#</th>
                    <th className="text-left py-2 px-2 font-semibold">Player</th>
                    <th className="text-center py-2 px-1.5 font-semibold">PTS</th>
                    <th className="text-center py-2 px-1.5 font-semibold">FG</th>
                    <th className="text-center py-2 px-1.5 font-semibold">3P</th>
                    <th className="text-center py-2 px-1.5 font-semibold">FT</th>
                    <th className="text-center py-2 px-1.5 font-semibold">REB</th>
                    <th className="text-center py-2 px-1.5 font-semibold">AST</th>
                    <th className="text-center py-2 px-1.5 font-semibold">STL</th>
                    <th className="text-center py-2 px-1.5 font-semibold">BLK</th>
                    <th className="text-center py-2 px-1.5 font-semibold">TOV</th>
                    <th className="text-center py-2 px-1.5 font-semibold">PF</th>
                  </tr>
                </thead>
                <tbody>
                  {ourPlayers.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="text-center py-6 text-muted-foreground text-xs md:text-sm">
                        No player stats recorded yet
                      </td>
                    </tr>
                  ) : (
                    ourPlayers
                      .sort((a, b) => b.points - a.points) // Sort by points descending
                      .map((player) => (
                        <tr
                          key={player.playerId}
                          className="border-b hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                        >
                          <td className="text-center py-2 px-1.5 font-bold text-blue-600 dark:text-blue-400">
                            {player.playerNumber}
                          </td>
                          <td className="py-2 px-2 font-medium text-left">{player.playerName}</td>
                          <td className="text-center py-2 px-1.5 font-bold text-lg">
                            {player.points}
                          </td>
                          <td className="text-center py-2 px-1.5 text-xs">
                            {player.fgm}/{player.fga}
                          </td>
                          <td className="text-center py-2 px-1.5 text-xs">
                            {player.fg3m}/{player.fg3a}
                          </td>
                          <td className="text-center py-2 px-1.5 text-xs">
                            {player.ftm}/{player.fta}
                          </td>
                          <td className="text-center py-2 px-1.5 font-semibold">
                            {player.reb}
                          </td>
                          <td className="text-center py-2 px-1.5">
                            {player.ast}
                          </td>
                          <td className="text-center py-2 px-1.5">
                            {player.stl}
                          </td>
                          <td className="text-center py-2 px-1.5">
                            {player.blk}
                          </td>
                          <td className="text-center py-2 px-1.5">
                            {player.tov}
                          </td>
                          <td className="text-center py-2 px-1.5">
                            {player.pf}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            {ourPlayers.length > 0 && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p>📊 Sorted by points scored (descending)</p>
                <p>🔄 Updates automatically - no manual refresh needed</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
