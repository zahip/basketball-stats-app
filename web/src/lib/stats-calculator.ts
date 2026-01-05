import type { Action, ActionType } from '@/types/game'

export interface PlayerStats {
  player: {
    id: string
    name: string
    jerseyNumber: number
    position: string
    teamId: string
  }
  points: number
  fieldGoalsMade: number
  fieldGoalsAttempted: number
  threePointMade: number
  threePointAttempted: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fouls: number
  fieldGoalPercentage: number
}

/**
 * Calculate comprehensive stats from game actions
 */
export function calculateGameStats(
  actions: Action[],
  homeTeamId: string,
  awayTeamId: string
): {
  homeStats: PlayerStats[]
  awayStats: PlayerStats[]
} {
  const playerStatsMap = new Map<string, PlayerStats>()

  // Initialize stats for each player
  actions.forEach((action) => {
    if (!playerStatsMap.has(action.playerId)) {
      playerStatsMap.set(action.playerId, {
        player: {
          id: action.player.id,
          name: action.player.name,
          jerseyNumber: action.player.jerseyNumber,
          position: action.player.position,
          teamId: action.player.teamId,
        },
        points: 0,
        fieldGoalsMade: 0,
        fieldGoalsAttempted: 0,
        threePointMade: 0,
        threePointAttempted: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        fouls: 0,
        fieldGoalPercentage: 0,
      })
    }
  })

  // Aggregate stats from actions
  actions.forEach((action) => {
    const stats = playerStatsMap.get(action.playerId)!

    switch (action.type) {
      case 'TWO_PT_MAKE':
        stats.points += 2
        stats.fieldGoalsMade += 1
        stats.fieldGoalsAttempted += 1
        break
      case 'TWO_PT_MISS':
        stats.fieldGoalsAttempted += 1
        break
      case 'THREE_PT_MAKE':
        stats.points += 3
        stats.fieldGoalsMade += 1
        stats.fieldGoalsAttempted += 1
        stats.threePointMade += 1
        stats.threePointAttempted += 1
        break
      case 'THREE_PT_MISS':
        stats.fieldGoalsAttempted += 1
        stats.threePointAttempted += 1
        break
      case 'REB':
        stats.rebounds += 1
        break
      case 'AST':
        stats.assists += 1
        break
      case 'STL':
        stats.steals += 1
        break
      case 'BLK':
        stats.blocks += 1
        break
      case 'TO':
        stats.turnovers += 1
        break
      case 'FOUL':
        stats.fouls += 1
        break
    }
  })

  // Calculate field goal percentages
  playerStatsMap.forEach((stats) => {
    if (stats.fieldGoalsAttempted > 0) {
      stats.fieldGoalPercentage = (stats.fieldGoalsMade / stats.fieldGoalsAttempted) * 100
    }
  })

  // Separate into home and away teams
  const homeStats: PlayerStats[] = []
  const awayStats: PlayerStats[] = []

  playerStatsMap.forEach((stats) => {
    if (stats.player.teamId === homeTeamId) {
      homeStats.push(stats)
    } else if (stats.player.teamId === awayTeamId) {
      awayStats.push(stats)
    }
  })

  // Sort by points descending
  homeStats.sort((a, b) => b.points - a.points)
  awayStats.sort((a, b) => b.points - a.points)

  return { homeStats, awayStats }
}

/**
 * Get top N performers from a team's stats
 */
export function getTopPerformers(stats: PlayerStats[], count: number = 3): PlayerStats[] {
  return stats.slice(0, count)
}
