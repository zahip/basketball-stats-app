import type { Action, Player } from '@/types/game'

export interface PlayerScoringStats {
  playerId: string
  player: Player
  points: number
}

/**
 * Find the top scorer for a team from the actions array
 * @param actions - Array of game actions
 * @param teamId - ID of the team to find top scorer for
 * @returns PlayerScoringStats object with player info and points, or null if no scoring actions
 */
export function calculateTopScorer(
  actions: Action[],
  teamId: string
): PlayerScoringStats | null {
  // Filter actions for this team
  const teamActions = actions.filter(
    (action) => action.player.teamId === teamId
  )

  // Group by playerId and calculate points
  const playerPoints = new Map<string, number>()
  const playerMap = new Map<string, Player>()

  teamActions.forEach((action) => {
    const { playerId, player } = action

    // Store player object
    if (!playerMap.has(playerId)) {
      playerMap.set(playerId, player)
    }

    // Calculate points for this action
    let points = 0
    if (action.type === 'TWO_PT_MAKE') points = 2
    if (action.type === 'THREE_PT_MAKE') points = 3
    if (action.type === 'FT_MAKE') points = 1

    // Add to player's total
    if (points > 0) {
      playerPoints.set(playerId, (playerPoints.get(playerId) || 0) + points)
    }
  })

  // Find player with max points
  let topScorer: PlayerScoringStats | null = null
  let maxPoints = 0

  playerPoints.forEach((points, playerId) => {
    if (points > maxPoints) {
      maxPoints = points
      topScorer = {
        playerId,
        player: playerMap.get(playerId)!,
        points,
      }
    }
  })

  return topScorer
}
