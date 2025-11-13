'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

interface PlayerInfo {
  firstName: string;
  lastName: string;
  jersey: number;
  position: string | null;
}

interface BoxScorePlayerData {
  id: string;
  gameId: string;
  playerId: string;
  minutes: number;
  pts: number;
  fgm2: number;
  fga2: number;
  fgm3: number;
  fga3: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  plusMinus: number;
  player: PlayerInfo | null;
  advanced?: Record<string, unknown>;
}

interface BoxScoreTeamData {
  id: string;
  gameId: string;
  teamSide: 'US' | 'OPP';
  pts: number;
  fgm2: number;
  fga2: number;
  fgm3: number;
  fga3: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  advanced?: Record<string, unknown>;
}

interface GameData {
  id: string;
  opponent: string;
  date: string;
  status: string;
  period: number;
  clockSec: number;
  ourScore: number;
  oppScore: number;
  team: unknown;
}

interface BoxScoreData {
  game: GameData;
  teamBoxScores: BoxScoreTeamData[];
  playerBoxScores: BoxScorePlayerData[];
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
    refetchInterval: 1000, // Refetch every second for live updates
    staleTime: 0,
  });

  const formatPct = (value: number | null | undefined) => {
    if (value === null || value === 0 || value === undefined) return '0.0%';
    return `${(value * 100).toFixed(1)}%`;
  };

  const calculateFGPct = (made: number, attempts: number) => {
    if (attempts === 0) return 0;
    return made / attempts;
  };

  const calculateEFGPct = (made2: number, made3: number, attempts2: number, attempts3: number) => {
    const totalAttempts = attempts2 + attempts3;
    if (totalAttempts === 0) return 0;
    return (made2 + 1.5 * made3) / totalAttempts;
  };

  const calculateTSPct = (pts: number, attempts2: number, attempts3: number, fta: number) => {
    const totalAttempts = attempts2 + attempts3 + 0.44 * fta;
    if (totalAttempts === 0) return 0;
    return pts / (2 * totalAttempts);
  };

  const calculateRebounds = (oreb: number, dreb: number) => {
    return oreb + dreb;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !boxScore || !boxScore.teamBoxScores || !boxScore.playerBoxScores) {
    // Debug: Log why we're showing empty state
    if (error) console.error('❌ Box Score API Error:', error);
    if (!boxScore) console.warn('⚠️ boxScore is undefined/null');
    if (boxScore && !boxScore.teamBoxScores) console.warn('⚠️ boxScore.teamBoxScores is empty/undefined');
    if (boxScore && !boxScore.playerBoxScores) console.warn('⚠️ boxScore.playerBoxScores is empty/undefined');

    return (
      <div className="py-8 text-center text-muted-foreground space-y-3">
        <p>No box score data available yet. Start recording events to see statistics.</p>
        <p className="text-xs text-slate-500">
          {error && `Error: ${error.message}`}
          {!error && !boxScore && 'Waiting for data...'}
          {boxScore && !boxScore.teamBoxScores && 'No team stats available'}
          {boxScore && !boxScore.playerBoxScores && 'No player stats available'}
        </p>
      </div>
    );
  }

  const ourTeam = boxScore.teamBoxScores.find((t) => t.teamSide === 'US');
  const oppTeam = boxScore.teamBoxScores.find((t) => t.teamSide === 'OPP');
  const ourPlayers = boxScore.playerBoxScores;

  return (
    <div className="space-y-4">
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
                        🏀 Your Team
                      </td>
                      <td className="text-center py-2 px-1.5 font-bold text-lg">{ourTeam.pts}</td>
                      <td className="text-center py-2 px-1.5">
                        {ourTeam.fgm2}/{ourTeam.fga2}
                      </td>
                      <td className="text-center py-2 px-1.5">{formatPct(calculateFGPct(ourTeam.fgm2, ourTeam.fga2))}</td>
                      <td className="text-center py-2 px-1.5">
                        {ourTeam.fgm3}/{ourTeam.fga3}
                      </td>
                      <td className="text-center py-2 px-1.5">{formatPct(calculateFGPct(ourTeam.fgm3, ourTeam.fga3))}</td>
                      <td className="text-center py-2 px-1.5">
                        {ourTeam.ftm}/{ourTeam.fta}
                      </td>
                      <td className="text-center py-2 px-1.5">{formatPct(calculateFGPct(ourTeam.ftm, ourTeam.fta))}</td>
                      <td className="text-center py-2 px-1.5 font-semibold">{calculateRebounds(ourTeam.oreb, ourTeam.dreb)}</td>
                      <td className="text-center py-2 px-1.5">{ourTeam.ast}</td>
                      <td className="text-center py-2 px-1.5">{ourTeam.stl}</td>
                      <td className="text-center py-2 px-1.5">{ourTeam.blk}</td>
                      <td className="text-center py-2 px-1.5">{ourTeam.tov}</td>
                    </tr>
                  )}
                  {oppTeam && (
                    <tr className="border-b bg-slate-50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-2 font-semibold">
                        👥 Opponent
                      </td>
                      <td className="text-center py-2 px-1.5 font-bold text-lg">{oppTeam.pts}</td>
                      <td className="text-center py-2 px-1.5">
                        {oppTeam.fgm2}/{oppTeam.fga2}
                      </td>
                      <td className="text-center py-2 px-1.5">{formatPct(calculateFGPct(oppTeam.fgm2, oppTeam.fga2))}</td>
                      <td className="text-center py-2 px-1.5">
                        {oppTeam.fgm3}/{oppTeam.fga3}
                      </td>
                      <td className="text-center py-2 px-1.5">{formatPct(calculateFGPct(oppTeam.fgm3, oppTeam.fga3))}</td>
                      <td className="text-center py-2 px-1.5">
                        {oppTeam.ftm}/{oppTeam.fta}
                      </td>
                      <td className="text-center py-2 px-1.5">{formatPct(calculateFGPct(oppTeam.ftm, oppTeam.fta))}</td>
                      <td className="text-center py-2 px-1.5 font-semibold">{calculateRebounds(oppTeam.oreb, oppTeam.dreb)}</td>
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
                    <div className="text-lg font-bold">
                      {formatPct(calculateEFGPct(ourTeam.fgm2, ourTeam.fgm3, ourTeam.fga2, ourTeam.fga3))}
                    </div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded p-3">
                    <div className="text-xs text-muted-foreground">TS%</div>
                    <div className="text-lg font-bold">
                      {formatPct(calculateTSPct(ourTeam.pts, ourTeam.fga2, ourTeam.fga3, ourTeam.fta))}
                    </div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded p-3">
                    <div className="text-xs text-muted-foreground">AST/TO</div>
                    <div className="text-lg font-bold">
                      {ourTeam.tov === 0 ? '∞' : (ourTeam.ast / ourTeam.tov).toFixed(2)}
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
                      .sort((a, b) => b.pts - a.pts) // Sort by points descending
                      .map((player) => (
                        <tr
                          key={player.playerId}
                          className="border-b hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                        >
                          <td className="text-center py-2 px-1.5 font-bold text-blue-600 dark:text-blue-400">
                            {player.player?.jersey || 'N/A'}
                          </td>
                          <td className="py-2 px-2 font-medium text-left">
                            {player.player ? `${player.player.firstName} ${player.player.lastName}` : 'Unknown'}
                          </td>
                          <td className="text-center py-2 px-1.5 font-bold text-lg">
                            {player.pts}
                          </td>
                          <td className="text-center py-2 px-1.5 text-xs">
                            {player.fgm2}/{player.fga2}
                          </td>
                          <td className="text-center py-2 px-1.5 text-xs">
                            {player.fgm3}/{player.fga3}
                          </td>
                          <td className="text-center py-2 px-1.5 text-xs">
                            {player.ftm}/{player.fta}
                          </td>
                          <td className="text-center py-2 px-1.5 font-semibold">
                            {calculateRebounds(player.oreb, player.dreb)}
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
    </div>
  );
}
