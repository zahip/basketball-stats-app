'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

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
  const { data: boxScore, isLoading, error } = useQuery<BoxScoreData>({
    queryKey: ['boxscore', gameId],
    queryFn: async () => {
      const response = await apiClient(`/games/${gameId}/boxscore`);
      if (!response.ok) {
        throw new Error('Failed to fetch box score');
      }
      return response.json();
    },
    refetchInterval: 10000, // Refetch every 10 seconds during live game
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
            {/* Team Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-semibold">Team</th>
                    <th className="text-center py-2 px-2 font-semibold">PTS</th>
                    <th className="text-center py-2 px-2 font-semibold">FG</th>
                    <th className="text-center py-2 px-2 font-semibold">FG%</th>
                    <th className="text-center py-2 px-2 font-semibold">3P</th>
                    <th className="text-center py-2 px-2 font-semibold">3P%</th>
                    <th className="text-center py-2 px-2 font-semibold">FT</th>
                    <th className="text-center py-2 px-2 font-semibold">FT%</th>
                    <th className="text-center py-2 px-2 font-semibold">REB</th>
                    <th className="text-center py-2 px-2 font-semibold">AST</th>
                    <th className="text-center py-2 px-2 font-semibold">STL</th>
                    <th className="text-center py-2 px-2 font-semibold">BLK</th>
                    <th className="text-center py-2 px-2 font-semibold">TOV</th>
                  </tr>
                </thead>
                <tbody>
                  {ourTeam && (
                    <tr className="border-b bg-blue-50 dark:bg-blue-950">
                      <td className="py-2 px-2 font-medium">
                        {ourTeam.teamName || 'Your Team'}
                      </td>
                      <td className="text-center py-2 px-2 font-bold">{ourTeam.points}</td>
                      <td className="text-center py-2 px-2">
                        {ourTeam.fgm}/{ourTeam.fga}
                      </td>
                      <td className="text-center py-2 px-2">{formatPct(ourTeam.fgPct)}</td>
                      <td className="text-center py-2 px-2">
                        {ourTeam.fg3m}/{ourTeam.fg3a}
                      </td>
                      <td className="text-center py-2 px-2">{formatPct(ourTeam.fg3Pct)}</td>
                      <td className="text-center py-2 px-2">
                        {ourTeam.ftm}/{ourTeam.fta}
                      </td>
                      <td className="text-center py-2 px-2">{formatPct(ourTeam.ftPct)}</td>
                      <td className="text-center py-2 px-2">{ourTeam.reb}</td>
                      <td className="text-center py-2 px-2">{ourTeam.ast}</td>
                      <td className="text-center py-2 px-2">{ourTeam.stl}</td>
                      <td className="text-center py-2 px-2">{ourTeam.blk}</td>
                      <td className="text-center py-2 px-2">{ourTeam.tov}</td>
                    </tr>
                  )}
                  {oppTeam && (
                    <tr className="border-b">
                      <td className="py-2 px-2 font-medium">
                        {oppTeam.teamName || 'Opponent'}
                      </td>
                      <td className="text-center py-2 px-2 font-bold">{oppTeam.points}</td>
                      <td className="text-center py-2 px-2">
                        {oppTeam.fgm}/{oppTeam.fga}
                      </td>
                      <td className="text-center py-2 px-2">{formatPct(oppTeam.fgPct)}</td>
                      <td className="text-center py-2 px-2">
                        {oppTeam.fg3m}/{oppTeam.fg3a}
                      </td>
                      <td className="text-center py-2 px-2">{formatPct(oppTeam.fg3Pct)}</td>
                      <td className="text-center py-2 px-2">
                        {oppTeam.ftm}/{oppTeam.fta}
                      </td>
                      <td className="text-center py-2 px-2">{formatPct(oppTeam.ftPct)}</td>
                      <td className="text-center py-2 px-2">{oppTeam.reb}</td>
                      <td className="text-center py-2 px-2">{oppTeam.ast}</td>
                      <td className="text-center py-2 px-2">{oppTeam.stl}</td>
                      <td className="text-center py-2 px-2">{oppTeam.blk}</td>
                      <td className="text-center py-2 px-2">{oppTeam.tov}</td>
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-semibold">#</th>
                    <th className="text-left py-2 px-2 font-semibold">Player</th>
                    <th className="text-center py-2 px-2 font-semibold">PTS</th>
                    <th className="text-center py-2 px-2 font-semibold">FG</th>
                    <th className="text-center py-2 px-2 font-semibold">3P</th>
                    <th className="text-center py-2 px-2 font-semibold">FT</th>
                    <th className="text-center py-2 px-2 font-semibold">REB</th>
                    <th className="text-center py-2 px-2 font-semibold">AST</th>
                    <th className="text-center py-2 px-2 font-semibold">STL</th>
                    <th className="text-center py-2 px-2 font-semibold">BLK</th>
                    <th className="text-center py-2 px-2 font-semibold">TOV</th>
                    <th className="text-center py-2 px-2 font-semibold">PF</th>
                  </tr>
                </thead>
                <tbody>
                  {ourPlayers.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="text-center py-4 text-muted-foreground">
                        No player stats recorded yet
                      </td>
                    </tr>
                  ) : (
                    ourPlayers
                      .sort((a, b) => b.points - a.points) // Sort by points descending
                      .map((player) => (
                        <tr key={player.playerId} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                          <td className="py-2 px-2 font-medium">{player.playerNumber}</td>
                          <td className="py-2 px-2">{player.playerName}</td>
                          <td className="text-center py-2 px-2 font-bold">{player.points}</td>
                          <td className="text-center py-2 px-2">
                            {player.fgm}/{player.fga}
                          </td>
                          <td className="text-center py-2 px-2">
                            {player.fg3m}/{player.fg3a}
                          </td>
                          <td className="text-center py-2 px-2">
                            {player.ftm}/{player.fta}
                          </td>
                          <td className="text-center py-2 px-2">{player.reb}</td>
                          <td className="text-center py-2 px-2">{player.ast}</td>
                          <td className="text-center py-2 px-2">{player.stl}</td>
                          <td className="text-center py-2 px-2">{player.blk}</td>
                          <td className="text-center py-2 px-2">{player.tov}</td>
                          <td className="text-center py-2 px-2">{player.pf}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            {ourPlayers.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <p>Sorted by points scored. Minutes played and +/- coming soon!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
