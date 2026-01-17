import { PrismaClient, Position } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🏀 Seeding basketball stats database...')

  // Clear existing data in correct order (respect FK constraints)
  console.log('Clearing existing data...')
  await prisma.action.deleteMany()
  await prisma.game.deleteMany()
  await prisma.player.deleteMany()
  await prisma.team.deleteMany()

  // Create Los Angeles Lakers
  console.log('Creating Los Angeles Lakers...')
  const lakers = await prisma.team.create({
    data: {
      name: 'Los Angeles Lakers',
      logoUrl: null,
      players: {
        create: [
          { name: 'LeBron James', jerseyNumber: 23, position: Position.SF },
          { name: 'Anthony Davis', jerseyNumber: 3, position: Position.PF },
          { name: "D'Angelo Russell", jerseyNumber: 1, position: Position.PG },
          { name: 'Austin Reaves', jerseyNumber: 15, position: Position.SG },
          { name: 'Jaxson Hayes', jerseyNumber: 11, position: Position.C },
          { name: 'Rui Hachimura', jerseyNumber: 28, position: Position.SF },
          { name: 'Taurean Prince', jerseyNumber: 12, position: Position.SF },
          { name: 'Jarred Vanderbilt', jerseyNumber: 2, position: Position.PF },
          { name: 'Cam Reddish', jerseyNumber: 5, position: Position.SF },
          { name: 'Jalen Hood-Schifino', jerseyNumber: 0, position: Position.PG },
          { name: 'Maxwell Lewis', jerseyNumber: 21, position: Position.SG },
          { name: 'Christian Wood', jerseyNumber: 35, position: Position.C },
        ],
      },
    },
    include: { players: true },
  })
  console.log(`  ✓ Created ${lakers.name} with ${lakers.players.length} players`)

  // Create Boston Celtics
  console.log('Creating Boston Celtics...')
  const celtics = await prisma.team.create({
    data: {
      name: 'Boston Celtics',
      logoUrl: null,
      players: {
        create: [
          { name: 'Jayson Tatum', jerseyNumber: 0, position: Position.SF },
          { name: 'Jaylen Brown', jerseyNumber: 7, position: Position.SG },
          { name: 'Derrick White', jerseyNumber: 9, position: Position.PG },
          { name: 'Kristaps Porzingis', jerseyNumber: 8, position: Position.C },
          { name: 'Al Horford', jerseyNumber: 42, position: Position.PF },
          { name: 'Jrue Holiday', jerseyNumber: 4, position: Position.PG },
          { name: 'Sam Hauser', jerseyNumber: 30, position: Position.SF },
          { name: 'Payton Pritchard', jerseyNumber: 11, position: Position.PG },
          { name: 'Luke Kornet', jerseyNumber: 40, position: Position.C },
          { name: 'Oshae Brissett', jerseyNumber: 12, position: Position.SF },
          { name: 'Lamar Stevens', jerseyNumber: 23, position: Position.PF },
          { name: 'Svi Mykhailiuk', jerseyNumber: 17, position: Position.SG },
        ],
      },
    },
    include: { players: true },
  })
  console.log(`  ✓ Created ${celtics.name} with ${celtics.players.length} players`)

  // Create a scheduled game: Lakers (home) vs Celtics (away)
  console.log('Creating scheduled game...')
  const game = await prisma.game.create({
    data: {
      homeTeamId: lakers.id,
      awayTeamId: celtics.id,
      status: 'SCHEDULED',
      scoreHome: 0,
      scoreAway: 0,
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
  })
  console.log(`  ✓ Created game: ${game.homeTeam.name} vs ${game.awayTeam.name}`)

  console.log('\n✅ Seeding completed successfully!')
  console.log(`   - 2 teams created`)
  console.log(`   - 24 players created (12 per team)`)
  console.log(`   - 1 scheduled game created`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
