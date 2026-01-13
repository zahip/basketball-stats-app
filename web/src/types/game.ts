export type ActionType =
  | 'TWO_PT_MAKE'
  | 'TWO_PT_MISS'
  | 'THREE_PT_MAKE'
  | 'THREE_PT_MISS'
  | 'FT_MAKE'
  | 'FT_MISS'
  | 'REB'
  | 'AST'
  | 'STL'
  | 'BLK'
  | 'FOUL'
  | 'TO'
  | 'SUB_IN'
  | 'SUB_OUT'

export type GameStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED'

export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C'

export interface Player {
  id: string
  name: string
  jerseyNumber: number
  position: Position
  teamId: string
}

export interface Team {
  id: string
  name: string
  logoUrl: string | null
  players: Player[]
}

export interface Action {
  id: string
  gameId: string
  playerId: string
  type: ActionType
  quarter: number
  createdAt: string
  player: Player
}

export interface PlayerGameStatus {
  id: string
  gameId: string
  playerId: string
  isOnCourt: boolean
  isStarter: boolean
  createdAt: string
  updatedAt: string
  player: Player
}

export interface Game {
  id: string
  homeTeamId: string
  awayTeamId: string
  status: GameStatus
  scoreHome: number
  scoreAway: number
  summary?: string | null
  createdAt: string
  homeTeam: Team
  awayTeam: Team
  actions: Action[]
  playerStatuses: PlayerGameStatus[]
}
