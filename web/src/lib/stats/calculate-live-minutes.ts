import type { ClockSession, PlayerGameStatus } from '@/types/game'

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
  sessions: ClockSession[],
  playerStatus: PlayerGameStatus,
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
  if (latestSession.status !== 'RUNNING') {
    return liveSeconds
  }

  // Calculate elapsed time since session started
  const elapsedMs = currentTimestamp.getTime() - new Date(latestSession.systemTimestamp).getTime()
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
      playerId: playerStatus.playerId,
      lastSubInTime: playerStatus.lastSubInTime,
      currentClockSeconds,
      activeSegment,
    })
  }

  return liveSeconds
}

/**
 * Format seconds to MM:SS display format
 * @param seconds - Total seconds
 * @returns Formatted string (e.g., "12:34" or "08:05")
 */
export function formatMinutes(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
