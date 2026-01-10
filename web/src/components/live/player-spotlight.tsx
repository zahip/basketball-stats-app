'use client'

import type { Game } from '@/types/game'
import { calculateTopScorer } from '@/lib/stats/calculate-player-stats'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { cn } from '@/lib/utils'

interface PlayerSpotlightProps {
  game: Game
  className?: string
}

/**
 * PlayerSpotlight - Displays the top scorer for each team
 * Shows player avatar, name, jersey number, and points
 */
export function PlayerSpotlight({ game, className }: PlayerSpotlightProps) {
  const homeTopScorer = calculateTopScorer(game.actions, game.homeTeamId)
  const awayTopScorer = calculateTopScorer(game.actions, game.awayTeamId)

  return (
    <div className={cn('w-full px-4 py-6 md:px-6', className)}>
      <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
        {/* Home Team Top Scorer */}
        <div className="bg-slate-900/60 border-2 border-violet-500/30 rounded-xl p-4 md:p-6">
          <div className="text-center">
            <h3 className="text-xs md:text-sm font-bold text-violet-400 uppercase tracking-wider mb-3 md:mb-4">
              Home Top Scorer
            </h3>

            {homeTopScorer ? (
              <div className="flex flex-col items-center gap-2 md:gap-3">
                <PlayerAvatar
                  firstName={homeTopScorer.player.name.split(' ')[0]}
                  lastName={homeTopScorer.player.name.split(' ')[1] || ''}
                  jerseyNumber={homeTopScorer.player.jerseyNumber}
                  className="h-16 w-16 md:h-20 md:w-20"
                />
                <div>
                  <p className="text-sm md:text-base font-semibold text-slate-50">
                    {homeTopScorer.player.name}
                  </p>
                  <p className="text-xs md:text-sm text-slate-400">
                    #{homeTopScorer.player.jerseyNumber}
                  </p>
                </div>
                <div className="mt-1">
                  <span className="text-2xl md:text-3xl font-bold text-violet-400">
                    {homeTopScorer.points}
                  </span>
                  <span className="text-sm md:text-base text-slate-400 ml-1">
                    PTS
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-6 md:py-8">
                <p className="text-sm text-slate-500">No scoring yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Away Team Top Scorer */}
        <div className="bg-slate-900/60 border-2 border-sky-500/30 rounded-xl p-4 md:p-6">
          <div className="text-center">
            <h3 className="text-xs md:text-sm font-bold text-sky-400 uppercase tracking-wider mb-3 md:mb-4">
              Away Top Scorer
            </h3>

            {awayTopScorer ? (
              <div className="flex flex-col items-center gap-2 md:gap-3">
                <PlayerAvatar
                  firstName={awayTopScorer.player.name.split(' ')[0]}
                  lastName={awayTopScorer.player.name.split(' ')[1] || ''}
                  jerseyNumber={awayTopScorer.player.jerseyNumber}
                  className="h-16 w-16 md:h-20 md:w-20"
                />
                <div>
                  <p className="text-sm md:text-base font-semibold text-slate-50">
                    {awayTopScorer.player.name}
                  </p>
                  <p className="text-xs md:text-sm text-slate-400">
                    #{awayTopScorer.player.jerseyNumber}
                  </p>
                </div>
                <div className="mt-1">
                  <span className="text-2xl md:text-3xl font-bold text-sky-400">
                    {awayTopScorer.points}
                  </span>
                  <span className="text-sm md:text-base text-slate-400 ml-1">
                    PTS
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-6 md:py-8">
                <p className="text-sm text-slate-500">No scoring yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
