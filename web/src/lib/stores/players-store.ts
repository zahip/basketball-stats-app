import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Player {
  id: string
  number: number
  name: string
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C'
  height?: string
  weight?: string
  isActive: boolean
}

interface PlayersState {
  players: Player[]
  addPlayer: (player: Omit<Player, 'id'>) => void
  updatePlayer: (id: string, updates: Partial<Player>) => void
  deletePlayer: (id: string) => void
  getActivePlayers: () => Player[]
  clearAllPlayers: () => void
}

export const usePlayersStore = create<PlayersState>()(
  persist(
    (set, get) => ({
      players: [],

      addPlayer: (playerData) => {
        const newPlayer: Player = {
          ...playerData,
          id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        }
        set((state) => ({
          players: [...state.players, newPlayer],
        }))
      },

      updatePlayer: (id, updates) => {
        set((state) => ({
          players: state.players.map((player) =>
            player.id === id ? { ...player, ...updates } : player
          ),
        }))
      },

      deletePlayer: (id) => {
        set((state) => ({
          players: state.players.filter((player) => player.id !== id),
        }))
      },

      getActivePlayers: () => {
        return get().players.filter((player) => player.isActive)
      },

      clearAllPlayers: () => {
        set({ players: [] })
      },
    }),
    {
      name: 'basketball-players-storage',
      version: 1,
    }
  )
)