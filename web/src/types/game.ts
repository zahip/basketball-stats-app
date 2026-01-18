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

export type ClockStatus = 'RUNNING' | 'PAUSED'

export interface ClockSession {
  id: string
  gameId: string
  status: ClockStatus
  secondsRemaining: number // Game clock value at this state change (0-600)
  systemTimestamp: string // ISO timestamp of when this state change occurred
  createdAt: string
}

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
  totalSecondsPlayed: number // CACHE: Recalculated from clock sessions on pause/sub
  lastSubInTime: number | null // Exact secondsRemaining snapshot when player entered court (null if on bench)
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
  timerElapsedSeconds: number // DEPRECATED: Will be removed after migration to clock sessions
  timerIsRunning: boolean // DEPRECATED: Will be removed after migration to clock sessions
  timerLastUpdatedAt: string | null // DEPRECATED: Will be removed after migration to clock sessions
  createdAt: string
  homeTeam: Team
  awayTeam: Team
  actions: Action[]
  playerStatuses: PlayerGameStatus[]
  clockSessions: ClockSession[] // NEW: Clock session-based timer tracking
}
