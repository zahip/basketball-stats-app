import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create a team
  const team = await prisma.team.upsert({
    where: { id: 'team_1' },
    update: {},
    create: {
      id: 'team_1',
      name: 'Lakers',
      season: '2024-25',
    },
  })

  console.log('✅ Created team:', team.name)

  // Create players
  const players = [
    { jersey: 1, firstName: 'John', lastName: 'Smith', position: 'PG' },
    { jersey: 2, firstName: 'Mike', lastName: 'Johnson', position: 'SG' },
    { jersey: 3, firstName: 'David', lastName: 'Brown', position: 'SF' },
    { jersey: 4, firstName: 'Chris', lastName: 'Davis', position: 'PF' },
    { jersey: 5, firstName: 'Alex', lastName: 'Wilson', position: 'C' },
    { jersey: 6, firstName: 'James', lastName: 'Miller', position: 'G' },
    { jersey: 7, firstName: 'Kevin', lastName: 'Garcia', position: 'F' },
    { jersey: 8, firstName: 'Ryan', lastName: 'Martinez', position: 'G' },
    { jersey: 9, firstName: 'Tyler', lastName: 'Anderson', position: 'F' },
    { jersey: 10, firstName: 'Brandon', lastName: 'Taylor', position: 'C' },
  ]

  for (const playerData of players) {
    await prisma.player.upsert({
      where: { 
        teamId_jersey: { 
          teamId: team.id, 
          jersey: playerData.jersey 
        } 
      },
      update: {},
      create: {
        teamId: team.id,
        ...playerData,
      },
    })
  }

  console.log('✅ Created players:', players.length)

  // Create a planned game
  const game = await prisma.game.upsert({
    where: { id: 'game_1' },
    update: {},
    create: {
      id: 'game_1',
      teamId: team.id,
      opponent: 'Warriors',
      date: new Date('2024-11-15T19:00:00Z'),
      venue: 'Home Court',
      status: 'PLANNED',
    },
  })

  console.log('✅ Created game:', `${team.name} vs ${game.opponent}`)

  // Create another game (live example)
  const liveGame = await prisma.game.upsert({
    where: { id: 'game_2' },
    update: {},
    create: {
      id: 'game_2',
      teamId: team.id,
      opponent: 'Celtics',
      date: new Date(),
      venue: 'Away Court',
      status: 'LIVE',
      period: 2,
      clockSec: 480, // 8:00 left in 2nd period
      ourScore: 42,
      oppScore: 38,
    },
  })

  console.log('✅ Created live game:', `${team.name} vs ${liveGame.opponent}`)

  // Create some sample events for the live game
  const sampleEvents = [
    {
      gameId: liveGame.id,
      period: 1,
      clockSec: 600,
      teamSide: 'US' as const,
      playerId: undefined,
      type: 'START_PERIOD' as const,
      ingestKey: 'start_p1',
    },
    {
      gameId: liveGame.id,
      period: 1,
      clockSec: 580,
      teamSide: 'US' as const,
      type: 'SHOT_2_MADE' as const,
      meta: { x: 15, y: 8 }, // Shot location
      ingestKey: 'shot_1',
    },
    {
      gameId: liveGame.id,
      period: 1,
      clockSec: 560,
      teamSide: 'OPP' as const,
      type: 'SHOT_3_MISS' as const,
      meta: { x: 25, y: 3 },
      ingestKey: 'shot_2',
    },
    {
      gameId: liveGame.id,
      period: 1,
      clockSec: 558,
      teamSide: 'US' as const,
      type: 'REB_D' as const,
      ingestKey: 'reb_1',
    },
  ]

  for (const eventData of sampleEvents) {
    await prisma.gameEvent.upsert({
      where: {
        gameId_ingestKey: {
          gameId: eventData.gameId,
          ingestKey: eventData.ingestKey,
        },
      },
      update: {},
      create: eventData,
    })
  }

  console.log('✅ Created sample events:', sampleEvents.length)

  // Initialize box scores for the live game
  const teamPlayers = await prisma.player.findMany({
    where: { teamId: team.id, active: true },
  })

  // Team box scores
  await prisma.boxScoreTeam.upsert({
    where: { gameId_teamSide: { gameId: liveGame.id, teamSide: 'US' } },
    update: {},
    create: {
      gameId: liveGame.id,
      teamSide: 'US',
      pts: 42,
      fgm2: 15,
      fga2: 28,
      fgm3: 4,
      fga3: 12,
      ftm: 8,
      fta: 10,
      oreb: 5,
      dreb: 18,
      ast: 12,
      stl: 3,
      blk: 2,
      tov: 8,
      pf: 6,
    },
  })

  await prisma.boxScoreTeam.upsert({
    where: { gameId_teamSide: { gameId: liveGame.id, teamSide: 'OPP' } },
    update: {},
    create: {
      gameId: liveGame.id,
      teamSide: 'OPP',
      pts: 38,
      fgm2: 12,
      fga2: 25,
      fgm3: 3,
      fga3: 15,
      ftm: 11,
      fta: 14,
      oreb: 3,
      dreb: 16,
      ast: 10,
      stl: 4,
      blk: 1,
      tov: 12,
      pf: 8,
    },
  })

  // Player box scores (sample for first 5 players)
  const samplePlayerStats = [
    { playerId: teamPlayers[0]?.id, pts: 12, fgm2: 4, fga2: 7, ast: 3, minutes: 18 },
    { playerId: teamPlayers[1]?.id, pts: 8, fgm2: 3, fga2: 5, fgm3: 1, fga3: 3, minutes: 16 },
    { playerId: teamPlayers[2]?.id, pts: 15, fgm2: 5, fga2: 8, fgm3: 2, fga3: 4, minutes: 20 },
    { playerId: teamPlayers[3]?.id, pts: 4, fgm2: 2, fga2: 4, oreb: 2, dreb: 4, minutes: 14 },
    { playerId: teamPlayers[4]?.id, pts: 6, fgm2: 3, fga2: 5, dreb: 6, blk: 2, minutes: 12 },
  ]

  for (const stats of samplePlayerStats) {
    if (stats.playerId) {
      await prisma.boxScorePlayer.upsert({
        where: { gameId_playerId: { gameId: liveGame.id, playerId: stats.playerId } },
        update: {},
        create: {
          gameId: liveGame.id,
          ...stats,
        },
      })
    }
  }

  console.log('✅ Created box scores')
  console.log('🌱 Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })