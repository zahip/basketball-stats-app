import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Broadcast game events to realtime channel
export const broadcastGameEvent = async (gameId: string, event: any) => {
  const channel = supabase.channel(`game:${gameId}`)
  
  await channel.send({
    type: 'broadcast',
    event: 'game_event',
    payload: event
  })
}

// Broadcast game header updates (score, period, clock)
export const broadcastGameHeader = async (gameId: string, header: any) => {
  const channel = supabase.channel(`game:${gameId}`)
  
  await channel.send({
    type: 'broadcast',
    event: 'header_update',
    payload: header
  })
}

// Broadcast boxscore updates
export const broadcastBoxScore = async (gameId: string, boxscore: any) => {
  const channel = supabase.channel(`game:${gameId}`)
  
  await channel.send({
    type: 'broadcast',
    event: 'boxscore_update',
    payload: boxscore
  })
}