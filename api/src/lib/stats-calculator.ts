import { Action, Player, ActionType } from '@prisma/client'

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
}

/**
 * Calculate comprehensive stats from game actions
 */
export function calculateGameStats(
  actions: (Action & { player: Player })[],
  homeTeamId: string,
  awayTeamId: string
): {
  homeStats: PlayerStats[]
  awayStats: PlayerStats[]
} {
  const playerStatsMap = new Map<string, PlayerStats>()

  // Initialize stats for each player
  actions.forEach(action => {
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
      })
    }
  })

  // Aggregate stats from actions
  actions.forEach(action => {
    const stats = playerStatsMap.get(action.playerId)!

    switch (action.type) {
      case ActionType.TWO_PT_MAKE:
        stats.points += 2
        stats.fieldGoalsMade += 1
        stats.fieldGoalsAttempted += 1
        break
      case ActionType.TWO_PT_MISS:
        stats.fieldGoalsAttempted += 1
        break
      case ActionType.THREE_PT_MAKE:
        stats.points += 3
        stats.fieldGoalsMade += 1
        stats.fieldGoalsAttempted += 1
        stats.threePointMade += 1
        stats.threePointAttempted += 1
        break
      case ActionType.THREE_PT_MISS:
        stats.fieldGoalsAttempted += 1
        stats.threePointAttempted += 1
        break
      case ActionType.REB:
        stats.rebounds += 1
        break
      case ActionType.AST:
        stats.assists += 1
        break
      case ActionType.STL:
        stats.steals += 1
        break
      case ActionType.BLK:
        stats.blocks += 1
        break
      case ActionType.TO:
        stats.turnovers += 1
        break
      case ActionType.FOUL:
        stats.fouls += 1
        break
    }
  })

  // Separate into home and away teams
  const homeStats: PlayerStats[] = []
  const awayStats: PlayerStats[] = []

  playerStatsMap.forEach(stats => {
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
