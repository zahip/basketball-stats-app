import { Hono } from 'hono'
import { prisma } from '@/lib/db'
import { CreateGameSchema, UpdateGameSchema } from '@/lib/validation'
import { authMiddleware } from '@/middleware/auth'

const games = new Hono()

// POST /games - Create a new game
games.post('/', authMiddleware, async (c) => {
  try {
    const body = await c.req.json()
    const validatedData = CreateGameSchema.parse(body)
    
    const game = await prisma.game.create({
      data: {
        ...validatedData,
        date: new Date(validatedData.date)
      },
      include: {
        team: true
      }
    })
    
    return c.json({ game }, 201)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return c.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, 400)
    }
    return c.json({ error: 'Failed to create game' }, 500)
  }
})

// GET /games/:gameId - Get game details
games.get('/:gameId', async (c) => {
  try {
    const gameId = c.req.param('gameId')
    
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        team: true,
        _count: {
          select: { events: true }
        }
      }
    })
    
    if (!game) {
      return c.json({ error: 'Game not found' }, 404)
    }
    
    return c.json({ game })
  } catch (error) {
    return c.json({ error: 'Failed to fetch game' }, 500)
  }
})

// PATCH /games/:gameId - Update game state (score, period, clock, status)
games.patch('/:gameId', authMiddleware, async (c) => {
  try {
    const gameId = c.req.param('gameId')
    const body = await c.req.json()
    const validatedData = UpdateGameSchema.parse(body)

    // Build update data, handling atomic increments
    const updateData: any = {
      ...(validatedData.status && { status: validatedData.status }),
      ...(validatedData.period !== undefined && { period: validatedData.period }),
      ...(validatedData.clockSec !== undefined && { clockSec: validatedData.clockSec }),
    }

    // Handle score updates
    if (validatedData.ourScore !== undefined) {
      updateData.ourScore = validatedData.ourScore
    } else if (validatedData.incrementOurScore !== undefined) {
      // Use atomic increment to prevent race conditions
      updateData.ourScore = { increment: validatedData.incrementOurScore }
    }

    if (validatedData.oppScore !== undefined) {
      updateData.oppScore = validatedData.oppScore
    } else if (validatedData.incrementOppScore !== undefined) {
      // Use atomic increment to prevent race conditions
      updateData.oppScore = { increment: validatedData.incrementOppScore }
    }

    const game = await prisma.game.update({
      where: { id: gameId },
      data: updateData,
      include: {
        team: true
      }
    })

    return c.json({ game })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return c.json({
        error: 'Validation failed',
        details: error.errors
      }, 400)
    }
    if (error.code === 'P2025') {
      return c.json({ error: 'Game not found' }, 404)
    }
    return c.json({ error: 'Failed to update game' }, 500)
  }
})

// GET /games - List games for a team
games.get('/', async (c) => {
  try {
    const teamId = c.req.query('teamId')
    const status = c.req.query('status')

    const where: any = {}
    if (teamId) where.teamId = teamId
    if (status) where.status = status.toUpperCase()

    const games = await prisma.game.findMany({
      where,
      include: {
        team: true,
        _count: {
          select: { events: true }
        }
      },
      orderBy: { date: 'desc' }
    })

    return c.json({ games })
  } catch (error) {
    return c.json({ error: 'Failed to fetch games' }, 500)
  }
})

// GET /games/:gameId/court - Get current players on court
games.get('/:gameId/court', async (c) => {
  try {
    const gameId = c.req.param('gameId')

    // Get all player box scores with court status
    const playerBoxScores = await prisma.boxScorePlayer.findMany({
      where: {
        gameId,
        onCourt: true // Only get players currently on court
      },
      select: {
        playerId: true,
        onCourt: true,
        lastSubTime: true,
        secondsPlayed: true
      }
    })

    // Get player details for enrichment
    const playerIds = playerBoxScores.map(p => p.playerId)
    const players = await prisma.player.findMany({
      where: { id: { in: playerIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        jersey: true,
        position: true,
        avatarUrl: true
      }
    })

    // Merge player data
    const playersOnCourt = playerBoxScores.map(boxScore => {
      const player = players.find(p => p.id === boxScore.playerId)
      return {
        ...boxScore,
        minutes: Math.floor(boxScore.secondsPlayed / 60),
        player: player || null
      }
    })

    // Sort by jersey number
    playersOnCourt.sort((a, b) => (a.player?.jersey || 0) - (b.player?.jersey || 0))

    return c.json({
      gameId,
      playersOnCourt,
      count: playersOnCourt.length
    })
  } catch (error) {
    console.error('Failed to fetch players on court:', error)
    return c.json({ error: 'Failed to fetch players on court' }, 500)
  }
})

export { games }