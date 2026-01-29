import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { broadcastGameEvent } from '@/lib/supabase'
import { syncMinutesPlayed } from '@/lib/sync-minutes'

const substitutions = new Hono()

// Zod schema for substitution
const SubstitutionSchema = z.object({
  gameId: z.string().uuid(),
  playerOutId: z.string().uuid(),
  playerInId: z.string().uuid(),
  quarter: z.number().int().min(1).max(4),
})

// POST /substitutions - Execute substitution (swap on-court/bench status)
substitutions.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const validated = SubstitutionSchema.safeParse(body)

    if (!validated.success) {
      return c.json(
        {
          error: 'Validation failed',
          details: validated.error.errors,
        },
        400
      )
    }

    const { gameId, playerOutId, playerInId, quarter } = validated.data

    // OPTIMIZATION: Validate game and both players in PARALLEL
    const [game, playerOut, playerIn, latestSession] = await Promise.all([
      prisma.game.findUnique({
        where: { id: gameId },
        select: {
          id: true,
          homeTeamId: true,
          awayTeamId: true,
        },
      }),
      prisma.player.findUnique({
        where: { id: playerOutId },
        select: {
          id: true,
          teamId: true,
          name: true,
          jerseyNumber: true,
          position: true,
        },
      }),
      prisma.player.findUnique({
        where: { id: playerInId },
        select: {
          id: true,
          teamId: true,
          name: true,
          jerseyNumber: true,
          position: true,
        },
      }),
      prisma.clockSession.findFirst({
        where: { gameId },
        orderBy: { systemTimestamp: 'desc' },
        select: {
          status: true,
          secondsRemaining: true,
          systemTimestamp: true,
        },
      }),
    ])

    if (!game) {
      return c.json({ error: 'Game not found' }, 404)
    }

    if (!playerOut) {
      return c.json({ error: 'Player (out) not found' }, 404)
    }

    if (!playerIn) {
      return c.json({ error: 'Player (in) not found' }, 404)
    }

    // Verify both players belong to the same team
    if (playerOut.teamId !== playerIn.teamId) {
      return c.json(
        { error: 'Players must be on the same team' },
        400
      )
    }

    // Verify team belongs to this game
    const isHomeTeam = playerOut.teamId === game.homeTeamId
    const isAwayTeam = playerOut.teamId === game.awayTeamId

    if (!isHomeTeam && !isAwayTeam) {
      return c.json(
        { error: 'Players do not belong to either team in this game' },
        400
      )
    }

    // Calculate current seconds from clock session
    let currentSeconds = latestSession?.secondsRemaining ?? 600
    const isClockRunning = latestSession?.status === 'RUNNING'

    if (isClockRunning && latestSession) {
      const elapsedMs = Date.now() - latestSession.systemTimestamp.getTime()
      currentSeconds = Math.max(0, latestSession.secondsRemaining - Math.floor(elapsedMs / 1000))
    }

    // Execute transaction: verify statuses, swap, and create actions
    const result = await prisma.$transaction(async (tx) => {
      // Verify playerOut is on court and playerIn is on bench
      const [statusOut, statusIn] = await Promise.all([
        tx.playerGameStatus.findUnique({
          where: {
            gameId_playerId: {
              gameId,
              playerId: playerOutId,
            },
          },
        }),
        tx.playerGameStatus.findUnique({
          where: {
            gameId_playerId: {
              gameId,
              playerId: playerInId,
            },
          },
        }),
      ])

      if (!statusOut || !statusIn) {
        throw new Error('Player game status not found. Starters may not be set.')
      }

      if (!statusOut.isOnCourt) {
        throw new Error('Player to substitute out is not on court')
      }

      if (statusIn.isOnCourt) {
        throw new Error('Player to substitute in is already on court')
      }

      // MINUTES LOGIC: Simplified with syncMinutesPlayed()
      if (isClockRunning) {
        // Clock running: Sync ALL active players, then perform swap

        // 1. Sync minutes for ALL active players (includes playerOut)
        await syncMinutesPlayed(tx, gameId, currentSeconds)

        // 2. Swap players
        await Promise.all([
          tx.playerGameStatus.update({
            where: {
              gameId_playerId: {
                gameId,
                playerId: playerOutId,
              },
            },
            data: {
              isOnCourt: false,
              lastSubInTime: null, // Player is now on bench
            },
          }),
          tx.playerGameStatus.update({
            where: {
              gameId_playerId: {
                gameId,
                playerId: playerInId,
              },
            },
            data: {
              isOnCourt: true,
              lastSubInTime: currentSeconds, // Set entry time for new player
            },
          }),
        ])
      } else {
        // Clock not running: Simple swap without minutes calculation
        await Promise.all([
          tx.playerGameStatus.update({
            where: {
              gameId_playerId: {
                gameId,
                playerId: playerOutId,
              },
            },
            data: { isOnCourt: false },
          }),
          tx.playerGameStatus.update({
            where: {
              gameId_playerId: {
                gameId,
                playerId: playerInId,
              },
            },
            data: { isOnCourt: true },
          }),
        ])
      }

      // Create SUB_OUT and SUB_IN actions with exact snapshot
      const [subOutAction, subInAction] = await Promise.all([
        tx.action.create({
          data: {
            gameId,
            playerId: playerOutId,
            type: 'SUB_OUT',
            quarter,
            elapsedSeconds: currentSeconds, // Exact snapshot from clock session
          },
        }),
        tx.action.create({
          data: {
            gameId,
            playerId: playerInId,
            type: 'SUB_IN',
            quarter,
            elapsedSeconds: currentSeconds, // Exact snapshot from clock session
          },
        }),
      ])

      return { subOutAction, subInAction }
    })

    // Construct response with player data
    const responseSubOut = {
      ...result.subOutAction,
      player: {
        id: playerOut.id,
        name: playerOut.name,
        jerseyNumber: playerOut.jerseyNumber,
        position: playerOut.position,
        teamId: playerOut.teamId,
      },
    }

    const responseSubIn = {
      ...result.subInAction,
      player: {
        id: playerIn.id,
        name: playerIn.name,
        jerseyNumber: playerIn.jerseyNumber,
        position: playerIn.position,
        teamId: playerIn.teamId,
      },
    }

    // Broadcast substitution events (non-blocking)
    Promise.all([
      broadcastGameEvent(gameId, {
        type: 'ACTION_CREATED',
        action: responseSubOut,
      }),
      broadcastGameEvent(gameId, {
        type: 'ACTION_CREATED',
        action: responseSubIn,
      }),
      broadcastGameEvent(gameId, {
        type: 'SUBSTITUTION',
        playerOut: {
          id: playerOutId,
          isOnCourt: false,
        },
        playerIn: {
          id: playerInId,
          isOnCourt: true,
        },
      }),
    ]).catch((err) => console.error('Broadcast error:', err))

    return c.json(
      {
        success: true,
        substitution: {
          playerOut: playerOut,
          playerIn: playerIn,
          actions: [responseSubOut, responseSubIn],
        },
      },
      201
    )
  } catch (error) {
    console.error('Error creating substitution:', error)

    // Return specific error messages for known errors
    if (error instanceof Error) {
      return c.json({ error: error.message }, 400)
    }

    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default substitutions
