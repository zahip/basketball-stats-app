import { Prisma } from '@prisma/client'

/**
 * Sync minutes played for all active players (isOnCourt=true).
 * Called on: timer pause, period transitions, substitutions.
 *
 * Algorithm:
 * 1. Find all PlayerGameStatus where isOnCourt=true
 * 2. For each player with lastSubInTime !== null:
 *    - playedSeconds = lastSubInTime - currentSecondsRemaining
 *    - Validate playedSeconds >= 0 (protect against clock drift)
 *    - totalSecondsPlayed += playedSeconds
 *    - Update lastSubInTime = currentSecondsRemaining (new snapshot)
 *
 * @param tx - Prisma transaction client
 * @param gameId - Game ID
 * @param currentSecondsRemaining - Current clock value (0-600)
 * @throws Never throws - logs errors and skips invalid updates
 */
export async function syncMinutesPlayed(
  tx: Prisma.TransactionClient,
  gameId: string,
  currentSecondsRemaining: number
): Promise<void> {
  console.log('[syncMinutesPlayed] START', { gameId, currentSecondsRemaining })

  // 1. Get all active players (on court)
  const activePlayers = await tx.playerGameStatus.findMany({
    where: {
      gameId,
      isOnCourt: true,
    },
    select: {
      id: true,
      playerId: true,
      totalSecondsPlayed: true,
      lastSubInTime: true,
    },
  })

  console.log('[syncMinutesPlayed] Found active players:', {
    count: activePlayers.length,
    players: activePlayers.map(p => ({
      playerId: p.playerId,
      lastSubInTime: p.lastSubInTime,
      totalSecondsPlayed: p.totalSecondsPlayed
    }))
  })

  // 2. Update players using raw SQL for better performance
  let updatedPlayerCount = 0

  // Build individual CASE statements for each player
  const caseStatements: string[] = []
  const playerIds: string[] = []

  for (const player of activePlayers) {
    // Skip players without entry time
    if (player.lastSubInTime === null) {
      console.log('[syncMinutesPlayed] Skipping player (no lastSubInTime):', player.playerId)
      continue
    }

    const playedSeconds = player.lastSubInTime - currentSecondsRemaining

    // Validate against negative segments (clock drift protection)
    if (playedSeconds < 0) {
      console.error('[syncMinutesPlayed] NEGATIVE_SEGMENT_DETECTED', {
        playerId: player.playerId,
        lastSubInTime: player.lastSubInTime,
        currentSecondsRemaining,
        playedSeconds,
      })
      continue // Skip this player
    }

    console.log('[syncMinutesPlayed] Preparing update for player:', {
      playerId: player.playerId,
      playedSeconds,
      oldTotal: player.totalSecondsPlayed,
      newTotal: player.totalSecondsPlayed + playedSeconds
    })

    // Add to bulk update
    caseStatements.push(
      `WHEN id = '${player.id}' THEN "totalSecondsPlayed" + ${playedSeconds}`
    )
    playerIds.push(`'${player.id}'`)
    updatedPlayerCount++
  }

  // Execute bulk update if there are players to update
  if (caseStatements.length > 0) {
    const updateQuery = `
      UPDATE "PlayerGameStatus"
      SET
        "totalSecondsPlayed" = CASE
          ${caseStatements.join('\n          ')}
        END,
        "lastSubInTime" = ${currentSecondsRemaining},
        "updatedAt" = NOW()
      WHERE id IN (${playerIds.join(', ')})
    `

    console.log('[syncMinutesPlayed] Executing bulk update for', updatedPlayerCount, 'players')
    await tx.$executeRawUnsafe(updateQuery)
    console.log('[syncMinutesPlayed] Bulk update completed successfully')
  } else {
    console.log('[syncMinutesPlayed] No players to update')
  }

  console.log('[syncMinutesPlayed] Synced minutes', {
    gameId,
    currentSecondsRemaining,
    activePlayerCount: activePlayers.length,
    updatedPlayerCount,
    timestamp: new Date().toISOString(),
  })
}
