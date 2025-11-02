import { Hono } from 'hono'
import { prisma } from '@/lib/db'
import { GameEventSchema, BatchEventSchema } from '@/lib/validation'
import { authMiddleware } from '@/middleware/auth'
import { idempotencyMiddleware } from '@/middleware/idempotency'
import { broadcastGameEvent, broadcastGameHeader, broadcastBoxScore } from '@/lib/supabase'
import { calculateBoxScores } from '@/lib/boxscore'

const events = new Hono()

// POST /games/:gameId/events - Ingest game events (single or batch)
events.post('/:gameId/events', authMiddleware, idempotencyMiddleware, async (c) => {
  try {
    const gameId = c.req.param('gameId')
    const body = await c.req.json()
    
    // Handle both single event and batch
    const eventsToProcess = Array.isArray(body.events) 
      ? BatchEventSchema.parse(body).events
      : [GameEventSchema.parse({ ...body, gameId })]
    
    // Process events in transaction
    const result = await prisma.$transaction(async (tx) => {
      const createdEvents = []
      
      for (const eventData of eventsToProcess) {
        // Create event with server timestamp
        const event = await tx.gameEvent.create({
          data: eventData
        })
        createdEvents.push(event)
      }
      
      // Recalculate box scores after all events
      await calculateBoxScores(gameId, tx)
      
      // Update game scores if needed
      const gameUpdate = await updateGameScores(gameId, tx)
      
      return { events: createdEvents, gameUpdate }
    })
    
    // Broadcast events via Supabase Realtime
    for (const event of result.events) {
      await broadcastGameEvent(gameId, {
        type: 'event:new',
        payload: event
      })
    }
    
    // Broadcast game header update
    if (result.gameUpdate) {
      await broadcastGameHeader(gameId, {
        type: 'header:update',
        payload: result.gameUpdate
      })
    }

    // Broadcast updated box scores
    const teamBoxScores = await prisma.boxScoreTeam.findMany({
      where: { gameId }
    })
    
    if (teamBoxScores.length > 0) {
      await broadcastBoxScore(gameId, {
        type: 'boxscore:update',
        payload: {
          teamBoxScores,
          updatedAt: new Date().toISOString()
        }
      })
    }
    
    return c.json({ 
      success: true,
      events: result.events,
      count: result.events.length
    }, 201)
    
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return c.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, 400)
    }
    if (error.code === 'P2002') {
      return c.json({ 
        error: 'Duplicate event (idempotency key already used)' 
      }, 409)
    }
    return c.json({ error: 'Failed to process events' }, 500)
  }
})

// GET /games/:gameId/events - Get play-by-play events
events.get('/:gameId/events', async (c) => {
  try {
    const gameId = c.req.param('gameId')
    const period = c.req.query('period')
    const limit = c.req.query('limit')
    
    const where: any = { gameId }
    if (period) where.period = parseInt(period)
    
    const events = await prisma.gameEvent.findMany({
      where,
      orderBy: [
        { period: 'desc' },
        { clockSec: 'desc' },
        { tsServer: 'desc' }
      ],
      take: limit ? parseInt(limit) : undefined
    })
    
    return c.json({ events })
  } catch (error) {
    return c.json({ error: 'Failed to fetch events' }, 500)
  }
})

// Helper function to update game scores based on events
async function updateGameScores(gameId: string, tx: any) {
  const teamStats = await tx.boxScoreTeam.findMany({
    where: { gameId }
  })
  
  const ourTeam = teamStats.find((t: any) => t.teamSide === 'US')
  const oppTeam = teamStats.find((t: any) => t.teamSide === 'OPP')
  
  if (ourTeam || oppTeam) {
    const game = await tx.game.update({
      where: { id: gameId },
      data: {
        ourScore: ourTeam?.pts || 0,
        oppScore: oppTeam?.pts || 0
      }
    })
    
    return {
      ourScore: game.ourScore,
      oppScore: game.oppScore,
      period: game.period,
      clockSec: game.clockSec,
      status: game.status
    }
  }
  
  return null
}

export { events }