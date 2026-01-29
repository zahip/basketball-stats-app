import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { authMiddleware } from '@/middleware/auth'
import { generateHebrewSummary } from '@/lib/generate-summary'
import { broadcastGameEvent, removeChannel } from '@/lib/supabase'
import { syncMinutesPlayed } from '@/lib/sync-minutes'
// NOTE: recalculatePlayerMinutes available for future use
// Currently using incremental minutes calculation during pause/sub events
// import { recalculatePlayerMinutes } from '@/lib/calculate-minutes'

const CreateGameSchema = z.object({
  homeTeamId: z.string().uuid(),
  awayTeamId: z.string().uuid(),
})

const SetStartersSchema = z.object({
  homeStarters: z.array(z.string().uuid()).length(5),
  awayStarters: z.array(z.string().uuid()).length(5),
})

const games = new Hono()

// GET / - List all games with teams
games.get('/', async (c) => {
  try {
    const games = await prisma.game.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        homeTeam: {
          select: { id: true, name: true, logoUrl: true },
        },
        awayTeam: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
    })
    return c.json({ games })
  } catch (error) {
    console.error('Error fetching games:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// POST / - Create a new game
games.post('/', authMiddleware, async (c) => {
  try {
    const body = await c.req.json()
    const validated = CreateGameSchema.safeParse(body)

    if (!validated.success) {
      return c.json({ error: 'Validation failed', details: validated.error.errors }, 400)
    }

    const { homeTeamId, awayTeamId } = validated.data

    if (homeTeamId === awayTeamId) {
      return c.json({ error: 'Home and away teams must be different' }, 400)
    }

    // Validate both teams exist
    const [homeTeam, awayTeam] = await Promise.all([
      prisma.team.findUnique({ where: { id: homeTeamId } }),
      prisma.team.findUnique({ where: { id: awayTeamId } }),
    ])

    if (!homeTeam || !awayTeam) {
      return c.json({ error: 'One or both teams not found' }, 404)
    }

    const game = await prisma.game.create({
      data: { homeTeamId, awayTeamId, status: 'SCHEDULED' },
      include: {
        homeTeam: { select: { id: true, name: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, logoUrl: true } },
      },
    })

    return c.json({ game }, 201)
  } catch (error) {
    console.error('Error creating game:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// GET /games/:id - Fetch game details with teams, players, and recent actions
games.get('/:id', async (c) => {
  try {
    const gameId = c.req.param('id')

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        homeTeam: {
          include: {
            players: {
              orderBy: { jerseyNumber: 'asc' },
            },
          },
        },
        awayTeam: {
          include: {
            players: {
              orderBy: { jerseyNumber: 'asc' },
            },
          },
        },
        actions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            player: true,
          },
        },
        playerStatuses: {
          include: {
            player: true,
          },
        },
        clockSessions: {
          orderBy: { systemTimestamp: 'asc' },
          take: 100, // Last 100 sessions (covers ~50 periods/resets)
        },
      },
    })

    if (!game) {
      return c.json({ error: 'Game not found' }, 404)
    }

    return c.json(game)
  } catch (error) {
    console.error('Error fetching game:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// POST /games/:id/finish - Finish game and generate Hebrew summary
games.post('/:id/finish', authMiddleware, async (c) => {
  try {
    const gameId = c.req.param('id')

    // STEP 1: Fetch game with all related data
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        homeTeam: true,
        awayTeam: true,
        actions: {
          orderBy: { createdAt: 'asc' },
          include: {
            player: true,
          },
        },
      },
    })

    if (!game) {
      return c.json({ error: 'Game not found' }, 404)
    }

    // STEP 2: Validate game is not already finished
    if (game.status === 'FINISHED') {
      return c.json(
        {
          error: 'Game is already finished. Summary cannot be regenerated.',
          gameId: game.id,
          status: game.status,
        },
        400
      )
    }

    // STEP 3: Generate Hebrew summary (may take 2-5 seconds)
    let summary: string
    try {
      summary = await generateHebrewSummary({
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        scoreHome: game.scoreHome,
        scoreAway: game.scoreAway,
        actions: game.actions,
      })
    } catch (summaryError) {
      console.error('Failed to generate summary:', summaryError)
      return c.json(
        {
          error: 'Failed to generate game summary',
          details: summaryError instanceof Error ? summaryError.message : 'Unknown error',
        },
        500
      )
    }

    // STEP 4: Update game in transaction (status + summary)
    const updatedGame = await prisma.$transaction(async (tx) => {
      return await tx.game.update({
        where: { id: gameId },
        data: {
          status: 'FINISHED',
          summary,
        },
        select: {
          id: true,
          status: true,
          scoreHome: true,
          scoreAway: true,
          summary: true,
          homeTeam: {
            select: { id: true, name: true },
          },
          awayTeam: {
            select: { id: true, name: true },
          },
        },
      })
    })

    // STEP 5: Broadcast GAME_FINISHED event (non-blocking)
    Promise.all([
      broadcastGameEvent(gameId, {
        type: 'GAME_FINISHED',
        game: {
          id: updatedGame.id,
          status: updatedGame.status,
          scoreHome: updatedGame.scoreHome,
          scoreAway: updatedGame.scoreAway,
        },
      }),
      // Clean up channel after game finishes
      removeChannel(gameId),
    ]).catch((err) => console.error('Broadcast error:', err))

    // STEP 6: Return minimal response with summary
    return c.json(
      {
        game: updatedGame,
        message: 'Game finished successfully',
      },
      200
    )
  } catch (error) {
    console.error('Error finishing game:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// POST /games/:id/starters - Set starting lineup for game
games.post('/:id/starters', authMiddleware, async (c) => {
  try {
    const gameId = c.req.param('id')
    const body = await c.req.json()
    const validated = SetStartersSchema.safeParse(body)

    if (!validated.success) {
      return c.json(
        {
          error: 'Validation failed',
          details: validated.error.errors,
        },
        400
      )
    }

    const { homeStarters, awayStarters } = validated.data

    // OPTIMIZATION: Fetch game and all players in parallel
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        homeTeamId: true,
        awayTeamId: true,
        status: true,
      },
    })

    if (!game) {
      return c.json({ error: 'Game not found' }, 404)
    }

    // Check if starters have already been set
    const existingStatuses = await prisma.playerGameStatus.findMany({
      where: { gameId },
      select: { id: true },
    })

    if (existingStatuses.length > 0) {
      return c.json(
        { error: 'Starters have already been set for this game' },
        400
      )
    }

    // Fetch all players for both teams
    const [allHomePlayers, allAwayPlayers] = await Promise.all([
      prisma.player.findMany({
        where: { teamId: game.homeTeamId },
        select: { id: true },
      }),
      prisma.player.findMany({
        where: { teamId: game.awayTeamId },
        select: { id: true },
      }),
    ])

    const homePlayerIds = allHomePlayers.map((p) => p.id)
    const awayPlayerIds = allAwayPlayers.map((p) => p.id)

    // Validate all selected starters belong to correct teams
    const invalidHomeStarters = homeStarters.filter(
      (id) => !homePlayerIds.includes(id)
    )
    const invalidAwayStarters = awayStarters.filter(
      (id) => !awayPlayerIds.includes(id)
    )

    if (invalidHomeStarters.length > 0 || invalidAwayStarters.length > 0) {
      return c.json(
        {
          error: 'Invalid starter selection',
          details: {
            invalidHomeStarters,
            invalidAwayStarters,
          },
        },
        400
      )
    }

    // Execute transaction: create PlayerGameStatus for all players
    await prisma.$transaction(async (tx) => {
      const statusData = [
        // Home team players
        ...homePlayerIds.map((playerId) => ({
          gameId,
          playerId,
          isOnCourt: homeStarters.includes(playerId),
          isStarter: homeStarters.includes(playerId),
        })),
        // Away team players
        ...awayPlayerIds.map((playerId) => ({
          gameId,
          playerId,
          isOnCourt: awayStarters.includes(playerId),
          isStarter: awayStarters.includes(playerId),
        })),
      ]

      await tx.playerGameStatus.createMany({
        data: statusData,
      })
    })

    // Broadcast starters set event (non-blocking)
    broadcastGameEvent(gameId, {
      type: 'STARTERS_SET',
      homeStarters,
      awayStarters,
    }).catch((err) => console.error('Broadcast error:', err))

    return c.json(
      {
        success: true,
        message: 'Starters set successfully',
        homeStarters,
        awayStarters,
      },
      201
    )
  } catch (error) {
    console.error('Error setting starters:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// POST /games/:id/timer/start - Start the game timer
games.post('/:id/timer/start', authMiddleware, async (c) => {
  try {
    const gameId = c.req.param('id')

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true },
    })

    if (!game) {
      return c.json({ error: 'Game not found' }, 404)
    }

    // Get latest session to validate and get current time + period
    const latestSession = await prisma.clockSession.findFirst({
      where: { gameId },
      orderBy: { systemTimestamp: 'desc' },
      select: { status: true, secondsRemaining: true, currentPeriod: true },
    })

    if (latestSession?.status === 'RUNNING') {
      return c.json({ error: 'Clock is already running' }, 400)
    }

    const currentSeconds = latestSession?.secondsRemaining ?? 600
    const currentPeriod = latestSession?.currentPeriod ?? 1

    // IMPORTANT: When clock starts, update lastSubInTime for all active players
    const session = await prisma.$transaction(async (tx) => {
      // Create RUNNING session
      const newSession = await tx.clockSession.create({
        data: {
          gameId,
          status: 'RUNNING',
          secondsRemaining: currentSeconds,
          currentPeriod, // Preserve current period
          systemTimestamp: new Date(),
        },
      })

      // Set lastSubInTime for all players currently on court
      await tx.playerGameStatus.updateMany({
        where: {
          gameId,
          isOnCourt: true,
        },
        data: {
          lastSubInTime: currentSeconds, // Snapshot entry time
        },
      })

      return newSession
    })

    const result = { session, game: null }

    // Broadcast timer start event (non-blocking)
    broadcastGameEvent(gameId, {
      type: 'TIMER_START',
      gameId,
      session: result.session,
    }).catch((err) => console.error('Broadcast error:', err))

    return c.json({ success: true, game: result.game, session: result.session }, 200)
  } catch (error) {
    console.error('Error starting timer:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return c.json({ error: errorMessage }, 500)
  }
})

// POST /games/:id/timer/pause - Pause the game timer
games.post('/:id/timer/pause', authMiddleware, async (c) => {
  try {
    const gameId = c.req.param('id')
    const body = await c.req.json()
    const { secondsRemaining } = body

    // Validate input
    if (typeof secondsRemaining !== 'number' || secondsRemaining < 0 || secondsRemaining > 600) {
      return c.json({ error: 'Invalid secondsRemaining value (must be 0-600)' }, 400)
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true },
    })

    if (!game) {
      return c.json({ error: 'Game not found' }, 404)
    }

    // Get latest session for currentPeriod
    const latestSession = await prisma.clockSession.findFirst({
      where: { gameId },
      orderBy: { systemTimestamp: 'desc' },
      select: { currentPeriod: true },
    })

    const currentPeriod = latestSession?.currentPeriod ?? 1

    // Transaction: Sync minutes THEN create PAUSED session
    const session = await prisma.$transaction(async (tx) => {
      // 1. Sync minutes for all active players
      console.log('[timer/pause] Calling syncMinutesPlayed', { gameId, secondsRemaining, currentPeriod })
      try {
        await syncMinutesPlayed(tx, gameId, secondsRemaining)
        console.log('[timer/pause] syncMinutesPlayed completed successfully')
      } catch (syncError) {
        console.error('[timer/pause] syncMinutesPlayed failed:', syncError)
        throw syncError
      }

      // 2. Create PAUSED session
      console.log('[timer/pause] Creating PAUSED ClockSession')
      return await tx.clockSession.create({
        data: {
          gameId,
          status: 'PAUSED',
          secondsRemaining,
          currentPeriod, // Preserve current period
          systemTimestamp: new Date(),
        },
      })
    })

    const result = { session, game: null }

    // Broadcast timer pause event (non-blocking)
    broadcastGameEvent(gameId, {
      type: 'TIMER_PAUSE',
      gameId,
      session: result.session,
    }).catch((err) => console.error('Broadcast error:', err))

    return c.json({ success: true, game: result.game, session: result.session }, 200)
  } catch (error) {
    console.error('Error pausing timer:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return c.json({
      error: 'Failed to pause timer',
      details: errorMessage,
    }, 500)
  }
})

// POST /games/:id/timer/reset - Reset the game timer to 10:00
games.post('/:id/timer/reset', authMiddleware, async (c) => {
  try {
    const gameId = c.req.param('id')

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true },
    })

    if (!game) {
      return c.json({ error: 'Game not found' }, 404)
    }

    // Get latest session for currentPeriod
    const latestSession = await prisma.clockSession.findFirst({
      where: { gameId },
      orderBy: { systemTimestamp: 'desc' },
      select: { currentPeriod: true },
    })

    const currentPeriod = latestSession?.currentPeriod ?? 1

    // Create PAUSED session at 10:00 (preserve current period)
    const session = await prisma.clockSession.create({
      data: {
        gameId,
        status: 'PAUSED',
        secondsRemaining: 600,
        currentPeriod, // PRESERVE current period
        systemTimestamp: new Date(),
      },
    })

    const result = { session, game: null }

    // Broadcast timer reset event (non-blocking)
    broadcastGameEvent(gameId, {
      type: 'TIMER_RESET',
      gameId,
      session: result.session,
    }).catch((err) => console.error('Broadcast error:', err))

    return c.json({ success: true, game: result.game, session: result.session }, 200)
  } catch (error) {
    console.error('Error resetting timer:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: errorMessage }, 500)
  }
})

// POST /games/:id/timer/next-period - Advance to next period
games.post('/:id/timer/next-period', authMiddleware, async (c) => {
  try {
    const gameId = c.req.param('id')

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true },
    })

    if (!game) {
      return c.json({ error: 'Game not found' }, 404)
    }

    // Get latest session to validate state
    const latestSession = await prisma.clockSession.findFirst({
      where: { gameId },
      orderBy: { systemTimestamp: 'desc' },
      select: { status: true, secondsRemaining: true, currentPeriod: true },
    })

    if (!latestSession) {
      return c.json({ error: 'No clock session found' }, 400)
    }

    // Validate: Can only advance period if timer is at 0:00 and paused
    if (latestSession.status === 'RUNNING') {
      return c.json({ error: 'Cannot advance period while timer is running' }, 400)
    }

    if (latestSession.secondsRemaining !== 0) {
      return c.json({
        error: 'Cannot advance period until timer reaches 0:00',
        currentSeconds: latestSession.secondsRemaining,
      }, 400)
    }

    const nextPeriod = latestSession.currentPeriod + 1

    // Transaction: Sync minutes (if any active), then create new period session
    const session = await prisma.$transaction(async (tx) => {
      // 1. Final sync for current period (in case pause didn't catch everything)
      await syncMinutesPlayed(tx, gameId, 0)

      // 2. Reset lastSubInTime to 600 for all active players (new period starts)
      await tx.playerGameStatus.updateMany({
        where: {
          gameId,
          isOnCourt: true,
        },
        data: {
          lastSubInTime: 600, // Reset snapshot for new period
        },
      })

      // 3. Create PAUSED session for new period at 10:00
      return await tx.clockSession.create({
        data: {
          gameId,
          status: 'PAUSED',
          secondsRemaining: 600, // Reset to 10:00
          currentPeriod: nextPeriod, // Increment period
          systemTimestamp: new Date(),
        },
      })
    })

    // Broadcast period change event (non-blocking)
    broadcastGameEvent(gameId, {
      type: 'PERIOD_CHANGE',
      gameId,
      session,
      newPeriod: nextPeriod,
    }).catch((err) => console.error('Broadcast error:', err))

    return c.json({
      success: true,
      session,
      message: `Advanced to period ${nextPeriod}`,
    }, 200)
  } catch (error) {
    console.error('Error advancing period:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: errorMessage }, 500)
  }
})

// POST /games/:id/timer/sync - Lightweight sync endpoint for page unload
games.post('/:id/timer/sync', async (c) => {
  try {
    const gameId = c.req.param('id')
    const { status, secondsRemaining, timestamp } = await c.req.json()

    // Validate input
    if (!status || typeof secondsRemaining !== 'number') {
      return c.json({ error: 'Invalid sync data' }, 400)
    }

    if (secondsRemaining < 0 || secondsRemaining > 600) {
      return c.json({ error: 'Invalid secondsRemaining value' }, 400)
    }

    // Create ClockSession without heavy validation (best-effort sync)
    const session = await prisma.clockSession.create({
      data: {
        gameId,
        status: status as 'RUNNING' | 'PAUSED',
        secondsRemaining,
        systemTimestamp: new Date(timestamp || Date.now())
      }
    })

    // Non-blocking broadcast
    broadcastGameEvent(gameId, {
      type: status === 'RUNNING' ? 'TIMER_START' : 'TIMER_PAUSE',
      gameId,
      session
    }).catch((err) => console.error('Broadcast error:', err))

    return c.json({ success: true })
  } catch (error) {
    console.error('Error syncing timer:', error)
    return c.json({ error: 'Sync failed' }, 500)
  }
})

export default games
