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
    
    await channel.send({
      type: 'broadcast',
      event: 'game_event',
      payload: event
    })
    console.log(`📡 Broadcasted game event for game ${gameId}`)
  } catch (error) {
    console.error('❌ Failed to broadcast game event:', error)
  }
}

// Broadcast game header updates (score, period, clock)
export const broadcastGameHeader = async (gameId: string, header: any) => {
  try {
    const channel = supabase.channel(`game:${gameId}`)
    
    await channel.send({
      type: 'broadcast',
      event: 'header_update',
      payload: header
    })
    console.log(`📡 Broadcasted header update for game ${gameId}`)
  } catch (error) {
    console.error('❌ Failed to broadcast header update:', error)
  }
}

// Broadcast boxscore updates
export const broadcastBoxScore = async (gameId: string, boxscore: any) => {
  try {
    const channel = supabase.channel(`game:${gameId}`)
    
    await channel.send({
      type: 'broadcast',
      event: 'boxscore_update',
      payload: boxscore
    })
    console.log(`📡 Broadcasted boxscore update for game ${gameId}`)
  } catch (error) {
    console.error('❌ Failed to broadcast boxscore update:', error)
  }
}