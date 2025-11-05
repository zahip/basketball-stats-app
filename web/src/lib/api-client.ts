const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

interface Game {
  id: string
  teamId: string
  opponent: string
  date: string
  venue?: string
  status: 'PLANNED' | 'LIVE' | 'FINAL'
  period: number
  clockSec: number
  ourScore: number
  oppScore: number
  team: {
    id: string
    name: string
    season: string
  }
  _count?: {
    events: number
  }
}

export interface GamesResponse {
  games: Game[]
}

export const gamesApi = {
  getAll: async (params?: { teamId?: string; status?: string }): Promise<GamesResponse> => {
    const searchParams = new URLSearchParams()
    if (params?.teamId) searchParams.set('teamId', params.teamId)
    if (params?.status) searchParams.set('status', params.status)

    const url = `${API_URL}/games${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to fetch games')
    }

    return response.json()
  },

  getById: async (gameId: string) => {
    const response = await fetch(`${API_URL}/games/${gameId}`)

    if (!response.ok) {
      throw new Error('Failed to fetch game')
    }

    return response.json()
  },
}

export type { Game }
