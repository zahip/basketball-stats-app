'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only create Supabase client if credentials are available
const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

interface GameState {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  period: number
  clock: string
  status: 'scheduled' | 'active' | 'paused' | 'completed'
}

interface GameEvent {
  id: string
  gameId: string
  type: string
  playerId: string
  team: 'home' | 'away'
  timestamp: number
}

interface BoxScore {
  gameId: string
  homeStats: any
  awayStats: any
  playerStats: any[]
}

export function useRealtimeGame(gameId: string) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [recentEvents, setRecentEvents] = useState<GameEvent[]>([])
  const [boxScore, setBoxScore] = useState<BoxScore | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  useEffect(() => {
    if (!gameId || !supabase) {
      // If no Supabase client, just set disconnected status
      setConnectionStatus('disconnected')
      return
    }

    // Subscribe to game header updates
    const gameChannel = supabase
      .channel(`game_${gameId}_header`)
      .on('broadcast', { event: 'game_header_update' }, (payload) => {
        console.log('Game header update:', payload)
        if (payload.payload) {
          setGameState(payload.payload)
        }
      })
      .subscribe((status) => {
        console.log('Game header subscription status:', status)
        setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'connecting')
      })

    // Subscribe to game events
    const eventsChannel = supabase
      .channel(`game_${gameId}_events`)
      .on('broadcast', { event: 'game_event' }, (payload) => {
        console.log('Game event:', payload)
        if (payload.payload) {
          setRecentEvents(prev => [payload.payload, ...prev.slice(0, 9)]) // Keep last 10 events
        }
      })
      .subscribe()

    // Subscribe to box score updates
    const boxScoreChannel = supabase
      .channel(`game_${gameId}_boxscore`)
      .on('broadcast', { event: 'boxscore_update' }, (payload) => {
        console.log('Box score update:', payload)
        if (payload.payload) {
          setBoxScore(payload.payload)
        }
      })
      .subscribe()

    // Handle connection state changes
    const handleConnectionChange = () => {
      setConnectionStatus(navigator.onLine ? 'connected' : 'disconnected')
    }

    window.addEventListener('online', handleConnectionChange)
    window.addEventListener('offline', handleConnectionChange)

    // Cleanup subscriptions
    return () => {
      gameChannel.unsubscribe()
      eventsChannel.unsubscribe()
      boxScoreChannel.unsubscribe()
      window.removeEventListener('online', handleConnectionChange)
      window.removeEventListener('offline', handleConnectionChange)
    }
  }, [gameId])

  return {
    gameState,
    recentEvents,
    boxScore,
    connectionStatus,
    isConnected: connectionStatus === 'connected'
  }
}