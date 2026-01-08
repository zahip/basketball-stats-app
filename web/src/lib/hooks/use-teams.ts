'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

interface TeamListItem {
  id: string
  name: string
  logoUrl: string | null
  _count: { players: number }
}

interface TeamsResponse {
  teams: TeamListItem[]
}

export function useTeams() {
  return useQuery<TeamsResponse>({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await apiClient('/api/teams')

      if (!response.ok) {
        throw new Error('Failed to fetch teams')
      }

      return response.json()
    },
  })
}
