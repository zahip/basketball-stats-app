'use client'

import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { supabase } from '@/lib/supabase'
import type { Game, Action, ActionType } from '@/types/game'
import type { RealtimeChannel } from '@supabase/supabase-js'
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
    // Reduced polling since we have Supabase Realtime sync
    refetchInterval: 30000,
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

      // Optimistically update the game state
      if (previousData) {
        const newGame = { ...previousData }

        // Calculate score increment based on action type
        let scoreIncrement = 0
        if (variables.type === 'TWO_PT_MAKE') {
          scoreIncrement = 2
        } else if (variables.type === 'THREE_PT_MAKE') {
          scoreIncrement = 3
        }

        // Find the player
        const player = [...newGame.homeTeam.players, ...newGame.awayTeam.players].find(
          p => p.id === variables.playerId
        )

        if (player) {
          // Update the appropriate team's score
          if (player.teamId === newGame.homeTeamId) {
            newGame.scoreHome += scoreIncrement
          } else {
            newGame.scoreAway += scoreIncrement
          }

          // Create optimistic action with temporary ID
          const optimisticAction: Action = {
            id: `temp-${Date.now()}`,
            gameId: variables.gameId,
            playerId: variables.playerId,
            type: variables.type,
            quarter: variables.quarter,
            createdAt: new Date().toISOString(),
            player,
          }

          // Add to actions list
          newGame.actions = [optimisticAction, ...newGame.actions].slice(0, 10)
        }

        // Update local cache (Supabase Realtime handles cross-device sync)
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
      // Merge server response with existing cache (API returns minimal data)
      const existingData = queryClient.getQueryData<GameResponse>(['game', variables.gameId])

      if (existingData) {
        // Update scores from server response, keep existing teams/players/actions
        const mergedGame: GameResponse = {
          ...existingData,
          scoreHome: data.game.scoreHome,
          scoreAway: data.game.scoreAway,
          // Replace temp action ID with real one from server
          actions: existingData.actions.map(action =>
            action.id.startsWith('temp-') && action.playerId === data.action.playerId
              ? { ...action, id: data.action.id }
              : action
          ),
        }

        queryClient.setQueryData<GameResponse>(['game', variables.gameId], mergedGame)
      }
    },
  })
}

/**
 * Subscribe to game updates via Supabase Realtime for cross-device sync.
 */
export function useGameRealtime(gameId: string) {
  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!gameId || !supabase) return

    const channel = supabase
      .channel(`game:${gameId}`)
      .on('broadcast', { event: 'game_event' }, ({ payload }) => {
        // Update cache with new action
        const existingData = queryClient.getQueryData<Game>(['game', gameId])
        if (existingData && payload?.action) {
          // Avoid duplicates - check if action already exists
          const actionExists = existingData.actions.some(
            (a) => a.id === payload.action.id ||
                   (a.id.startsWith('temp-') && a.playerId === payload.action.playerId)
          )
          if (!actionExists) {
            const updatedGame = {
              ...existingData,
              actions: [payload.action, ...existingData.actions].slice(0, 10),
            }
            queryClient.setQueryData<Game>(['game', gameId], updatedGame)
          }
        }
      })
      .on('broadcast', { event: 'score_update' }, ({ payload }) => {
        // Update scores
        const existingData = queryClient.getQueryData<Game>(['game', gameId])
        if (existingData && payload) {
          const updatedGame = {
            ...existingData,
            scoreHome: payload.scoreHome ?? existingData.scoreHome,
            scoreAway: payload.scoreAway ?? existingData.scoreAway,
          }
          queryClient.setQueryData<Game>(['game', gameId], updatedGame)
        }
      })
      .subscribe()

    channelRef.current = channel

    // Cleanup
    return () => {
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [gameId, queryClient])
}
