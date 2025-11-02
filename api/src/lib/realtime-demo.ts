import 'dotenv/config'
import { supabase } from './supabase'

// Comprehensive realtime demo showing all channels and events
async function realtimeDemo() {
  console.log('🎮 Basketball Stats Realtime Demo')
  console.log('==================================\n')
  
  const gameId = 'game_2'
  
  // Subscribe to the game channel
  const channel = supabase.channel(`game:${gameId}`)
  
  console.log(`🔗 Connecting to game:${gameId} channel...`)
  
  channel
    .on('broadcast', { event: 'game_event' }, (payload) => {
      console.log('\n🏀 GAME EVENT RECEIVED:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`Type: ${payload.payload.type}`)
      console.log(`Period: ${payload.payload.period}`)
      console.log(`Clock: ${payload.payload.clockSec}s`)
      console.log(`Team: ${payload.payload.teamSide}`)
      if (payload.payload.meta) {
        console.log(`Location: (${payload.payload.meta.x}, ${payload.payload.meta.y})`)
      }
      console.log(`Event ID: ${payload.payload.id}`)
      console.log(`Timestamp: ${payload.payload.tsServer}`)
    })
    .on('broadcast', { event: 'header_update' }, (payload) => {
      console.log('\n📊 HEADER UPDATE RECEIVED:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`Score: ${payload.payload.ourScore} - ${payload.payload.oppScore}`)
      console.log(`Period: ${payload.payload.period}`)
      console.log(`Clock: ${payload.payload.clockSec}s`)
      console.log(`Status: ${payload.payload.status}`)
    })
    .on('broadcast', { event: 'boxscore_update' }, (payload) => {
      console.log('\n📈 BOXSCORE UPDATE RECEIVED:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      if (payload.payload.teamBoxScores) {
        payload.payload.teamBoxScores.forEach((team: any) => {
          console.log(`${team.teamSide}: ${team.pts} PTS, ${team.fgm2}/${team.fga2} 2PT, ${team.fgm3}/${team.fga3} 3PT`)
        })
      }
      console.log(`Updated: ${payload.payload.updatedAt}`)
    })
    .subscribe((status) => {
      console.log(`\n🔗 Channel status: ${status}`)
      
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully connected to realtime!')
        console.log('\n💡 Instructions:')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('1. Keep this terminal open to watch realtime updates')
        console.log('2. In another terminal, run:')
        console.log('   ./test-api-realtime.sh')
        console.log('   OR')
        console.log('   npm run test:broadcast')
        console.log('3. Watch the magic happen here! ✨')
        console.log('\n🎯 Listening for live updates...\n')
      }
    })

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down realtime demo...')
    channel.unsubscribe()
    console.log('✅ Disconnected from realtime')
    process.exit(0)
  })
}

// Run if called directly
if (require.main === module) {
  realtimeDemo()
}

export { realtimeDemo }