import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const actions = new Hono()

// Zod schema for action creation
const CreateActionSchema = z.object({
  gameId: z.string().uuid(),
  playerId: z.string().uuid(),
  type: z.enum([
    'TWO_PT_MAKE',
    'TWO_PT_MISS',
    'THREE_PT_MAKE',
    'THREE_PT_MISS',
    'REB',
    'AST',
    'STL',
    'BLK',
    'FOUL',
    'TO',
  ]),
  quarter: z.number().int().min(1).max(4),
})

// POST /actions - Create action and update score
actions.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const validated = CreateActionSchema.safeParse(body)

    if (!validated.success) {
      return c.json(
        {
          error: 'Validation failed',
          details: validated.error.errors,
        },
        400
      )
    }

    const { gameId, playerId, type, quarter } = validated.data

    // Verify game exists
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    })

    if (!game) {
      return c.json({ error: 'Game not found' }, 404)
    }

    // Verify player exists and get their team
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    })

    if (!player) {
      return c.json({ error: 'Player not found' }, 404)
    }

    // Verify player belongs to one of the teams in this game
    const isHomeTeam = player.teamId === game.homeTeamId
    const isAwayTeam = player.teamId === game.awayTeamId

    if (!isHomeTeam && !isAwayTeam) {
      return c.json(
        { error: 'Player does not belong to either team in this game' },
        400
      )
    }

    // Calculate points for scoring actions
    const points =
      type === 'THREE_PT_MAKE' ? 3 : type === 'TWO_PT_MAKE' ? 2 : 0

    // Execute transaction: create action and update score if applicable
    const result = await prisma.$transaction(async (tx) => {
      // Step A: Create the action
      const action = await tx.action.create({
        data: {
          gameId,
          playerId,
          type,
          quarter,
        },
        include: {
          player: true,
        },
      })

      // Step B: Update score if it's a scoring action
      let updatedGame = game
      if (points > 0) {
        updatedGame = await tx.game.update({
          where: { id: gameId },
          data: isHomeTeam
            ? { scoreHome: { increment: points } }
            : { scoreAway: { increment: points } },
        })
      }

      return { action, game: updatedGame }
    })

    // Fetch full game state to return
    const fullGameState = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        homeTeam: {
          include: { players: true },
        },
        awayTeam: {
          include: { players: true },
        },
        actions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { player: true },
        },
      },
    })

    return c.json(
      {
        action: result.action,
        game: fullGameState,
      },
      201
    )
  } catch (error) {
    console.error('Error creating action:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default actions
