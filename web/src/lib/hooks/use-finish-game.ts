'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import type { Game } from '@/types/game'

interface FinishGameResponse {
  game: {
    id: string
    status: string
    scoreHome: number
    scoreAway: number
    summary: string
    homeTeam: { id: string; name: string }
    awayTeam: { id: string; name: string }
  }
  message: string
}

interface MutationContext {
  previousData: Game | undefined
}

export function useFinishGame() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation<FinishGameResponse, Error, string, MutationContext>({
    mutationFn: async (gameId: string) => {
      const response = await apiClient(`/api/games/${gameId}/finish`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to finish game')
      }

      return response.json()
    },

    onMutate: async (gameId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['game', gameId] })

      // Snapshot previous state
      const previousData = queryClient.getQueryData<Game>(['game', gameId])

      // Optimistically update to FINISHED (no summary yet)
      if (previousData) {
        queryClient.setQueryData<Game>(['game', gameId], {
          ...previousData,
          status: 'FINISHED',
        })
      }

      return { previousData }
    },

    onError: (error, gameId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['game', gameId], context.previousData)
      }

      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },

    onSuccess: (data, gameId) => {
      // Merge summary into cache
      const existingData = queryClient.getQueryData<Game>(['game', gameId])

      if (existingData) {
        queryClient.setQueryData<Game>(['game', gameId], {
          ...existingData,
          status: 'FINISHED',
          summary: data.game.summary,
        })
      }

      toast({
        title: 'Game Finished',
        description: 'AI summary generated successfully',
      })
    },
  })
}
