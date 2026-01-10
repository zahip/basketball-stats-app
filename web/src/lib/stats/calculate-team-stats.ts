import type { Action } from '@/types/game'

export interface TeamStats {
  rebounds: number
  assists: number
  fieldGoalsMade: number
  fieldGoalsAttempted: number
  fieldGoalPercentage: number
  points: number
}

/**
 * Calculate team statistics from actions array
 * @param actions - Array of game actions
 * @param teamId - ID of the team to calculate stats for
 * @returns TeamStats object with rebounds, assists, FG%, and points
 */
export function calculateTeamStats(
  actions: Action[],
  teamId: string
): TeamStats {
  // Filter actions for this team
  const teamActions = actions.filter(
    (action) => action.player.teamId === teamId
  )

  // Count rebounds (all REB actions)
  const rebounds = teamActions.filter((action) => action.type === 'REB').length

  // Count assists (all AST actions)
  const assists = teamActions.filter((action) => action.type === 'AST').length

  // Calculate field goals (excludes free throws)
  const fgMakes = teamActions.filter((action) =>
    ['TWO_PT_MAKE', 'THREE_PT_MAKE'].includes(action.type)
  ).length

  const fgAttempts = teamActions.filter((action) =>
    ['TWO_PT_MAKE', 'TWO_PT_MISS', 'THREE_PT_MAKE', 'THREE_PT_MISS'].includes(
      action.type
    )
  ).length

  // Calculate FG percentage (avoid division by zero)
  const fgPercentage =
    fgAttempts > 0 ? Math.round((fgMakes / fgAttempts) * 100) : 0

  // Calculate total points
  const points = teamActions.reduce((sum, action) => {
    if (action.type === 'TWO_PT_MAKE') return sum + 2
    if (action.type === 'THREE_PT_MAKE') return sum + 3
    if (action.type === 'FT_MAKE') return sum + 1
    return sum
  }, 0)

  return {
    rebounds,
    assists,
    fieldGoalsMade: fgMakes,
    fieldGoalsAttempted: fgAttempts,
    fieldGoalPercentage: fgPercentage,
    points,
  }
}
