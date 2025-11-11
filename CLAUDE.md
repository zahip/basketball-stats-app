# Basketball Stats App - Codebase Guide

A production-grade PWA for tracking live basketball game statistics. This document provides comprehensive information for Claude instances to understand the architecture and development workflows.

## Quick Facts

- **Frontend**: Next.js 15 (App Router) with React 18 + TypeScript
- **Backend**: Hono lightweight framework with Prisma ORM
- **Database**: PostgreSQL (Supabase/Neon) with full TypeScript support
- **Real-time**: Supabase Realtime with hybrid broadcast + database fallback
- **Offline**: Dexie (IndexedDB) for offline event queuing with exponential backoff
- **Auth**: Supabase Auth with JWT tokens
- **Styling**: Tailwind CSS + shadcn/ui components

---

## Project Structure

```
basketball-stats-app/
├── web/                              # Next.js Frontend (port 3000)
│   ├── src/
│   │   ├── app/                     # Next.js 15 App Router
│   │   │   ├── (auth)/              # Authentication pages
│   │   │   ├── games/
│   │   │   │   ├── page.tsx         # Games list
│   │   │   │   ├── new/page.tsx     # Create game form
│   │   │   │   └── [id]/live/page.tsx  # MAIN: Live game tracking with optimistic updates
│   │   │   └── players/page.tsx     # Player management
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn/ui components
│   │   │   ├── game/                # Game components (header, actions, box-score, play-by-play)
│   │   │   ├── auth/                # Auth components
│   │   │   └── layout/              # Layout wrappers
│   │   ├── hooks/
│   │   │   ├── use-realtime-game.ts # CRITICAL: Real-time subscriptions & broadcast logic
│   │   │   └── use-toast.ts         # Toast notifications
│   │   └── lib/
│   │       ├── offline-queue.ts     # CRITICAL: Dexie offline event queue + sync
│   │       ├── api-client.ts        # Fetch wrapper with auth headers
│   │       ├── supabase.ts          # Supabase client init
│   │       ├── stores/              # Zustand stores (players state)
│   │       └── db.ts                # Dexie database init
│   ├── public/                      # PWA assets, icons, manifest
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js               # PWA config
│   └── .env.example
│
├── api/                              # Hono Backend (port 3002)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── games.ts             # CRUD endpoints, atomic increments
│   │   │   ├── events.ts            # CRITICAL: Event ingestion with batch support
│   │   │   ├── boxscore.ts          # Stats calculation endpoints
│   │   │   └── teams.ts             # Team/player endpoints
│   │   ├── lib/
│   │   │   ├── db.ts                # Prisma client
│   │   │   ├── supabase.ts          # Real-time broadcast functions
│   │   │   ├── validation.ts        # Zod schemas for all inputs
│   │   │   ├── boxscore.ts          # Box score calculation logic
│   │   │   └── seed.ts              # Database seeding
│   │   ├── middleware/
│   │   │   ├── auth.ts              # JWT verification (Supabase)
│   │   │   └── idempotency.ts       # Idempotency key deduplication
│   │   └── index.ts                 # Express-like app setup
│   ├── prisma/
│   │   ├── schema.prisma            # CRITICAL: Data model & enums
│   │   └── migrations/              # Database version control
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── REALTIME_SETUP.md                # Supabase Realtime configuration guide
├── QUICK_START.md                   # Quick 2-minute setup instructions
└── README.md                        # Main documentation

```

---

## Database Schema (Prisma)

### Core Models

```prisma
// Teams with multiple players and games
model Team {
  id        String   @id @default(cuid())
  name      String
  season    String
  createdAt DateTime @default(now())
  players   Player[]
  games     Game[]
}

// Players linked to teams (jersey number unique per team)
model Player {
  id        String  @id @default(cuid())
  teamId    String
  jersey    Int     // 0-99
  firstName String
  lastName  String
  position  String?
  active    Boolean @default(true)
  team      Team    @relation(fields: [teamId], references: [id], onDelete: Cascade)
  @@unique([teamId, jersey])
}

// Games tracking scores and metadata
model Game {
  id         String      @id @default(cuid())
  teamId     String
  opponent   String      // Opponent name (free text)
  date       DateTime
  venue      String?
  status     GameStatus  @default(PLANNED)  // PLANNED | LIVE | FINAL
  period     Int         @default(1)        // 1-4
  clockSec   Int         @default(600)      // Seconds left in period
  ourScore   Int         @default(0)        // US team score
  oppScore   Int         @default(0)        // Opponent score
  createdAt  DateTime    @default(now())
  team       Team        @relation(fields: [teamId], references: [id], onDelete: Cascade)
  events     GameEvent[]
}

// Play-by-play events (shots, rebounds, assists, etc.)
model GameEvent {
  id        String    @id @default(cuid())
  gameId    String
  tsServer  DateTime  @default(now())
  period    Int       // 1-4
  clockSec  Int       // Time left when recorded
  teamSide  TeamSide  // US (our team) or OPP (opponent)
  playerId  String?   // Optional: player jersey number or UUID
  type      EventType // See enum below
  meta      Json?     // Additional event data
  ingestKey String    // Idempotency key (UUID)
  game      Game      @relation(fields: [gameId], references: [id], onDelete: Cascade)
  @@unique([gameId, ingestKey])  // Prevents duplicate events
  @@index([gameId, tsServer])
}

// Box score tracking per player per game
model BoxScorePlayer {
  id        String @id @default(cuid())
  gameId    String
  playerId  String
  // Stats
  minutes   Int @default(0)
  pts       Int @default(0)
  fgm2      Int @default(0)  // 2-point makes
  fga2      Int @default(0)  // 2-point attempts
  fgm3      Int @default(0)  // 3-point makes
  fga3      Int @default(0)  // 3-point attempts
  ftm       Int @default(0)  // Free throw makes
  fta       Int @default(0)  // Free throw attempts
  oreb      Int @default(0)  // Offensive rebounds
  dreb      Int @default(0)  // Defensive rebounds
  ast       Int @default(0)  // Assists
  stl       Int @default(0)  // Steals
  blk       Int @default(0)  // Blocks
  tov       Int @default(0)  // Turnovers
  pf        Int @default(0)  // Personal fouls
  plusMinus Int @default(0)  // +/-
  @@unique([gameId, playerId])
}

// Team box scores (aggregate of players)
model BoxScoreTeam {
  id       String   @id @default(cuid())
  gameId   String
  teamSide TeamSide // US or OPP
  // Stats (same as player but for whole team)
  pts      Int @default(0)
  fgm2     Int @default(0)
  fga2     Int @default(0)
  fgm3     Int @default(0)
  fga3     Int @default(0)
  ftm      Int @default(0)
  fta      Int @default(0)
  oreb     Int @default(0)
  dreb     Int @default(0)
  ast      Int @default(0)
  stl      Int @default(0)
  blk      Int @default(0)
  tov      Int @default(0)
  pf       Int @default(0)
  @@unique([gameId, teamSide])
}

// Enums
enum GameStatus {
  PLANNED
  LIVE
  FINAL
}

enum EventType {
  SHOT_2_MADE
  SHOT_2_MISS
  SHOT_3_MADE
  SHOT_3_MISS
  FT_MADE
  FT_MISS
  REB_O        // Offensive rebound
  REB_D        // Defensive rebound
  AST          // Assist
  STL          // Steal
  BLK          // Block
  TOV          // Turnover
  FOUL         // All types of fouls
  SUB_IN       // Substitution in
  SUB_OUT      // Substitution out
  TIMEOUT      // Team timeout
  START_PERIOD // Start of period
  END_PERIOD   // End of period
}

enum TeamSide {
  US           // Our team
  OPP          // Opponent
}
```

---

## Architecture Patterns

### 1. Real-time System: Hybrid Architecture

The app implements a **three-layer real-time strategy** to prevent stale updates and ensure instant feedback:

#### Layer 1: Optimistic Updates (Immediate Feedback)
```typescript
// web/src/app/games/[id]/live/page.tsx (lines 88-170)
onMutate: async (updatedData) => {
  // 1. Immediately update current tab's React Query cache
  queryClient.setQueryData(["game", gameId], oldData => ({
    ...oldData,
    game: {
      ...oldData.game,
      ourScore: oldData.game.ourScore + incrementOurScore
    }
  }));
  
  // 2. Broadcast optimistic score to OTHER tabs via Supabase
  broadcastScoreUpdate({
    ourScore: optimisticScore,
    oppScore: optimisticOppScore,
    // ...
  });
}
```
**Result**: Score updates immediately visible in current tab AND broadcast to other tabs BEFORE server responds.

#### Layer 2: Authoritative Broadcast (Server Confirmation)
```typescript
// After server responds with committed data
onSuccess: async (data) => {
  // Update cache with authoritative data
  queryClient.setQueryData(["game", gameId], data);
  
  // Broadcast confirmed score to other tabs
  broadcastScoreUpdate(data);
}
```
**Result**: Authoritative confirmation broadcasted, ensures all tabs have correct data.

#### Layer 3: Stale Update Prevention
```typescript
// Broadcast channel listening (web/src/hooks/use-realtime-game.ts, lines 64-91)
.on("broadcast", { event: "score_update" }, (payload) => {
  setGameState((currentState) => {
    // REJECT if incoming score < current score (stale update)
    if (payload.payload.ourScore < currentState.homeScore) {
      console.log("⏭️ Ignoring stale broadcast");
      return currentState;  // Keep current state unchanged
    }
    return { ...currentState, homeScore: payload.payload.ourScore };
  });
});

// Same protection in Postgres fallback channel (lines 125-135)
```
**Result**: Stale updates automatically rejected at 3 levels:
1. **Sender (onSuccess)**: Skips broadcast if cache already ahead
2. **Receiver (broadcast handler)**: Ignores lower scores
3. **Cache sync**: Checks if update is stale before applying

#### Flow Diagram
```
User records +3 in Tab 1 (current score: 54)
  ↓
⚡ OPTIMISTIC: Cache = 57, broadcast sent immediately
  │         Tab 2 sees 57 NOW (from broadcast)
  │         Tab 3 sees 57 NOW (from broadcast)
  │
  └─→ API: PATCH /games/:id { incrementOurScore: 3 }
      ↓
      DB: UPDATE games SET ourScore = ourScore + 3 (atomic)
      ↓
      RESPONSE: { game: { ourScore: 57, ... } }
      ↓
      onSuccess: Cache updated, authoritative broadcast sent
      ↓
      All tabs confirm: score = 57 ✅
```

### 2. Concurrent Update Safety with Atomic Increments

**Problem**: Multiple tabs clicking rapidly (54→56→58) causes race conditions.

**Solution**: Atomic database increments
```typescript
// api/src/routes/games.ts (lines 75-88)
if (validatedData.incrementOurScore !== undefined) {
  updateData.ourScore = { increment: validatedData.incrementOurScore }
}
// Prisma translates to: UPDATE games SET ourScore = ourScore + 3
```

**Example with 2 concurrent updates:**
- Tab A: incrementOurScore: 2 (54 → 56)
- Tab B: incrementOurScore: 2 (54 → 56)
- Database: 54 + 2 + 2 = **58** ✅ (correct)

Without atomic increments:
- Both tabs see 54, send ourScore: 56
- Result: 56 ❌ (one increment lost)

### 3. Offline Queue with Event Processing

#### Architecture: Dexie IndexedDB Queue
```typescript
// web/src/lib/offline-queue.ts

class OfflineQueue extends Dexie {
  events!: Table<QueuedEvent>
  constructor() {
    super('BasketballStatsQueue')
    this.version(1).stores({
      events: '++id, gameId, status, timestamp, ingestKey'
    })
  }
}
```

#### Event Recording Flow
```
User: "Player #23 made 3-pointer"
  ↓
→ addEvent(gameId, 'SHOT_3_MADE', '23', 'home', {period: 2, clockSec: 350})
  ├─ Create QueuedEvent with ingestKey (UUID)
  ├─ Store in Dexie (offline: IndexedDB)
  ├─ Try sync immediately if online
  │  ├─ Map event types: 'SHOT_3_MADE' → backend enum (already correct)
  │  ├─ Map team side: 'home' → 'US'
  │  ├─ POST to /games/:id/events with X-Idempotency-Key header
  │  ├─ If success: mark as 'synced' in Dexie
  │  └─ If failed: keep as 'pending' in Dexie
  ├─ If offline: event stays 'pending' until online
  └─ When online: Auto-sync from localStorage
```

#### Event Type Mapping
```typescript
// web/src/lib/offline-queue.ts (lines 34-58)
private mapEventType(eventType: string): string {
  const mapping: Record<string, string> = {
    'field_goal_made': 'SHOT_2_MADE',       // Legacy support
    'field_goal_missed': 'SHOT_2_MISS',
    'three_point_made': 'SHOT_3_MADE',
    'three_point_missed': 'SHOT_3_MISS',
    'free_throw_made': 'FT_MADE',
    'free_throw_missed': 'FT_MISS',
    // ... more mappings
  }
  return mapping[eventType] || eventType  // Passthrough if already correct
}
```
**GOTCHA**: Frontend uses `'SHOT_3_MADE'`, backend uses `EventType` enum. Mapping is done BEFORE sending to API.

#### Event Payload Structure
```typescript
// api/src/routes/events.ts (lines 20-33)
const eventPayload = {
  gameId: event.gameId,
  type: mappedEventType,              // EventType enum
  playerId: event.playerId,           // Jersey number as string
  period: 1,
  clockSec: 600,
  teamSide: event.team === 'home' ? 'US' : 'OPP',  // CRITICAL: 'home'→'US'
  meta: { /* custom data */ },
  ingestKey: uuidv4()                 // Idempotency key
}

// Sent as: { events: [eventPayload] }  // ARRAY format
```

### 4. Event Ingestion & Idempotency

#### Batch Event Processing
```typescript
// api/src/routes/events.ts (lines 15-123)
POST /games/:gameId/events
Body: {
  events: [
    { gameId, type, playerId, period, clockSec, teamSide, ingestKey },
    { gameId, type, playerId, period, clockSec, teamSide, ingestKey },
    // ... up to 50 events per batch
  ]
}
```

#### Idempotency Mechanism
```typescript
// api/src/middleware/idempotency.ts
// Header: X-Idempotency-Key: <UUID>
// 
// 1. Check if key exists in cache
// 2. If yes: return cached response (same status + body)
// 3. If no: process request normally
// 4. Cache successful response (2xx status only)
// 5. Auto-cleanup cached keys after 1 hour
```

**Database Backup**: `GameEvent` has unique constraint `@@unique([gameId, ingestKey])`
- If duplicate ingestKey: PostgreSQL prevents duplicate, returns 409 Conflict
- Idempotency middleware catches: prevents API-level race conditions

#### Transaction Safety
```typescript
// api/src/routes/events.ts (lines 46-76)
result = await prisma.$transaction(async (tx) => {
  // 1. Create all events atomically
  for (const eventData of eventsToProcess) {
    const event = await tx.gameEvent.create({ data: eventData })
  }
  
  // 2. Recalculate box scores (aggregates stats from events)
  await calculateBoxScores(gameId, tx)
  
  // 3. Update game scores from box scores
  const gameUpdate = await updateGameScores(gameId, tx)
  
  return { events: createdEvents, gameUpdate }
}, {
  maxWait: 10000,  // Wait up to 10s for transaction slot
  timeout: 20000   // Transaction times out at 20s
})
```

#### Post-Event Broadcasting
```typescript
// After transaction completes successfully
for (const event of result.events) {
  await broadcastGameEvent(gameId, {
    type: "event:new",
    payload: event
  })
}

if (result.gameUpdate) {
  await broadcastGameHeader(gameId, {
    type: "header:update",
    payload: result.gameUpdate
  })
}
```

---

## Key Technical Decisions

### 1. Event Type Enum Matching

**Frontend → Backend Conversion**:
```typescript
// Frontend uses string literals or enum values
'SHOT_3_MADE', 'SHOT_2_MADE', 'FT_MADE', etc.

// Offline queue has legacy mapping (backwards compat)
mapEventType('three_point_made') → 'SHOT_3_MADE'

// Backend validates against Zod enum
EventTypeSchema = z.enum(['SHOT_2_MADE', 'SHOT_3_MADE', ...])
```

**Gotcha**: Don't mix old `'field_goal_made'` with new `'SHOT_2_MADE'` format. Use mapping function or be consistent.

### 2. Player ID Format

**Current Implementation**:
- Player.id in database: CUID (universally unique)
- QueuedEvent.playerId: Jersey number as STRING ('23', '5', etc.)
- Backend playerId field: Optional, can be jersey or UUID

**Why Jersey Numbers?**:
- Easier for UI/UX (display jersey on quick tap)
- More natural for coaches/scorers
- Matches traditional box score format

**Migration Path if needed**:
- Store both: `playerId: string (CUID), jerseyNumber: number (0-99)`
- Update offline queue to use CUID
- Backend can accept either format with mapping

### 3. Team Side Mapping: 'home'/'away' → 'US'/'OPP'

Frontend naming:
```typescript
team: 'home' | 'away'  // In offline queue
```

Backend naming:
```typescript
TeamSide.US   // Our team
TeamSide.OPP  // Opponent
```

Conversion happens in offline-queue.ts:
```typescript
teamSide: event.team === 'home' ? 'US' : 'OPP'
```

**Why different names?**:
- Frontend: 'home'/'away' is relative to screen (more UI-natural)
- Backend: 'US'/'OPP' is absolute (clearer semantics in database)

### 4. Atomic Score Increments

Prevents race conditions in concurrent updates:

```typescript
// WRONG: Absolute assignment
{ ourScore: 56 }
// If two tabs do this simultaneously, one update is lost

// CORRECT: Atomic increment
{ incrementOurScore: 3 }
// Prisma: UPDATE games SET ourScore = ourScore + 3
// Multiple concurrent updates all apply correctly
```

---

## Development Workflows

### 1. Running the Application

#### Quick Start (2 minutes, no database):
```bash
# Terminal 1: API (development mode, no auth)
cd api
pnpm install
pnpm dev
# Runs on http://localhost:3002
# ⚠️ Supabase realtime: Not configured (development mode)
# 🔓 Authentication: Disabled (development mode)

# Terminal 2: Frontend
cd web
pnpm install
pnpm dev
# Runs on http://localhost:3000
```

#### Full Setup with Database:

```bash
# 1. Setup environment variables
cp api/.env.example api/.env
# Edit api/.env with database credentials

cp web/.env.example web/.env.local
# Already configured for demo Supabase project

# 2. Generate Prisma client
cd api
pnpm db:generate

# 3. Run migrations (creates tables)
pnpm db:migrate

# 4. Seed sample data
pnpm db:seed

# 5. Start servers
pnpm dev    # API on 3002
# In another terminal:
cd web
pnpm dev    # Frontend on 3000
```

### 2. Database Commands

```bash
cd api

# Generate Prisma client (after schema changes)
pnpm db:generate

# Push schema to database (non-versioned, for dev only)
pnpm db:push

# Create migration file (versioned, for production)
pnpm db:migrate

# Deploy existing migrations (production)
pnpm db:migrate:deploy

# Reset database (DESTRUCTIVE - deletes all data)
pnpm db:reset

# Seed with sample data
pnpm db:seed

# Open Prisma Studio (web GUI for data)
pnpm db:studio

# Check migration status
pnpm db:status
```

### 3. Testing

```bash
# API tests
cd api
pnpm test           # Watch mode
pnpm test:unit      # Single run
pnpm test:db        # Test database connection
pnpm test:boxscore  # Test box score calculation
pnpm test:realtime  # Test Supabase Realtime
pnpm test:broadcast # Test broadcasting

# Demo/learning
pnpm demo:realtime  # Interactive Supabase Realtime demo
```

### 4. Build & Deployment

```bash
# Frontend (Vercel or self-hosted)
cd web
pnpm build          # Next.js build
pnpm start          # Production server

# API (Fly.io, Render, or self-hosted)
cd api
pnpm build          # TypeScript compile
pnpm start          # Node server on port 3002
```

---

## Environment Variables

### Frontend (`web/.env.local`)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3002

# Supabase (for auth + realtime)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://...

# PWA
NEXT_PUBLIC_APP_NAME="Basketball Stats"
NEXT_PUBLIC_APP_DESCRIPTION="Live basketball game statistics tracking"
```

### Backend (`api/.env`)
```bash
# Server
PORT=3002
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://user:password@host:5432/basketball_stats"
DIRECT_URL="postgresql://user:password@host:5432/basketball_stats"
# Note: DATABASE_URL uses pgbouncer (connection pooling)
#       DIRECT_URL is direct connection (for migrations)

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional
SENTRY_DSN=https://...
JWT_SECRET=your-secret-key
```

---

## Important Gotchas

### 1. Real-time Stale Update Prevention

**Problem**: Tab A records 54→56, Tab B receives 54→58. If Tab A's response (56) arrives after Tab B's broadcast (58), it would revert to 56.

**Solution**: Three-layer protection
1. **onSuccess layer**: Check `data.ourScore >= currentCacheData.game.ourScore` before updating
2. **Broadcast receiver**: Reject incoming scores lower than current state
3. **Cache sync**: 2-second window check to ignore realtime updates after mutations

**Code locations**:
- Sender protection: `page.tsx` lines 172-209
- Receiver protection: `use-realtime-game.ts` lines 68-91, 125-135
- Cache sync protection: `page.tsx` lines 254-262

### 2. Event Type Enum Matching

**Problem**: Frontend sends `'three_point_made'`, backend expects `'SHOT_3_MADE'`.

**Solution**: `EventQueueManager.mapEventType()` converts old format to new format.

**Current Status**: 
- New code should use `'SHOT_3_MADE'` format (PascalCase, backend enum)
- Mapping handles legacy `'three_point_made'` format
- Passthrough works: if already `'SHOT_3_MADE'`, returns unchanged

### 3. Player ID Format Consistency

**Gotcha**: Offline queue stores jersey number as string, but playerId field in database can be UUID.

**Current Implementation**:
```typescript
await eventQueueManager.addEvent(
  gameId,
  'SHOT_3_MADE',
  player.number.toString(),  // '23' not player.id (UUID)
  'home'
)
```

**Why**: Jersey numbers are easier to use in UI, and the backend's playerId field is optional anyway.

**If you need to change**: Update `player.number.toString()` → `player.id` in `page.tsx` line 367.

### 4. Team Side Mapping

**Gotcha**: Frontend uses 'home'/'away', backend uses 'US'/'OPP'.

**Conversion happens at**: `offline-queue.ts` line 200
```typescript
teamSide: event.team === 'home' ? 'US' : 'OPP'
```

**Your team is always 'home'/'US'** (never opponent).

### 5. Idempotency Key Format

**Must be**: UUID or any unique string per event.

**Generated at**: `offline-queue.ts` line 61
```typescript
const ingestKey = uuidv4()  // Always create new unique key
```

**Must send**: In HTTP header `X-Idempotency-Key: <ingestKey>`

**Database backup**: `@@unique([gameId, ingestKey])` prevents duplicates even if header fails.

### 6. Box Score Calculation

**Automatic on event ingestion**: `events.ts` line 61
```typescript
await calculateBoxScores(gameId, tx)
```

**Recalculates entire box score from scratch** (sums all relevant events).

**Game scores updated from box scores**: `events.ts` line 67
```typescript
const gameUpdate = await updateGameScores(gameId, tx)
// Sets game.ourScore and game.oppScore from BoxScoreTeam entries
```

---

## Realtime System Details

### Supabase Configuration

**Requires**:
1. Realtime enabled at project level (Settings → API → Enable Realtime)
2. `games` table in replication publication (Database → Replication → Enable for "games")
3. Environment variables set with valid Supabase credentials

**Verify with**:
```sql
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
-- Should include: public | games
```

### Broadcast Channels

**Used for instant fan-out**:
```typescript
// Frontend subscribes
supabase.channel(`game_${gameId}`)
  .on('broadcast', { event: 'score_update' }, callback)
  .on('broadcast', { event: 'game_event' }, callback)
  .subscribe()

// Backend sends
supabase.channel(`game:${gameId}`).send({
  type: 'broadcast',
  event: 'score_update',
  payload: { ourScore, oppScore, ... }
})
```

### Postgres Changes (Fallback)

**Listens to actual database changes**:
```typescript
supabase.channel(`game_${gameId}_postgres`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'games',
    filter: `id=eq.${gameId}`
  }, callback)
  .subscribe()
```

**Why both?**:
- Broadcast: Instant, best for real-time UI updates
- Postgres: Reliable fallback, ensures sync even if broadcast fails

---

## API Endpoints

### Health & Info
```
GET /health                 # Health check
GET /                       # API info
```

### Teams
```
GET /teams                  # List teams (if endpoint exists)
GET /teams/:teamId          # Get team details
GET /teams/:teamId/players  # Get team's players
POST /teams/:teamId/players # Create player (auth required)
```

### Games
```
GET /games                  # List games (filter: ?teamId=X&status=LIVE)
POST /games                 # Create game (auth required)
GET /games/:gameId          # Get game details
PATCH /games/:gameId        # Update game (atomic increments supported)
```

### Events
```
POST /games/:gameId/events  # Ingest events (batch or single)
GET /games/:gameId/events   # Get play-by-play (filter: ?period=2&limit=50)
```

### Box Scores
```
GET /games/:gameId/boxscore           # Complete box score (team + players)
GET /games/:gameId/boxscore/team      # Team stats with advanced stats
GET /games/:gameId/boxscore/players   # Player stats with advanced stats
GET /games/:gameId/boxscore/summary   # Four factors analysis (eFG%, TS%, etc.)
```

---

## Common Tasks

### Add a New Event Type

1. **Update Prisma schema** (`api/prisma/schema.prisma`):
```prisma
enum EventType {
  // ... existing types
  NEW_EVENT_TYPE
}
```

2. **Run migration**:
```bash
cd api
pnpm db:migrate
```

3. **Update validation schema** (`api/src/lib/validation.ts`):
```typescript
export const EventTypeSchema = z.enum([
  'SHOT_2_MADE',
  // ...
  'NEW_EVENT_TYPE'
])
```

4. **Update offline queue mapping** if needed (`web/src/lib/offline-queue.ts`):
```typescript
private mapEventType(eventType: string): string {
  const mapping: Record<string, string> = {
    'legacy_format': 'NEW_EVENT_TYPE',
    // ...
  }
  return mapping[eventType] || eventType
}
```

5. **Update box score calculation** if it affects stats (`api/src/lib/boxscore.ts`).

### Test Event Ingestion Offline

1. **Open game in browser** (`http://localhost:3000/games/[gameId]/live`)
2. **Disable network** (DevTools → Network → Offline)
3. **Record events** (they'll be queued in Dexie)
4. **Check IndexedDB** (DevTools → Application → IndexedDB → BasketballStatsQueue)
5. **Enable network** and events auto-sync
6. **Check console** for sync success messages

### Debug Realtime Issues

```typescript
// Check browser console for these messages:
console.log(`📡 Setting up Supabase Realtime for game: ${gameId}`)
console.log("🔥 Score update broadcast received:", payload)
console.log("🔥 Postgres fallback update:", payload)
console.log("⏭️ Ignoring stale broadcast update")

// If not seeing updates:
1. Check network tab → WS connections
2. Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY set
3. Run: SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime'
4. Ensure 'games' table is listed
```

### Performance Optimization

**Current bottlenecks**:
1. **Box score recalculation**: Sums all events every time (O(n) where n = event count)
   - **Fix**: Incremental updates, cache intermediate sums
2. **Idempotency middleware**: In-memory Map (lost on server restart)
   - **Fix**: Use Redis or database for distributed systems
3. **Realtime lag**: Depends on Supabase infrastructure
   - **Fix**: Reduce JSON payload size, batch updates

---

## TypeScript & Build

### Type Checking
```bash
# Frontend
cd web
pnpm type-check        # tsc --noEmit

# Backend
cd api
pnpm lint              # tsc --noEmit
```

### Path Aliases
Both frontend and backend use `@/` to reference src directory:
```typescript
import { supabase } from '@/lib/supabase'       // Resolves to src/lib/supabase
import { Button } from '@/components/ui/button' // Resolves to src/components/ui/button
```

Configured in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

---

## Recent Commits (Architecture Evolution)

The app was incrementally built with these major milestones:

1. **0438acf**: Hybrid real-time architecture with optimistic updates + broadcast + Postgres fallback
2. **d9f9761**: Atomic increments for concurrent update safety
3. **9c9a939**: Supabase Realtime setup docs + LiveGamePage optimistic updates
4. **fce13cd**: Refactor LiveGamePage with react-query integration
5. **ddf84a2**: Add API routes and game creation page

Each commit progressively added more sophisticated real-time handling and offline capabilities.

---

## Testing & Validation

### Validation Layer (Zod)

Frontend (implicit via API):
```typescript
// Accepts any data, backend validates
await gamesApi.update(gameId, { incrementOurScore: 3 })
```

Backend (explicit):
```typescript
// api/src/routes/games.ts (line 66)
const validatedData = UpdateGameSchema.parse(body)
// Throws ZodError if invalid, returns 400
```

### Idempotency Testing

```bash
# From any terminal, test duplicate event:
curl -X POST http://localhost:3002/games/game_1/events \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: test-key-123" \
  -d '{"events": [...]}'

# Send again with same key → should get 409 or cached response
```

---

## Security Notes

### Authentication

- **Frontend → Backend**: Bearer token in Authorization header
- **Token verification**: Supabase JWT (public key verification)
- **Development mode**: Auth disabled when `!isSupabaseConfigured`

### Idempotency

- **Prevents double-charging**: Same UUID = same operation
- **Database unique constraint**: Fallback if middleware fails
- **Cache cleanup**: 1-hour expiration to prevent memory bloat

### CORS

```typescript
// api/src/index.ts
cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
})
```

Only allows requests from configured frontend URL.

---

## Next Steps for Enhancements

1. **Distributed Idempotency**: Replace in-memory Map with Redis
2. **Event Versioning**: Support rolling migrations for event schema changes
3. **Audit Logging**: Track all mutations for compliance
4. **Box Score Caching**: Incremental updates instead of full recalculation
5. **Role-Based Access**: Coach/Scorer/Viewer permissions
6. **Export Formats**: PDF, CSV, JSON export of box scores
7. **Historical Comparison**: Compare this game to season statistics
8. **Mobile Native**: React Native wrapper for iOS/Android

---

## Reference Files

**Architecture/Concepts**:
- `REALTIME_SETUP.md` - Supabase Realtime configuration
- `QUICK_START.md` - 2-minute quick start guide
- `README.md` - Main project documentation

**Key Implementation Files**:
- **Real-time**: `web/src/hooks/use-realtime-game.ts`, `api/src/lib/supabase.ts`
- **Offline**: `web/src/lib/offline-queue.ts`, `web/src/lib/db.ts`
- **Event Processing**: `api/src/routes/events.ts`, `api/src/lib/boxscore.ts`
- **Live Game UI**: `web/src/app/games/[id]/live/page.tsx`
- **Data Model**: `api/prisma/schema.prisma`
- **Validation**: `api/src/lib/validation.ts`

---

**Last Updated**: November 11, 2025
**Version**: 1.0.0
**Status**: Production-ready with offline-first architecture
