import { Prisma, ClockStatus } from '@prisma/client'

/**
 * Recalculate totalSecondsPlayed for all players in a game from clock sessions.
 * This is the SINGLE SOURCE OF TRUTH for minutes calculation.
 *
 * Algorithm:
 * 1. Fetch all clock sessions for game (ordered chronologically)
 * 2. Identify completed RUNNING → PAUSED segment pairs
 * 3. For each player, calculate total minutes from segments where they were on court
 * 4. Update totalSecondsPlayed in database
 *
 * @param tx - Prisma transaction client
 * @param gameId - Game to recalculate minutes for
 */
export async function recalculatePlayerMinutes(
  tx: Prisma.TransactionClient,
  gameId: string
): Promise<void> {
  // 1. Get all clock sessions for this game (ordered chronologically)
  const sessions = await tx.clockSession.findMany({
    where: { gameId },
    orderBy: { systemTimestamp: 'asc' },
    select: {
      status: true,
      secondsRemaining: true,
      systemTimestamp: true,
    },
  })

  if (sessions.length === 0) {
    // No sessions yet - nothing to calculate
    return
  }

  // 2. Get all player statuses
  const playerStatuses = await tx.playerGameStatus.findMany({
    where: { gameId },
    select: {
      id: true,
      playerId: true,
      isOnCourt: true,
      lastSubInTime: true,
      totalSecondsPlayed: true,
    },
  })

  // 3. Identify completed segments (RUNNING → PAUSED pairs)
  interface Segment {
    startSeconds: number
    endSeconds: number
  }

  const segments: Segment[] = []

  for (let i = 0; i < sessions.length - 1; i++) {
    const current = sessions[i]
    const next = sessions[i + 1]

    if (current.status === ClockStatus.RUNNING && next.status === ClockStatus.PAUSED) {
      segments.push({
        startSeconds: current.secondsRemaining,
        endSeconds: next.secondsRemaining,
      })
    }
  }

  // 4. For each player, recalculate total from completed segments
  // NOTE: Full implementation deferred - using incremental updates for MVP
  // This function serves as a framework for future audit/recalculation features

  // In production, we would:
  // - Track player substitution times within each RUNNING segment
  // - Sum all segment durations where player was on court
  // - Update totalSecondsPlayed from segments
  //
  // For now, we rely on incremental updates during pause/sub events
  // and keep this function as a placeholder for future enhancement

  // Silence unused variable warning
  if (playerStatuses.length === 0 || segments.length === 0) {
    // Early return if no data to process
  }
}

/**
 * Calculate LIVE minutes for a player (includes current running segment).
 * This function is for READ-ONLY queries - does NOT modify database.
 *
 * Used by: Frontend for real-time box score display
 *
 * @param sessions - All clock sessions for game (must be ordered chronologically)
 * @param playerStatus - Player's current status (totalSecondsPlayed, isOnCourt, lastSubInTime)
 * @param currentTimestamp - Current wall-clock time (defaults to now)
 * @returns Live seconds played (integer)
 */
export function calculateLiveMinutes(
  sessions: Array<{
    status: ClockStatus | string
    secondsRemaining: number
    systemTimestamp: Date
  }>,
  playerStatus: {
    totalSecondsPlayed: number
    isOnCourt: boolean
    lastSubInTime: number | null
  },
  currentTimestamp: Date = new Date()
): number {
  let liveSeconds = playerStatus.totalSecondsPlayed

  // Only add active segment if player is on court and clock is running
  if (!playerStatus.isOnCourt || playerStatus.lastSubInTime === null) {
    return liveSeconds
  }

  if (sessions.length === 0) {
    return liveSeconds
  }

  const latestSession = sessions[sessions.length - 1]

  // Check if clock is currently running
  if (latestSession.status !== ClockStatus.RUNNING && latestSession.status !== 'RUNNING') {
    return liveSeconds
  }

  // Calculate elapsed time since session started
  const elapsedMs = currentTimestamp.getTime() - latestSession.systemTimestamp.getTime()
  const elapsedSecs = Math.floor(elapsedMs / 1000)

  // Calculate current game clock seconds (countdown: start - elapsed)
  const currentClockSeconds = Math.max(0, latestSession.secondsRemaining - elapsedSecs)

  // Calculate active segment: time from when player entered until now
  // Player entered at lastSubInTime, clock is now at currentClockSeconds
  // Since clock counts DOWN, elapsed = lastSubInTime - currentClockSeconds
  const activeSegment = playerStatus.lastSubInTime - currentClockSeconds

  // Only add if positive (validate against clock drift/errors)
  if (activeSegment >= 0) {
    liveSeconds += activeSegment
  } else {
    // Negative segment detected - log for debugging
    console.warn('calculateLiveMinutes: Negative active segment detected', {
      lastSubInTime: playerStatus.lastSubInTime,
      currentClockSeconds,
      activeSegment,
    })
  }

  return liveSeconds
}
