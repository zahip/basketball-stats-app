import 'dotenv/config'
import { broadcastGameEvent, broadcastGameHeader, broadcastBoxScore } from './supabase'

// Test broadcasting messages
async function testBroadcast() {
  console.log('📡 Testing realtime broadcast...')
  
  const gameId = 'game_2'
  
  try {
    // Test 1: Broadcast a game event
    console.log('🏀 Broadcasting game event...')
    await broadcastGameEvent(gameId, {
      type: 'event:new',
      payload: {
        id: 'test_event_123',
        type: 'SHOT_2_MADE',
        period: 2,
        clockSec: 300,
        teamSide: 'US',
        playerId: 'player_123',
        meta: { x: 15, y: 8 }
      }
    })

    // Test 2: Broadcast header update
    console.log('📊 Broadcasting header update...')
    await broadcastGameHeader(gameId, {
      type: 'header:update',
      payload: {
        ourScore: 56,
        oppScore: 52,
        period: 2,
        clockSec: 300,
        status: 'LIVE'
      }
    })

    // Test 3: Broadcast boxscore update
    console.log('📈 Broadcasting boxscore update...')
    await broadcastBoxScore(gameId, {
      type: 'boxscore:update',
      payload: {
        teamBoxScores: [
          {
            teamSide: 'US',
            pts: 56,
            fgm2: 20,
            fga2: 35,
            fgm3: 5,
            fga3: 12
          }
        ]
      }
    })

    console.log('✅ All broadcasts sent successfully!')
    console.log('💡 Check the listening terminal for received messages')
    
  } catch (error) {
    console.error('❌ Broadcast failed:', error)
  }
  
  process.exit(0)
}

// Run if called directly
if (require.main === module) {
  testBroadcast()
}

export { testBroadcast }