import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// Game state store for live game tracking
interface GameState {
  selectedPlayer: string | null
  isOnline: boolean
  pendingEvents: number
  setSelectedPlayer: (playerId: string | null) => void
  setOnlineStatus: (online: boolean) => void
  setPendingEvents: (count: number) => void
}

export const useGameStore = create<GameState>()(
  devtools(
    (set) => ({
      selectedPlayer: null,
      isOnline: navigator.onLine,
      pendingEvents: 0,
      setSelectedPlayer: (playerId) => set({ selectedPlayer: playerId }),
      setOnlineStatus: (online) => set({ isOnline: online }),
      setPendingEvents: (count) => set({ pendingEvents: count }),
    }),
    {
      name: 'game-store',
    }
  )
)