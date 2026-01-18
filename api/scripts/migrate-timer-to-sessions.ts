/**
 * Data Migration Script: Timer Fields → Clock Sessions
 *
 * This script migrates existing game timer data to the new clock session model.
 * Run once after deploying the clock session schema changes.
 *
 * Usage:
 *   cd api
 *   tsx scripts/migrate-timer-to-sessions.ts
 */

import { prisma } from '../src/lib/db'
import { ClockStatus } from '@prisma/client'

async function migrateTimerToSessions() {
  console.log('🚀 Starting timer-to-sessions migration...\n')

  try {
    // Fetch all games with their timer state
    const games = await prisma.game.findMany({
      select: {
        id: true,
        timerElapsedSeconds: true,
        timerIsRunning: true,
        timerLastUpdatedAt: true,
        clockSessions: {
          select: { id: true },
        },
      },
    })

    console.log(`📊 Found ${games.length} games to migrate\n`)

    let migratedCount = 0
    let skippedCount = 0

    for (const game of games) {
      // Skip if game already has clock sessions
      if (game.clockSessions.length > 0) {
        console.log(`⏭️  Skipping game ${game.id} - already has ${game.clockSessions.length} clock sessions`)
        skippedCount++
        continue
      }

      // Create PAUSED session at current timer value
      const systemTimestamp = game.timerLastUpdatedAt ?? new Date()

      await prisma.clockSession.create({
        data: {
          gameId: game.id,
          status: ClockStatus.PAUSED,
          secondsRemaining: game.timerElapsedSeconds,
          systemTimestamp,
        },
      })

      console.log(
        `✅ Created PAUSED session for game ${game.id} (${game.timerElapsedSeconds}s at ${systemTimestamp.toISOString()})`
      )

      // If timer was running, create RUNNING session as well
      if (game.timerIsRunning) {
        await prisma.clockSession.create({
          data: {
            gameId: game.id,
            status: ClockStatus.RUNNING,
            secondsRemaining: game.timerElapsedSeconds,
            systemTimestamp,
          },
        })

        console.log(
          `✅ Created RUNNING session for game ${game.id} (timer was running)`
        )
      }

      migratedCount++
    }

    console.log(`\n✨ Migration complete!`)
    console.log(`   - Migrated: ${migratedCount} games`)
    console.log(`   - Skipped: ${skippedCount} games (already had sessions)`)
    console.log(`   - Total: ${games.length} games\n`)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateTimerToSessions()
  .then(() => {
    console.log('🎉 All done!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('💥 Fatal error:', err)
    process.exit(1)
  })
