import { Hono } from 'hono'
import { prisma } from '@/lib/db'
import { CreatePlayerSchema } from '@/lib/validation'
import { authMiddleware } from '@/middleware/auth'

const teams = new Hono()

// GET /teams - Get all teams
teams.get('/', async (c) => {
  try {
    const allTeams = await prisma.team.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { players: true, games: true }
        }
      }
    })

    return c.json({ teams: allTeams })
  } catch (error) {
    return c.json({ error: 'Failed to fetch teams' }, 500)
  }
})

// GET /teams/:teamId/players - Get all players for a team
teams.get('/:teamId/players', async (c) => {
  try {
    const teamId = c.req.param('teamId')
    
    const players = await prisma.player.findMany({
      where: { 
        teamId,
        active: true 
      },
      orderBy: { jersey: 'asc' }
    })
    
    return c.json({ players })
  } catch (error) {
    return c.json({ error: 'Failed to fetch players' }, 500)
  }
})

// POST /teams/:teamId/players - Create a new player
teams.post('/:teamId/players', authMiddleware, async (c) => {
  try {
    const teamId = c.req.param('teamId')
    const body = await c.req.json()
    
    const validatedData = CreatePlayerSchema.parse({
      ...body,
      teamId
    })
    
    // Check if jersey number is already taken
    const existingPlayer = await prisma.player.findUnique({
      where: {
        teamId_jersey: {
          teamId,
          jersey: validatedData.jersey
        }
      }
    })
    
    if (existingPlayer) {
      return c.json({ 
        error: `Jersey #${validatedData.jersey} is already taken` 
      }, 400)
    }
    
    const player = await prisma.player.create({
      data: validatedData
    })
    
    return c.json({ player }, 201)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return c.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, 400)
    }
    return c.json({ error: 'Failed to create player' }, 500)
  }
})

// GET /teams/:teamId - Get team details with players
teams.get('/:teamId', async (c) => {
  try {
    const teamId = c.req.param('teamId')
    
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        players: {
          where: { active: true },
          orderBy: { jersey: 'asc' }
        },
        _count: {
          select: { games: true }
        }
      }
    })
    
    if (!team) {
      return c.json({ error: 'Team not found' }, 404)
    }
    
    return c.json({ team })
  } catch (error) {
    return c.json({ error: 'Failed to fetch team' }, 500)
  }
})

export { teams }