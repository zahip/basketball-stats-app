import Dexie, { Table } from 'dexie'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from './supabase'

export interface QueuedEvent {
  id: string
  gameId: string
  eventType: string
  playerId: string | null
  team: 'home' | 'away'
  timestamp: number
  ingestKey: string
  status: 'pending' | 'synced' | 'failed'
  retryCount: number
  data?: any
}

export class OfflineQueue extends Dexie {
  events!: Table<QueuedEvent>

  constructor() {
    super('BasketballStatsQueue')
    this.version(1).stores({
      events: '++id, gameId, status, timestamp, ingestKey'
    })
  }
}

export const offlineQueue = new OfflineQueue()

export class EventQueueManager {
  private syncInProgress = false

  // Map frontend event types to backend enum values
  private mapEventType(eventType: string): string {
    // Legacy mapping for old event types (keeping for backwards compatibility)
    const mapping: Record<string, string> = {
      'field_goal_made': 'SHOT_2_MADE',
      'field_goal_missed': 'SHOT_2_MISS',
      'three_point_made': 'SHOT_3_MADE',
      'three_point_missed': 'SHOT_3_MISS',
      'free_throw_made': 'FT_MADE',
      'free_throw_missed': 'FT_MISS',
      'rebound_offensive': 'REB_O',
      'rebound_defensive': 'REB_D',
      'assist': 'AST',
      'steal': 'STL',
      'block': 'BLK',
      'turnover': 'TOV',
      'personal_foul': 'FOUL',
      'technical_foul': 'FOUL',
      'flagrant_foul': 'FOUL',
      'sub_in': 'SUB_IN',
      'sub_out': 'SUB_OUT'
    }
    // Return mapped value or original if already in correct format
    return mapping[eventType] || eventType
  }

  async addEvent(gameId: string, eventType: string, playerId: string | null, team: 'home' | 'away', data?: any): Promise<string> {
    const ingestKey = uuidv4()
    const event: QueuedEvent = {
      id: uuidv4(),
      gameId,
      eventType,
      playerId,
      team,
      timestamp: Date.now(),
      ingestKey,
      status: 'pending',
      retryCount: 0,
      data
    }

    console.log('Adding event to queue:', event)

    await offlineQueue.events.add(event)
    
    // Try to sync immediately if online (but don't wait for result)
    if (navigator.onLine) {
      this.syncPendingEvents().catch(error => {
        console.log('Background sync failed:', error.message)
      })
    }

    return ingestKey
  }

  async getPendingEvents(gameId?: string): Promise<QueuedEvent[]> {
    let query = offlineQueue.events.where('status').equals('pending')
    if (gameId) {
      query = query.and(event => event.gameId === gameId)
    }
    return query.toArray()
  }

  async getLastPendingEvent(gameId: string): Promise<QueuedEvent | null> {
    const events = await offlineQueue.events
      .where('gameId').equals(gameId)
      .and(event => event.status === 'pending')
      .reverse()
      .limit(1)
      .toArray()
    
    return events.length > 0 ? events[0] : null
  }

  async removeLastPendingEvent(gameId: string): Promise<boolean> {
    const lastEvent = await this.getLastPendingEvent(gameId)
    if (lastEvent) {
      await offlineQueue.events.delete(lastEvent.id)
      return true
    }
    return false
  }

  async syncPendingEvents(): Promise<{ synced: number, failed: number, total: number }> {
    if (this.syncInProgress || !navigator.onLine) {
      return { synced: 0, failed: 0, total: 0 }
    }

    this.syncInProgress = true
    let syncedCount = 0
    let failedCount = 0
    let apiAvailable = true

    try {
      const pendingEvents = await this.getPendingEvents()
      
      for (const event of pendingEvents) {
        try {
          await this.syncSingleEvent(event)
          syncedCount++
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          console.log(`Failed to sync event ${event.id}:`, errorMessage)

          // If API is not available, stop trying to sync more events
          if (errorMessage === 'API not available') {
            apiAvailable = false
            console.log('API not available - stopping sync attempts')
            break
          }
          
          // For other errors, mark as failed and continue
          await this.markEventFailed(event)
          failedCount++
        }
      }

      return { 
        synced: syncedCount, 
        failed: failedCount, 
        total: pendingEvents.length 
      }
    } finally {
      this.syncInProgress = false
    }
  }

  private async syncSingleEvent(event: QueuedEvent): Promise<void> {
    console.log('Syncing event from queue:', event)
    
    try {
      // Get the current user's session for auth
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': event.ingestKey
      }

      // Add authorization header if we have a token
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      } else {
        // If no auth token, we can't sync to API yet
        throw new Error('No authentication token - user not signed in')
      }

      console.log('Event data from queue:', {
        eventType: event.eventType,
        playerId: event.playerId,
        team: event.team,
        data: event.data,
        ingestKey: event.ingestKey
      })

      // Map the event type to backend format
      const mappedEventType = this.mapEventType(event.eventType)

      // Build the event payload matching the backend schema
      // For away team events, omit playerId entirely (don't send null)
      const eventPayload: any = {
        gameId: event.gameId,
        type: mappedEventType,
        period: event.data?.period || 1,
        clockSec: event.data?.clockSec || 600,
        teamSide: event.team === 'home' ? 'US' : 'OPP',
        meta: event.data || {},
        ingestKey: event.ingestKey
      }

      // Only include playerId if it's not null (for home team events)
      if (event.playerId) {
        eventPayload.playerId = event.playerId
      }

      console.log('Event payload to send:', eventPayload)

      // Backend expects an array of events in "events" field, not "eventsToProcess"
      const payload = {
        events: [eventPayload]
      }

      console.log('Final payload being sent:', JSON.stringify(payload, null, 2))
      console.log('Sending event to API:', {
        url: `${apiUrl}/games/${event.gameId}/events`,
        payload,
        headers: { ...headers, Authorization: headers.Authorization ? '[REDACTED]' : 'Missing' }
      })

      console.log('Making request to:', `${apiUrl}/games/${event.gameId}/events`)
      console.log('Request body:', JSON.stringify(payload))
      
      const response = await fetch(`${apiUrl}/games/${event.gameId}/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })
      
      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        // Try to get detailed error response
        let errorDetails = 'Unknown error'
        try {
          const errorResponse = await response.text()
          errorDetails = errorResponse
          console.error('API Error Response:', errorResponse)
        } catch (e) {
          console.error('Could not parse error response')
        }

        // Handle different types of failures
        if (response.status === 401) {
          throw new Error('Authentication required - please sign in again')
        } else if (response.status === 403) {
          throw new Error('Access denied - insufficient permissions')
        } else if (response.status >= 500) {
          throw new Error(`Server error (${response.status}): ${errorDetails}`)
        } else if (response.status === 404) {
          throw new Error(`Game not found: ${event.gameId}`)
        } else if (response.status === 400) {
          throw new Error(`Bad request (${response.status}): ${errorDetails}`)
        } else {
          throw new Error(`Sync failed (${response.status}): ${errorDetails}`)
        }
      }

      await offlineQueue.events.update(event.id, { status: 'synced' })
    } catch (error) {
      // Handle network errors (API not available)
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (error instanceof TypeError || errorMessage.includes('fetch')) {
        console.log(`API not available - keeping event ${event.id} in queue`)
        throw new Error('API not available')
      }
      throw error
    }
  }

  private async markEventFailed(event: QueuedEvent): Promise<void> {
    await offlineQueue.events.update(event.id, {
      status: 'failed',
      retryCount: event.retryCount + 1
    })
  }

  async clearSyncedEvents(): Promise<void> {
    await offlineQueue.events.where('status').equals('synced').delete()
  }

  // Setup online/offline event listeners
  setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      console.log('Back online - syncing pending events')
      this.syncPendingEvents()
    })

    window.addEventListener('offline', () => {
      console.log('Gone offline - events will be queued')
    })
  }
}

export const eventQueueManager = new EventQueueManager()