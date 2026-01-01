import Dexie, { Table } from 'dexie'

// Types for offline queue
export interface PendingEvent {
  id: string
  gameId: string
  tsClient: Date
  type: string
  playerId?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: any
  ingestKey: string
  retryCount: number
  lastAttempt?: Date
}

export interface CachedGame {
  id: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
  lastUpdated: Date
}

export interface CachedPlayer {
  id: string
  teamId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
  lastUpdated: Date
}

class BasketballDB extends Dexie {
  pendingEvents!: Table<PendingEvent>
  cachedGames!: Table<CachedGame>
  cachedPlayers!: Table<CachedPlayer>

  constructor() {
    super('BasketballStatsDB')

    this.version(1).stores({
      pendingEvents: '++id, gameId, tsClient, ingestKey',
      cachedGames: 'id, lastUpdated',
      cachedPlayers: 'id, teamId, lastUpdated'
    })
  }
}

export const db = new BasketballDB()

// Offline sync utilities
export const queueEvent = async (event: Omit<PendingEvent, 'id' | 'retryCount'>) => {
  await db.pendingEvents.add({
    ...event,
    retryCount: 0
  } as PendingEvent)
}

export const getPendingEvents = async (gameId?: string) => {
  if (gameId) {
    return db.pendingEvents.where('gameId').equals(gameId).toArray()
  }
  return db.pendingEvents.toArray()
}

export const removePendingEvent = async (id: string) => {
  await db.pendingEvents.delete(id)
}

export const updateRetryCount = async (id: string, count: number) => {
  await db.pendingEvents.update(id, {
    retryCount: count,
    lastAttempt: new Date()
  })
}
