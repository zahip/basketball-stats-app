import { Hono } from 'hono'
import { prisma } from '@/lib/db'

const games = new Hono()

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

export default games
