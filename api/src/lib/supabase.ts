import { createClient, RealtimeChannel } from '@supabase/supabase-js'

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

// Channel manager to reuse connections (avoids slow subscribe() on each broadcast)
const activeChannels = new Map<string, RealtimeChannel>()

async function getOrCreateChannel(gameId: string): Promise<RealtimeChannel> {
  const channelName = `game:${gameId}`

  if (!activeChannels.has(channelName)) {
    const channel = supabase.channel(channelName)
    await channel.subscribe()
    activeChannels.set(channelName, channel)
    console.log(`🔌 Created persistent channel for game ${gameId}`)
  }

  return activeChannels.get(channelName)!
}

// Remove a channel (call when game ends or on error)
export async function removeChannel(gameId: string) {
  const channelName = `game:${gameId}`
  const channel = activeChannels.get(channelName)
  if (channel) {
    await channel.unsubscribe()
    activeChannels.delete(channelName)
    console.log(`🔌 Removed channel for game ${gameId}`)
  }
}

// Broadcast game events to realtime channel
export const broadcastGameEvent = async (gameId: string, event: any) => {
  try {
    const channel = await getOrCreateChannel(gameId)
    await channel.send({
      type: 'broadcast',
      event: 'game_event',
      payload: event
    })
    console.log(`📡 Broadcasted game event for game ${gameId}`)
  } catch (error) {
    console.error('❌ Failed to broadcast game event:', error)
    // Remove broken channel so it gets recreated on next attempt
    activeChannels.delete(`game:${gameId}`)
  }
}

// Broadcast game header updates (score, period, clock)
export const broadcastGameHeader = async (gameId: string, header: any) => {
  try {
    const channel = await getOrCreateChannel(gameId)
    await channel.send({
      type: 'broadcast',
      event: 'score_update',
      payload: header
    })
    console.log(`📡 Broadcasted score update for game ${gameId}`)
  } catch (error) {
    console.error('❌ Failed to broadcast score update:', error)
    activeChannels.delete(`game:${gameId}`)
  }
}

// Broadcast boxscore updates
export const broadcastBoxScore = async (gameId: string, boxscore: any) => {
  try {
    const channel = await getOrCreateChannel(gameId)
    await channel.send({
      type: 'broadcast',
      event: 'boxscore:update',
      payload: boxscore
    })
    console.log(`📡 Broadcasted boxscore update for game ${gameId}`)
  } catch (error) {
    console.error('❌ Failed to broadcast boxscore update:', error)
    activeChannels.delete(`game:${gameId}`)
  }
}

// Broadcast player court status updates (substitutions)
export const broadcastPlayerCourtStatus = async (gameId: string, playerBoxScores: any[]) => {
  try {
    const channel = await getOrCreateChannel(gameId)
    await channel.send({
      type: 'broadcast',
      event: 'player_court_status',
      payload: {
        playerBoxScores,
        updatedAt: new Date().toISOString()
      }
    })
    console.log(`📡 Broadcasted player court status for game ${gameId}`)
  } catch (error) {
    console.error('❌ Failed to broadcast player court status:', error)
    activeChannels.delete(`game:${gameId}`)
  }
}
