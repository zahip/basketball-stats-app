'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { GameStatus } from '@/types/game'

interface GameListItem {
  id: string
  status: GameStatus
  scoreHome: number
  scoreAway: number
  createdAt: string
  homeTeam: { id: string; name: string; logoUrl: string | null }
  awayTeam: { id: string; name: string; logoUrl: string | null }
}

interface GamesResponse {
  games: GameListItem[]
}

interface CreateGameRequest {
  homeTeamId: string
  awayTeamId: string
}

interface CreateGameResponse {
  game: GameListItem
}

export function useGames() {
  return useQuery<GamesResponse>({
    queryKey: ['games'],
    queryFn: async () => {
      const response = await apiClient('/api/games')

      if (!response.ok) {
        throw new Error('Failed to fetch games')
      }

      return response.json()
    },
  })
}

export function useCreateGame() {
  const queryClient = useQueryClient()

  return useMutation<CreateGameResponse, Error, CreateGameRequest>({
    mutationFn: async (data) => {
      const response = await apiClient('/api/games', {
        method: 'POST',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create game')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] })
    },
  })
}
