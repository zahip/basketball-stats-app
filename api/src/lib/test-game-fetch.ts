import { prisma } from './db'

async function testGameFetch() {
  try {
    console.log('🔍 Testing database connection...')

    // Test 1: Simple connection
    await prisma.$connect()
    console.log('✅ Database connected')

    // Test 2: List all games
    const games = await prisma.game.findMany({
      select: { id: true, status: true, homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
    })
    console.log(`✅ Found ${games.length} games:`)
    games.forEach(g => console.log(`   - ${g.id}: ${g.homeTeam.name} vs ${g.awayTeam.name} (${g.status})`))

    // Test 3: Fetch specific game (same as API route)
    const gameId = 'f93ee190-7cee-41e3-9d5f-1e3cdd8b2e84'
    console.log(`\n🔍 Fetching game ${gameId}...`)

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
      console.log('❌ Game not found')
    } else {
      console.log('✅ Game found:')
      console.log(`   Home: ${game.homeTeam.name} (${game.scoreHome})`)
      console.log(`   Away: ${game.awayTeam.name} (${game.scoreAway})`)
      console.log(`   Status: ${game.status}`)
      console.log(`   Summary: ${game.summary ? 'Yes' : 'No'}`)
      console.log(`   Actions: ${game.actions.length}`)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testGameFetch()
