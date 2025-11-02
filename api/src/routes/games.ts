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
    
    const game = await prisma.game.update({
      where: { id: gameId },
      data: validatedData,
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

export { games }