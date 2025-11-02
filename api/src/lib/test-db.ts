import { prisma } from './db'

async function testDatabase() {
  console.log('🔍 Testing database connection...')
  
  try {
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Test query
    const teamCount = await prisma.team.count()
    console.log(`📊 Teams in database: ${teamCount}`)
    
    const playerCount = await prisma.player.count()
    console.log(`👥 Players in database: ${playerCount}`)
    
    const gameCount = await prisma.game.count()
    console.log(`🏀 Games in database: ${gameCount}`)
    
    const eventCount = await prisma.gameEvent.count()
    console.log(`📝 Events in database: ${eventCount}`)
    
    // Test a more complex query
    const games = await prisma.game.findMany({
      include: {
        team: true,
        _count: {
          select: { events: true }
        }
      }
    })
    
    console.log('\n📋 Games overview:')
    games.forEach(game => {
      console.log(`  ${game.team.name} vs ${game.opponent} - ${game.status} (${game._count.events} events)`)
    })
    
    console.log('\n🎉 Database test completed successfully!')
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  testDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export { testDatabase }