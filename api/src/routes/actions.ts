import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { broadcastGameEvent, broadcastGameHeader } from '@/lib/supabase'

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
    'FT_MAKE',
    'FT_MISS',
    'REB',
    'AST',
    'STL',
    'BLK',
    'FOUL',
    'TO',
  ]),
  quarter: z.number().int().min(1).max(4),
})

// POST /actions - Create action and update score (OPTIMIZED)
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

    // OPTIMIZATION: Validate game and player in PARALLEL (saves ~500ms)
    const [game, player] = await Promise.all([
      prisma.game.findUnique({
        where: { id: gameId },
        select: {
          id: true,
          homeTeamId: true,
          awayTeamId: true,
          scoreHome: true,
          scoreAway: true,
        },
      }),
      prisma.player.findUnique({
        where: { id: playerId },
        select: {
          id: true,
          teamId: true,
          name: true,
          jerseyNumber: true,
          position: true,
        },
      }),
    ])

    if (!game) {
      return c.json({ error: 'Game not found' }, 404)
    }

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

    // Check if player is on court (only if starters have been set)
    const playerStatus = await prisma.playerGameStatus.findUnique({
      where: {
        gameId_playerId: {
          gameId,
          playerId,
        },
      },
    })

    // If playerStatus exists, validate player is on court
    if (playerStatus && !playerStatus.isOnCourt) {
      return c.json(
        { error: 'Player is not on court. Cannot record action for bench players.' },
        400
      )
    }

    // Calculate points for scoring actions
    const points =
      type === 'THREE_PT_MAKE' ? 3 : type === 'TWO_PT_MAKE' ? 2 : type === 'FT_MAKE' ? 1 : 0

    // Execute transaction: create action and update score if applicable
    const result = await prisma.$transaction(async (tx) => {
      // Create the action
      const action = await tx.action.create({
        data: {
          gameId,
          playerId,
          type,
          quarter,
        },
      })

      // Update score if it's a scoring action
      let updatedGame = game
      if (points > 0) {
        updatedGame = await tx.game.update({
          where: { id: gameId },
          data: isHomeTeam
            ? { scoreHome: { increment: points } }
            : { scoreAway: { increment: points } },
          select: {
            id: true,
            scoreHome: true,
            scoreAway: true,
            homeTeamId: true,
            awayTeamId: true,
          },
        })
      }

      return { action, game: updatedGame }
    })

    // OPTIMIZATION: Return minimal response with constructed action
    // Frontend already has optimistic data, doesn't need full game state
    const responseAction = {
      ...result.action,
      player: {
        id: player.id,
        name: player.name,
        jerseyNumber: player.jerseyNumber,
        position: player.position,
        teamId: player.teamId,
      },
    }

    // Construct minimal game response (frontend has teams/players already)
    const responseGame = {
      id: result.game.id,
      scoreHome: result.game.scoreHome,
      scoreAway: result.game.scoreAway,
      homeTeamId: result.game.homeTeamId,
      awayTeamId: result.game.awayTeamId,
    }

    // Broadcast to other devices via Supabase Realtime (non-blocking)
    Promise.all([
      broadcastGameEvent(gameId, {
        type: 'ACTION_CREATED',
        action: responseAction,
      }),
      broadcastGameHeader(gameId, {
        scoreHome: responseGame.scoreHome,
        scoreAway: responseGame.scoreAway,
      }),
    ]).catch((err) => console.error('Broadcast error:', err))

    return c.json(
      {
        action: responseAction,
        game: responseGame,
      },
      201
    )
  } catch (error) {
    console.error('Error creating action:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default actions
