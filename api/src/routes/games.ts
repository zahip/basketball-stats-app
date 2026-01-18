import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { authMiddleware } from '@/middleware/auth'
import { generateHebrewSummary } from '@/lib/generate-summary'
import { broadcastGameEvent, removeChannel } from '@/lib/supabase'
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

    // TRANSACTION: Create RUNNING clock session + set lastSubInTime for on-court players
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get latest clock session (validate not already running)
      const latestSession = await tx.clockSession.findFirst({
        where: { gameId },
        orderBy: { systemTimestamp: 'desc' },
        select: { status: true, secondsRemaining: true },
      })

      if (latestSession?.status === 'RUNNING') {
        throw new Error('Clock is already running')
      }

      const currentSeconds = latestSession?.secondsRemaining ?? 600

      // 2. Create RUNNING session
      const session = await tx.clockSession.create({
        data: {
          gameId,
          status: 'RUNNING',
          secondsRemaining: currentSeconds,
          systemTimestamp: new Date(),
        },
      })

      // 3. Set lastSubInTime for on-court players (who don't have it set)
      await tx.playerGameStatus.updateMany({
        where: {
          gameId,
          isOnCourt: true,
          lastSubInTime: null,
        },
        data: {
          lastSubInTime: currentSeconds,
        },
      })

      // 4. Get game with teams for response
      const game = await tx.game.findUnique({
        where: { id: gameId },
        include: {
          homeTeam: { select: { id: true, name: true } },
          awayTeam: { select: { id: true, name: true } },
        },
      })

      return { session, game }
    })

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
    const { elapsedSeconds } = body

    if (typeof elapsedSeconds !== 'number' || elapsedSeconds < 0 || elapsedSeconds > 600) {
      return c.json({ error: 'Invalid elapsedSeconds value (must be 0-600)' }, 400)
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true },
    })

    if (!game) {
      return c.json({ error: 'Game not found' }, 404)
    }

    // TRANSACTION: Create PAUSED session + calculate minutes for on-court players
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get latest clock session (must be RUNNING)
      const latestSession = await tx.clockSession.findFirst({
        where: { gameId },
        orderBy: { systemTimestamp: 'desc' },
        select: { status: true, secondsRemaining: true, systemTimestamp: true },
      })

      if (!latestSession || latestSession.status !== 'RUNNING') {
        throw new Error('Clock is not running')
      }

      // 2. Calculate server-side current seconds
      const elapsedMs = Date.now() - latestSession.systemTimestamp.getTime()
      const currentSeconds = Math.max(0, latestSession.secondsRemaining - Math.floor(elapsedMs / 1000))

      // Optional: Log if client-server drift is significant
      if (Math.abs(currentSeconds - elapsedSeconds) > 2) {
        console.warn(`Clock drift detected: server=${currentSeconds}, client=${elapsedSeconds}`)
      }

      // 3. Create PAUSED session (use server calculation)
      const session = await tx.clockSession.create({
        data: {
          gameId,
          status: 'PAUSED',
          secondsRemaining: currentSeconds,
          systemTimestamp: new Date(),
        },
      })

      // 4. Calculate minutes for on-court players using old logic
      // (Full recalculatePlayerMinutes not implemented yet - using incremental approach)
      const onCourtPlayers = await tx.playerGameStatus.findMany({
        where: {
          gameId,
          isOnCourt: true,
          lastSubInTime: { not: null },
        },
        select: {
          id: true,
          playerId: true,
          lastSubInTime: true,
          totalSecondsPlayed: true,
        },
      })

      for (const player of onCourtPlayers) {
        const secondsPlayed = player.lastSubInTime! - currentSeconds

        if (secondsPlayed < 0) {
          console.error('NEGATIVE_SEGMENT_DETECTED', {
            playerId: player.playerId,
            lastSubInTime: player.lastSubInTime,
            currentSeconds,
            secondsPlayed,
          })
          continue // Skip this update
        }

        await tx.playerGameStatus.update({
          where: { id: player.id },
          data: {
            totalSecondsPlayed: player.totalSecondsPlayed + secondsPlayed,
            lastSubInTime: null,
          },
        })
      }

      // 5. Get game with teams for response
      const game = await tx.game.findUnique({
        where: { id: gameId },
        include: {
          homeTeam: { select: { id: true, name: true } },
          awayTeam: { select: { id: true, name: true } },
        },
      })

      return { session, game }
    })

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

    // TRANSACTION: Create PAUSED session at 600 + calculate minutes if running
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get latest clock session
      const latestSession = await tx.clockSession.findFirst({
        where: { gameId },
        orderBy: { systemTimestamp: 'desc' },
        select: { status: true, secondsRemaining: true, systemTimestamp: true },
      })

      // 2. If timer was running, calculate minutes for on-court players
      if (latestSession?.status === 'RUNNING') {
        const elapsedMs = Date.now() - latestSession.systemTimestamp.getTime()
        const currentSeconds = Math.max(0, latestSession.secondsRemaining - Math.floor(elapsedMs / 1000))

        const onCourtPlayers = await tx.playerGameStatus.findMany({
          where: {
            gameId,
            isOnCourt: true,
            lastSubInTime: { not: null },
          },
          select: {
            id: true,
            playerId: true,
            lastSubInTime: true,
            totalSecondsPlayed: true,
          },
        })

        for (const player of onCourtPlayers) {
          const secondsPlayed = player.lastSubInTime! - currentSeconds

          if (secondsPlayed < 0) {
            console.error('NEGATIVE_SEGMENT_DETECTED on reset', {
              playerId: player.playerId,
              lastSubInTime: player.lastSubInTime,
              currentSeconds,
              secondsPlayed,
            })
            continue
          }

          await tx.playerGameStatus.update({
            where: { id: player.id },
            data: {
              totalSecondsPlayed: player.totalSecondsPlayed + secondsPlayed,
              lastSubInTime: null,
            },
          })
        }
      } else {
        // Timer not running, just clear lastSubInTime
        await tx.playerGameStatus.updateMany({
          where: { gameId, isOnCourt: true },
          data: { lastSubInTime: null },
        })
      }

      // 3. Create PAUSED session at 10:00
      const session = await tx.clockSession.create({
        data: {
          gameId,
          status: 'PAUSED',
          secondsRemaining: 600,
          systemTimestamp: new Date(),
        },
      })

      // 4. Get game with teams for response
      const game = await tx.game.findUnique({
        where: { id: gameId },
        include: {
          homeTeam: { select: { id: true, name: true } },
          awayTeam: { select: { id: true, name: true } },
        },
      })

      return { session, game }
    })

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

export default games
