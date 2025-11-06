import { z } from 'zod'

// Event type enum for validation
export const EventTypeSchema = z.enum([
  'SHOT_2_MADE',
  'SHOT_2_MISS', 
  'SHOT_3_MADE',
  'SHOT_3_MISS',
  'FT_MADE',
  'FT_MISS',
  'REB_O',
  'REB_D',
  'AST',
  'STL',
  'BLK',
  'TOV',
  'FOUL',
  'SUB_IN',
  'SUB_OUT',
  'TIMEOUT',
  'START_PERIOD',
  'END_PERIOD'
])

export const TeamSideSchema = z.enum(['US', 'OPP'])
export const GameStatusSchema = z.enum(['PLANNED', 'LIVE', 'FINAL'])

// Game event schema
export const GameEventSchema = z.object({
  gameId: z.string(),
  period: z.number().min(1).max(4),
  clockSec: z.number().min(0).max(720), // 12 minutes = 720 seconds
  teamSide: TeamSideSchema,
  playerId: z.string().optional(),
  type: EventTypeSchema,
  meta: z.any().optional(),
  ingestKey: z.string()
})

// Batch event ingest schema
export const BatchEventSchema = z.object({
  events: z.array(GameEventSchema).min(1).max(50) // Limit batch size
})

// Game creation schema
export const CreateGameSchema = z.object({
  teamId: z.string(),
  opponent: z.string().min(1).max(100),
  date: z.string().datetime(),
  venue: z.string().optional()
})

// Game update schema
export const UpdateGameSchema = z.object({
  status: GameStatusSchema.optional(),
  period: z.number().min(1).max(4).optional(),
  clockSec: z.number().min(0).max(720).optional(),
  ourScore: z.number().min(0).optional(),
  oppScore: z.number().min(0).optional(),
  // Support atomic increments to prevent race conditions
  incrementOurScore: z.number().optional(),
  incrementOppScore: z.number().optional()
}).refine(
  (data) => {
    // Can't use both absolute and increment for the same score
    if (data.ourScore !== undefined && data.incrementOurScore !== undefined) {
      return false;
    }
    if (data.oppScore !== undefined && data.incrementOppScore !== undefined) {
      return false;
    }
    return true;
  },
  { message: "Cannot use both absolute score and increment for the same team" }
)

// Player creation schema
export const CreatePlayerSchema = z.object({
  teamId: z.string(),
  jersey: z.number().min(0).max(99),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  position: z.string().max(10).optional(),
  active: z.boolean().default(true)
})

// Team creation schema
export const CreateTeamSchema = z.object({
  name: z.string().min(1).max(100),
  season: z.string().min(4).max(20)
})