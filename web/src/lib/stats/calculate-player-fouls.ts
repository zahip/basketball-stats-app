import type { Action } from '@/types/game'

/**
 * Calculate the number of fouls for a specific player
 * @param actions - Array of game actions
 * @param playerId - ID of the player to count fouls for
 * @returns Number of fouls committed by the player
 */
export function calculatePlayerFouls(
  actions: Action[],
  playerId: string
): number {
  return actions.filter(
    (action) => action.playerId === playerId && action.type === 'FOUL'
  ).length
}
