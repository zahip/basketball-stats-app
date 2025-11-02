import { EventType } from '@prisma/client'

// Pure function to calculate box score aggregations
export async function calculateBoxScores(gameId: string, tx: any) {
  // Get all events for the game
  const events = await tx.gameEvent.findMany({
    where: { gameId },
    orderBy: { tsServer: 'asc' }
  })

  // Initialize team stats
  const teamStats = {
    US: { pts: 0, fgm2: 0, fga2: 0, fgm3: 0, fga3: 0, ftm: 0, fta: 0, oreb: 0, dreb: 0, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0 },
    OPP: { pts: 0, fgm2: 0, fga2: 0, fgm3: 0, fga3: 0, ftm: 0, fta: 0, oreb: 0, dreb: 0, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0 }
  }

  // Initialize player stats map
  const playerStats = new Map<string, any>()

  // Process each event
  for (const event of events) {
    const team = teamStats[event.teamSide as keyof typeof teamStats]
    
    // Update team stats
    switch (event.type) {
      case EventType.SHOT_2_MADE:
        team.fgm2++
        team.fga2++
        team.pts += 2
        break
      case EventType.SHOT_2_MISS:
        team.fga2++
        break
      case EventType.SHOT_3_MADE:
        team.fgm3++
        team.fga3++
        team.pts += 3
        break
      case EventType.SHOT_3_MISS:
        team.fga3++
        break
      case EventType.FT_MADE:
        team.ftm++
        team.fta++
        team.pts += 1
        break
      case EventType.FT_MISS:
        team.fta++
        break
      case EventType.REB_O:
        team.oreb++
        break
      case EventType.REB_D:
        team.dreb++
        break
      case EventType.AST:
        team.ast++
        break
      case EventType.STL:
        team.stl++
        break
      case EventType.BLK:
        team.blk++
        break
      case EventType.TOV:
        team.tov++
        break
      case EventType.FOUL:
        team.pf++
        break
    }

    // Update player stats if playerId is present
    if (event.playerId && event.teamSide === 'US') {
      if (!playerStats.has(event.playerId)) {
        playerStats.set(event.playerId, {
          gameId,
          playerId: event.playerId,
          minutes: 0, // TODO: Calculate from SUB events
          pts: 0,
          fgm2: 0, fga2: 0, fgm3: 0, fga3: 0, ftm: 0, fta: 0,
          oreb: 0, dreb: 0, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0,
          plusMinus: 0 // TODO: Calculate +/-
        })
      }

      const player = playerStats.get(event.playerId)
      
      switch (event.type) {
        case EventType.SHOT_2_MADE:
          player.fgm2++
          player.fga2++
          player.pts += 2
          break
        case EventType.SHOT_2_MISS:
          player.fga2++
          break
        case EventType.SHOT_3_MADE:
          player.fgm3++
          player.fga3++
          player.pts += 3
          break
        case EventType.SHOT_3_MISS:
          player.fga3++
          break
        case EventType.FT_MADE:
          player.ftm++
          player.fta++
          player.pts += 1
          break
        case EventType.FT_MISS:
          player.fta++
          break
        case EventType.REB_O:
          player.oreb++
          break
        case EventType.REB_D:
          player.dreb++
          break
        case EventType.AST:
          player.ast++
          break
        case EventType.STL:
          player.stl++
          break
        case EventType.BLK:
          player.blk++
          break
        case EventType.TOV:
          player.tov++
          break
        case EventType.FOUL:
          player.pf++
          break
      }
    }
  }

  // Upsert team box scores
  for (const [teamSide, stats] of Object.entries(teamStats)) {
    await tx.boxScoreTeam.upsert({
      where: { gameId_teamSide: { gameId, teamSide } },
      update: stats,
      create: { gameId, teamSide, ...stats }
    })
  }

  // Upsert player box scores
  for (const [playerId, stats] of playerStats) {
    await tx.boxScorePlayer.upsert({
      where: { gameId_playerId: { gameId, playerId } },
      update: stats,
      create: stats
    })
  }
}

// Basketball advanced stats calculations
export function calculateAdvancedStats(boxScore: any) {
  const fgm = boxScore.fgm2 + boxScore.fgm3
  const fga = boxScore.fga2 + boxScore.fga3
  const reb = boxScore.oreb + boxScore.dreb

  return {
    // Effective Field Goal %
    eFG: fga > 0 ? ((fgm + 0.5 * boxScore.fgm3) / fga) * 100 : 0,
    
    // True Shooting %
    tsPercent: fga > 0 ? (boxScore.pts / (2 * (fga + 0.44 * boxScore.fta))) * 100 : 0,
    
    // Field Goal %
    fgPercent: fga > 0 ? (fgm / fga) * 100 : 0,
    
    // Three Point %
    threePercent: boxScore.fga3 > 0 ? (boxScore.fgm3 / boxScore.fga3) * 100 : 0,
    
    // Free Throw %
    ftPercent: boxScore.fta > 0 ? (boxScore.ftm / boxScore.fta) * 100 : 0,
    
    // Total rebounds
    totalReb: reb,
    
    // Assist to turnover ratio
    astToRatio: boxScore.tov > 0 ? boxScore.ast / boxScore.tov : boxScore.ast
  }
}