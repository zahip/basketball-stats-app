import type { Action, Player, PlayerGameStatus } from '@/types/game'

export interface PlayerBoxScore {
  playerId: string
  player: Player
  points: number
  rebounds: number
  assists: number
  fouls: number
  minutes: number // Total seconds played (format as MM:SS for display)
}

/**
 * Calculate individual player statistics (box score) from actions array
 * @param actions - Array of game actions
 * @param teamId - ID of the team to calculate stats for
 * @param playerStatuses - Array of player game statuses with minutes data
 * @returns Array of PlayerBoxScore objects sorted by points descending
 */
export function calculatePlayerBoxScore(
  actions: Action[],
  teamId: string,
  playerStatuses: PlayerGameStatus[]
): PlayerBoxScore[] {
  // Filter actions for this team
  const teamActions = actions.filter(
    (action) => action.player.teamId === teamId
  )

  // Create minutes map from player statuses
  const minutesMap = new Map<string, number>()
  playerStatuses
    .filter(status => status.player.teamId === teamId)
    .forEach(status => {
      minutesMap.set(status.playerId, status.totalSecondsPlayed)
    })

  // Group actions by playerId and accumulate stats
  const playerStatsMap = new Map<string, PlayerBoxScore>()
  const playerMap = new Map<string, Player>()

  teamActions.forEach((action) => {
    const { playerId, player } = action

    // Store player object
    if (!playerMap.has(playerId)) {
      playerMap.set(playerId, player)
    }

    // Get or initialize player stats
    if (!playerStatsMap.has(playerId)) {
      playerStatsMap.set(playerId, {
        playerId,
        player,
        points: 0,
        rebounds: 0,
        assists: 0,
        fouls: 0,
        minutes: minutesMap.get(playerId) || 0, // Get minutes from statuses
      })
    }

    const stats = playerStatsMap.get(playerId)!

    // Accumulate stats based on action type
    switch (action.type) {
      case 'TWO_PT_MAKE':
        stats.points += 2
        break
      case 'THREE_PT_MAKE':
        stats.points += 3
        break
      case 'FT_MAKE':
        stats.points += 1
        break
      case 'REB':
        stats.rebounds += 1
        break
      case 'AST':
        stats.assists += 1
        break
      case 'FOUL':
        stats.fouls += 1
        break
      // Other action types (misses, steals, blocks, turnovers) don't affect these stats
    }
  })

  // Add players who have minutes but no actions yet
  playerStatuses
    .filter(status => status.player.teamId === teamId)
    .forEach(status => {
      if (!playerStatsMap.has(status.playerId) && status.totalSecondsPlayed > 0) {
        playerStatsMap.set(status.playerId, {
          playerId: status.playerId,
          player: status.player,
          points: 0,
          rebounds: 0,
          assists: 0,
          fouls: 0,
          minutes: status.totalSecondsPlayed,
        })
      }
    })

  // Convert Map to array and sort by points descending
  const boxScore = Array.from(playerStatsMap.values()).sort(
    (a, b) => b.points - a.points
  )

  return boxScore
}

/**
 * Format seconds to MM:SS
 * @param seconds - Total seconds
 * @returns Formatted time string (MM:SS)
 */
export function formatMinutes(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
