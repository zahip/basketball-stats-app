'use client'

import { motion } from 'framer-motion'
import type { Game } from '@/types/game'
import { AnimatedScore } from './animated-score'
import { cn } from '@/lib/utils'

interface CinematicScoreboardProps {
  game: Game
  className?: string
}

/**
 * CinematicScoreboard - Hero section displaying scores, team names, and game status
 * Features animated scores, pulsing LIVE badge, and gradient background
 */
export function CinematicScoreboard({
  game,
  className,
}: CinematicScoreboardProps) {
  const isLive = game.status === 'LIVE'
  const isFinished = game.status === 'FINISHED'

  return (
    <div
      className={cn(
        'relative w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800',
        className
      )}
    >
      {/* Top bar with status and quarter */}
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        {/* LIVE indicator */}
        {isLive && (
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [1, 0.8, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="flex items-center gap-2"
          >
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500" />
            <span className="text-xs md:text-sm font-bold text-red-400 uppercase tracking-wider">
              Live
            </span>
          </motion.div>
        )}

        {isFinished && (
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider">
              Final
            </span>
          </div>
        )}

        {!isLive && !isFinished && (
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider">
              Scheduled
            </span>
          </div>
        )}

        {/* Quarter indicator (placeholder - can be enhanced with actual quarter data) */}
        {isLive && (
          <div className="px-3 py-1 bg-slate-800/50 rounded-full">
            <span className="text-xs md:text-sm font-semibold text-slate-300">
              Q4
            </span>
          </div>
        )}
      </div>

      {/* Main scoreboard */}
      <div className="flex items-center justify-center gap-6 md:gap-12 px-4 py-8 md:py-12">
        {/* Home Team */}
        <div className="flex flex-col items-center gap-2 md:gap-3">
          <h2 className="text-lg md:text-2xl font-bold text-violet-400 tracking-tight">
            {game.homeTeam.name}
          </h2>
          <AnimatedScore
            value={game.scoreHome}
            className="text-4xl sm:text-6xl md:text-8xl font-bold text-slate-50"
          />
          <span className="text-xs md:text-sm text-slate-500 font-medium uppercase tracking-wider">
            Home
          </span>
        </div>

        {/* Separator */}
        <div className="text-2xl sm:text-4xl md:text-6xl font-bold text-slate-600">
          –
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center gap-2 md:gap-3">
          <h2 className="text-lg md:text-2xl font-bold text-sky-400 tracking-tight">
            {game.awayTeam.name}
          </h2>
          <AnimatedScore
            value={game.scoreAway}
            className="text-4xl sm:text-6xl md:text-8xl font-bold text-slate-50"
          />
          <span className="text-xs md:text-sm text-slate-500 font-medium uppercase tracking-wider">
            Away
          </span>
        </div>
      </div>

      {/* Bottom gradient overlay for depth */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
    </div>
  )
}
