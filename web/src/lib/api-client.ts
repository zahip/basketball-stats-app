import { supabase } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  return headers
}

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

interface Team {
  id: string
  name: string
  season: string
  createdAt: string
  _count?: {
    players: number
    games: number
  }
}

export interface GamesResponse {
  games: Game[]
}

export interface TeamsResponse {
  teams: Team[]
}

export interface CreateGameData {
  teamId: string
  opponent: string
  date: string
  venue?: string
}

export interface UpdateGameData {
  status?: 'PLANNED' | 'LIVE' | 'FINAL'
  period?: number
  clockSec?: number
  ourScore?: number
  oppScore?: number
  // Atomic increments to prevent race conditions
  incrementOurScore?: number
  incrementOppScore?: number
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

  create: async (data: CreateGameData) => {
    const headers = await getAuthHeaders()

    const response = await fetch(`${API_URL}/games`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create game')
    }

    return response.json()
  },

  update: async (gameId: string, data: UpdateGameData) => {
    const headers = await getAuthHeaders()

    const response = await fetch(`${API_URL}/games/${gameId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update game')
    }

    return response.json()
  },
}

export const teamsApi = {
  getAll: async (): Promise<TeamsResponse> => {
    const response = await fetch(`${API_URL}/teams`)

    if (!response.ok) {
      throw new Error('Failed to fetch teams')
    }

    return response.json()
  },
}

export type { Game, Team }
