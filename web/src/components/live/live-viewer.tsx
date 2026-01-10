'use client'

import { useGame, useGameRealtime } from '@/lib/hooks/use-game'
import { CinematicScoreboard } from './cinematic-scoreboard'
import { PlayerSpotlight } from './player-spotlight'
import { LivePlayByPlay } from './live-play-by-play'
import { TeamStatsVisualization } from './team-stats-visualization'
import { Loader2 } from 'lucide-react'

interface LiveViewerProps {
  gameId: string
}

/**
 * LiveViewer - Main component for the spectator live view
 * Fetches game data and subscribes to real-time updates
 * Orchestrates all sub-components in a responsive layout
 */
export function LiveViewer({ gameId }: LiveViewerProps) {
  // Fetch game data
  const { data: game, isLoading, error } = useGame(gameId)

  // Subscribe to real-time updates
  useGameRealtime(gameId)

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading game...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !game) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center px-4">
          <h2 className="text-xl font-bold text-slate-50 mb-2">
            Game Not Found
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            Unable to load game with ID: {gameId}
          </p>
          <a
            href="/"
            className="text-sm text-violet-400 hover:text-violet-300 underline"
          >
            Return to home
          </a>
        </div>
      </div>
    )
  }

  // Main view
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Cinematic Scoreboard - Hero section */}
      <CinematicScoreboard game={game} />

      {/* Player Spotlight - Top scorers */}
      <PlayerSpotlight game={game} />

      {/* Main content grid - Play-by-play and stats */}
      <div className="px-4 pb-8 md:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Live Play-by-Play - Left column on desktop */}
          <LivePlayByPlay actions={game.actions} />

          {/* Team Stats Visualization - Right column on desktop */}
          <TeamStatsVisualization game={game} />
        </div>
      </div>
    </div>
  )
}
