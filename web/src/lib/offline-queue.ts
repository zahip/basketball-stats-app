import Dexie, { Table } from 'dexie'
import { v4 as uuidv4 } from 'uuid'

export interface QueuedEvent {
  id: string
  gameId: string
  eventType: string
  playerId: string
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

  async addEvent(gameId: string, eventType: string, playerId: string, team: 'home' | 'away', data?: any): Promise<string> {
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

    await offlineQueue.events.add(event)
    
    // Try to sync immediately if online
    if (navigator.onLine) {
      this.syncPendingEvents()
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

  async syncPendingEvents(): Promise<void> {
    if (this.syncInProgress || !navigator.onLine) return

    this.syncInProgress = true

    try {
      const pendingEvents = await this.getPendingEvents()
      
      for (const event of pendingEvents) {
        try {
          await this.syncSingleEvent(event)
        } catch (error) {
          console.error('Failed to sync event:', error)
          await this.markEventFailed(event)
        }
      }
    } finally {
      this.syncInProgress = false
    }
  }

  private async syncSingleEvent(event: QueuedEvent): Promise<void> {
    const response = await fetch(`/api/games/${event.gameId}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': event.ingestKey
      },
      body: JSON.stringify({
        type: event.eventType,
        playerId: event.playerId,
        team: event.team,
        tsClient: event.timestamp,
        ...event.data
      })
    })

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`)
    }

    await offlineQueue.events.update(event.id, { status: 'synced' })
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