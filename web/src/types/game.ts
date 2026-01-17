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
  elapsedSeconds?: number | null // Game timer value when action occurred (0-600)
  locationX?: number | null // Shot location x-coordinate (0-100)
  locationY?: number | null // Shot location y-coordinate (0-100)
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
  timerElapsedSeconds: number // Current timer value (0-600 seconds)
  timerIsRunning: boolean // Is timer currently running
  timerLastUpdatedAt: string | null // Last time timer was updated
  createdAt: string
  homeTeam: Team
  awayTeam: Team
  actions: Action[]
  playerStatuses: PlayerGameStatus[]
}
