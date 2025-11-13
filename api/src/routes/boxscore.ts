import { Hono } from 'hono'
import { prisma } from '@/lib/db'
import { calculateAdvancedStats } from '@/lib/boxscore'
// import { broadcastBoxScore } from '@/lib/supabase'  // TODO: implement broadcasting

const boxscore = new Hono()

// GET /games/:gameId/boxscore/team - Get team box scores
boxscore.get('/:gameId/boxscore/team', async (c) => {
  try {
    const gameId = c.req.param('gameId')
    
    const teamBoxScores = await prisma.boxScoreTeam.findMany({
      where: { gameId }
    })
    
    // Calculate advanced stats for each team
    const enrichedBoxScores = teamBoxScores.map(boxScore => ({
      ...boxScore,
      advanced: calculateAdvancedStats(boxScore)
    }))
    
    return c.json({ 
      teamBoxScores: enrichedBoxScores,
      gameId 
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch team box scores' }, 500)
  }
})

// GET /games/:gameId/boxscore/players - Get player box scores
boxscore.get('/:gameId/boxscore/players', async (c) => {
  try {
    const gameId = c.req.param('gameId')
    
    const playerBoxScores = await prisma.boxScorePlayer.findMany({
      where: { gameId }
    })
    
    // Get player details
    const playerIds = playerBoxScores.map(p => p.playerId)
    const players = await prisma.player.findMany({
      where: { id: { in: playerIds } }
    })
    
    // Merge player data with box scores
    const enrichedBoxScores = playerBoxScores.map(boxScore => {
      const player = players.find(p => p.id === boxScore.playerId)
      return {
        ...boxScore,
        player: player ? {
          firstName: player.firstName,
          lastName: player.lastName,
          jersey: player.jersey,
          position: player.position,
          avatarUrl: player.avatarUrl
        } : null,
        advanced: calculateAdvancedStats(boxScore)
      }
    })
    
    // Sort by jersey number
    enrichedBoxScores.sort((a, b) => (a.player?.jersey || 0) - (b.player?.jersey || 0))
    
    return c.json({ 
      playerBoxScores: enrichedBoxScores,
      gameId 
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch player box scores' }, 500)
  }
})

// GET /games/:gameId/boxscore - Get complete box score (team + players)
boxscore.get('/:gameId/boxscore', async (c) => {
  try {
    const gameId = c.req.param('gameId')
    
    // Get both team and player box scores
    const [teamBoxScores, playerBoxScores, game] = await Promise.all([
      prisma.boxScoreTeam.findMany({ where: { gameId } }),
      prisma.boxScorePlayer.findMany({ where: { gameId } }),
      prisma.game.findUnique({ 
        where: { id: gameId },
        include: { team: true }
      })
    ])
    
    if (!game) {
      return c.json({ error: 'Game not found' }, 404)
    }
    
    // Get player details
    const playerIds = playerBoxScores.map(p => p.playerId)
    const players = await prisma.player.findMany({
      where: { id: { in: playerIds } }
    })
    
    // Enrich data with advanced stats
    const enrichedTeamBoxScores = teamBoxScores.map(boxScore => ({
      ...boxScore,
      advanced: calculateAdvancedStats(boxScore)
    }))
    
    const enrichedPlayerBoxScores = playerBoxScores.map(boxScore => {
      const player = players.find(p => p.id === boxScore.playerId)
      return {
        ...boxScore,
        player: player ? {
          firstName: player.firstName,
          lastName: player.lastName,
          jersey: player.jersey,
          position: player.position,
          avatarUrl: player.avatarUrl
        } : null,
        advanced: calculateAdvancedStats(boxScore)
      }
    })
    
    const result = {
      game: {
        id: game.id,
        opponent: game.opponent,
        date: game.date,
        status: game.status,
        period: game.period,
        clockSec: game.clockSec,
        ourScore: game.ourScore,
        oppScore: game.oppScore,
        team: game.team
      },
      teamBoxScores: enrichedTeamBoxScores,
      playerBoxScores: enrichedPlayerBoxScores.sort((a, b) => (a.player?.jersey || 0) - (b.player?.jersey || 0))
    }
    
    return c.json(result)
  } catch (error) {
    return c.json({ error: 'Failed to fetch complete box score' }, 500)
  }
})

// GET /games/:gameId/boxscore/summary - Get four factors summary
boxscore.get('/:gameId/boxscore/summary', async (c) => {
  try {
    const gameId = c.req.param('gameId')
    
    const teamBoxScores = await prisma.boxScoreTeam.findMany({
      where: { gameId }
    })
    
    const ourTeam = teamBoxScores.find(t => t.teamSide === 'US')
    const oppTeam = teamBoxScores.find(t => t.teamSide === 'OPP')
    
    if (!ourTeam || !oppTeam) {
      return c.json({ error: 'Box scores not found' }, 404)
    }
    
    const ourAdvanced = calculateAdvancedStats(ourTeam)
    const oppAdvanced = calculateAdvancedStats(oppTeam)
    
    // Four Factors analysis
    const fourFactors = {
      us: {
        eFG: ourAdvanced.eFG,
        turnoverRate: ourTeam.tov / (ourTeam.fga2 + ourTeam.fga3 + 0.44 * ourTeam.fta + ourTeam.tov) * 100,
        offensiveReboundingRate: ourTeam.oreb / (ourTeam.oreb + oppTeam.dreb) * 100,
        freeThrowRate: ourTeam.ftm / (ourTeam.fga2 + ourTeam.fga3) * 100
      },
      opp: {
        eFG: oppAdvanced.eFG,
        turnoverRate: oppTeam.tov / (oppTeam.fga2 + oppTeam.fga3 + 0.44 * oppTeam.fta + oppTeam.tov) * 100,
        offensiveReboundingRate: oppTeam.oreb / (oppTeam.oreb + ourTeam.dreb) * 100,
        freeThrowRate: oppTeam.ftm / (oppTeam.fga2 + oppTeam.fga3) * 100
      }
    }
    
    return c.json({ 
      fourFactors,
      ourTeam: { ...ourTeam, advanced: ourAdvanced },
      oppTeam: { ...oppTeam, advanced: oppAdvanced }
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch box score summary' }, 500)
  }
})

export { boxscore }