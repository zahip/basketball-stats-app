import 'dotenv/config'
import { supabase } from './supabase'

// Test realtime broadcasting by listening to a game channel
async function testRealtimeConnection() {
  console.log('🔥 Testing Supabase Realtime connection...')
  
  const gameId = 'game_2'  // Use existing live game
  
  // Subscribe to game channel
  const channel = supabase.channel(`game:${gameId}`)
  
  channel
    .on('broadcast', { event: 'game_event' }, (payload) => {
      console.log('📡 Received game event:', payload)
    })
    .on('broadcast', { event: 'header_update' }, (payload) => {
      console.log('📊 Received header update:', payload)
    })
    .on('broadcast', { event: 'boxscore_update' }, (payload) => {
      console.log('📈 Received boxscore update:', payload)
    })
    .subscribe((status) => {
      console.log(`🔗 Channel status: ${status}`)
      
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Successfully subscribed to game:${gameId}`)
        console.log('🎯 Listening for realtime updates...')
        console.log('💡 In another terminal, run: npm run test:broadcast')
      }
    })

  // Keep the process alive to listen for messages
  process.on('SIGINT', () => {
    console.log('\n👋 Unsubscribing from channel...')
    channel.unsubscribe()
    process.exit(0)
  })
}

// Run if called directly
if (require.main === module) {
  testRealtimeConnection()
}

export { testRealtimeConnection }