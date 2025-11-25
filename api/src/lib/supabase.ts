import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Check if Supabase is configured
export const isSupabaseConfigured = true

// Broadcast game events to realtime channel
export const broadcastGameEvent = async (gameId: string, event: any) => {
  try {
    const channel = supabase.channel(`game:${gameId}`)

    // CRITICAL FIX: Subscribe to channel before sending
    await channel.subscribe()

    await channel.send({
      type: 'broadcast',
      event: 'game_event',
      payload: event
    })
    console.log(`📡 Broadcasted game event for game ${gameId}`)

    // Cleanup: Unsubscribe after sending
    await channel.unsubscribe()
  } catch (error) {
    console.error('❌ Failed to broadcast game event:', error)
  }
}

// Broadcast game header updates (score, period, clock)
export const broadcastGameHeader = async (gameId: string, header: any) => {
  try {
    const channel = supabase.channel(`game:${gameId}`)

    // CRITICAL FIX: Subscribe to channel before sending
    await channel.subscribe()

    // FIX: Change event name from 'header_update' to 'score_update' to match frontend
    await channel.send({
      type: 'broadcast',
      event: 'score_update',
      payload: header
    })
    console.log(`📡 Broadcasted score update for game ${gameId}`)

    // Cleanup: Unsubscribe after sending
    await channel.unsubscribe()
  } catch (error) {
    console.error('❌ Failed to broadcast score update:', error)
  }
}

// Broadcast boxscore updates
export const broadcastBoxScore = async (gameId: string, boxscore: any) => {
  try {
    const channel = supabase.channel(`game:${gameId}`)

    // CRITICAL FIX: Subscribe to channel before sending
    await channel.subscribe()

    // Note: Frontend doesn't currently listen for this event, but keeping consistent naming
    await channel.send({
      type: 'broadcast',
      event: 'boxscore:update',
      payload: boxscore
    })
    console.log(`📡 Broadcasted boxscore update for game ${gameId}`)

    // Cleanup: Unsubscribe after sending
    await channel.unsubscribe()
  } catch (error) {
    console.error('❌ Failed to broadcast boxscore update:', error)
  }
}

// Broadcast player court status updates (substitutions)
export const broadcastPlayerCourtStatus = async (gameId: string, playerBoxScores: any[]) => {
  try {
    const channel = supabase.channel(`game:${gameId}`)

    // CRITICAL FIX: Subscribe to channel before sending
    await channel.subscribe()

    await channel.send({
      type: 'broadcast',
      event: 'player_court_status',
      payload: {
        playerBoxScores,
        updatedAt: new Date().toISOString()
      }
    })
    console.log(`📡 Broadcasted player court status for game ${gameId}`)

    // Cleanup: Unsubscribe after sending
    await channel.unsubscribe()
  } catch (error) {
    console.error('❌ Failed to broadcast player court status:', error)
  }
}