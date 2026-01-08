import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { authMiddleware } from '@/middleware/auth'
import { generateHebrewSummary } from '@/lib/generate-summary'
import { broadcastGameEvent, removeChannel } from '@/lib/supabase'

const CreateGameSchema = z.object({
  homeTeamId: z.string().uuid(),
  awayTeamId: z.string().uuid(),
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

export default games
