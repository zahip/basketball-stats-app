import { Hono } from 'hono'
import { prisma } from '@/lib/db'

const teams = new Hono()

// GET / - List all teams with player count
teams.get('/', async (c) => {
  try {
    const teams = await prisma.team.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        _count: { select: { players: true } },
      },
    })
    return c.json({ teams })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default teams
