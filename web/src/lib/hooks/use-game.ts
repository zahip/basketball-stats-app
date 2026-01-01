'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Game, Action, ActionType } from '@/types/game'
import { useToast } from '@/hooks/use-toast'

// The API returns Game directly, not wrapped
type GameResponse = Game

interface RecordActionRequest {
  gameId: string
  playerId: string
  type: ActionType
  quarter: number
}

interface RecordActionResponse {
  action: Action
  game: Game
}

interface MutationContext {
  previousData: GameResponse | undefined
}

export function useGame(gameId: string) {
  return useQuery<GameResponse>({
    queryKey: ['game', gameId],
    queryFn: async () => {
      const response = await apiClient(`/api/games/${gameId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch game')
      }

      return response.json()
    },
    enabled: !!gameId,
    refetchInterval: 5000, // Refetch every 5 seconds for live updates
  })
}

export function useRecordAction() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation<RecordActionResponse, Error, RecordActionRequest, MutationContext>({
    mutationFn: async (data: RecordActionRequest) => {
      const response = await apiClient('/api/actions', {
        method: 'POST',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to record action')
      }

      return response.json()
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['game', variables.gameId] })

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<GameResponse>(['game', variables.gameId])

      // Optimistically update the score
      if (previousData) {
        const newGame = { ...previousData }

        // Calculate score increment based on action type
        let scoreIncrement = 0
        if (variables.type === 'TWO_PT_MAKE') {
          scoreIncrement = 2
        } else if (variables.type === 'THREE_PT_MAKE') {
          scoreIncrement = 3
        }

        // Update the appropriate team's score
        const player = [...newGame.homeTeam.players, ...newGame.awayTeam.players].find(
          p => p.id === variables.playerId
        )

        if (player) {
          if (player.teamId === newGame.homeTeamId) {
            newGame.scoreHome += scoreIncrement
          } else {
            newGame.scoreAway += scoreIncrement
          }
        }

        queryClient.setQueryData<GameResponse>(['game', variables.gameId], newGame)
      }

      // Return context with snapshot
      return { previousData }
    },
    onError: (error, variables, context) => {
      // Rollback to previous data on error
      if (context?.previousData) {
        queryClient.setQueryData(['game', variables.gameId], context.previousData)
      }

      toast({
        title: 'Error',
        description: error.message || 'Failed to record action',
        variant: 'destructive',
      })
    },
    onSuccess: (data, variables) => {
      // Update with authoritative server data
      queryClient.setQueryData<GameResponse>(['game', variables.gameId], data.game)

      // Also invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['game', variables.gameId] })
    },
  })
}
