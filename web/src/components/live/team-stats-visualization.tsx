'use client'

import type { Game } from '@/types/game'
import { calculateTeamStats } from '@/lib/stats/calculate-team-stats'
import { cn } from '@/lib/utils'

interface TeamStatsVisualizationProps {
  game: Game
  className?: string
}

interface StatBarProps {
  label: string
  homeValue: number
  awayValue: number
  maxValue: number
  homeColor?: string
  awayColor?: string
  suffix?: string
}

/**
 * StatBar - Single progress bar comparing home and away team stats
 */
function StatBar({
  label,
  homeValue,
  awayValue,
  maxValue,
  homeColor = 'bg-violet-500',
  awayColor = 'bg-sky-500',
  suffix = '',
}: StatBarProps) {
  const homePercentage = maxValue > 0 ? (homeValue / maxValue) * 100 : 0
  const awayPercentage = maxValue > 0 ? (awayValue / maxValue) * 100 : 0

  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="text-center">
        <span className="text-xs md:text-sm font-semibold text-slate-300 uppercase tracking-wide">
          {label}
        </span>
      </div>

      {/* Values and bars */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Home value */}
        <div className="w-12 md:w-14 text-right">
          <span className="text-sm md:text-base font-bold text-violet-400">
            {homeValue}
            {suffix}
          </span>
        </div>

        {/* Progress bars */}
        <div className="flex-1 flex items-center gap-1">
          {/* Home team bar (fills from right) */}
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-500 ml-auto',
                homeColor
              )}
              style={{ width: `${homePercentage}%` }}
            />
          </div>

          {/* Away team bar (fills from left) */}
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-500',
                awayColor
              )}
              style={{ width: `${awayPercentage}%` }}
            />
          </div>
        </div>

        {/* Away value */}
        <div className="w-12 md:w-14 text-left">
          <span className="text-sm md:text-base font-bold text-sky-400">
            {awayValue}
            {suffix}
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * TeamStatsVisualization - Compare team statistics with progress bars
 * Shows rebounds, assists, and field goal percentage
 */
export function TeamStatsVisualization({
  game,
  className,
}: TeamStatsVisualizationProps) {
  const homeStats = calculateTeamStats(game.actions, game.homeTeamId)
  const awayStats = calculateTeamStats(game.actions, game.awayTeamId)

  // Calculate max values for progress bars
  const maxRebounds = Math.max(homeStats.rebounds, awayStats.rebounds, 1)
  const maxAssists = Math.max(homeStats.assists, awayStats.assists, 1)

  return (
    <div className={cn('w-full', className)}>
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/60">
          <h3 className="text-sm md:text-base font-bold text-slate-50 uppercase tracking-wider">
            Team Stats
          </h3>
        </div>

        {/* Stats comparison */}
        <div className="p-4 md:p-6 space-y-6">
          {/* Team labels */}
          <div className="flex items-center justify-between px-14 md:px-16">
            <span className="text-xs md:text-sm font-bold text-violet-400 uppercase">
              {game.homeTeam.name}
            </span>
            <span className="text-xs md:text-sm font-bold text-sky-400 uppercase">
              {game.awayTeam.name}
            </span>
          </div>

          {/* Rebounds */}
          <StatBar
            label="Rebounds"
            homeValue={homeStats.rebounds}
            awayValue={awayStats.rebounds}
            maxValue={maxRebounds}
          />

          {/* Assists */}
          <StatBar
            label="Assists"
            homeValue={homeStats.assists}
            awayValue={awayStats.assists}
            maxValue={maxAssists}
          />

          {/* Field Goal % */}
          <StatBar
            label="Field Goal %"
            homeValue={homeStats.fieldGoalPercentage}
            awayValue={awayStats.fieldGoalPercentage}
            maxValue={100}
            suffix="%"
          />

          {/* Additional stats summary */}
          <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs text-slate-500 mb-1">FG Made/Attempted</p>
              <p className="text-sm font-semibold text-slate-300">
                {homeStats.fieldGoalsMade}/{homeStats.fieldGoalsAttempted}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">FG Made/Attempted</p>
              <p className="text-sm font-semibold text-slate-300">
                {awayStats.fieldGoalsMade}/{awayStats.fieldGoalsAttempted}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
