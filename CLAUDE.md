# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Basketball statistics tracking application - a monorepo with separate API and Web packages.

- **api/**: Hono REST API (Node.js + TypeScript)
- **web/**: Next.js 15 frontend (React 18 + TypeScript)
- **Database**: PostgreSQL via Supabase with Prisma ORM

## Commands

### API (run from `api/` directory)

```bash
pnpm dev                    # Start dev server (tsx watch, port 3002)
pnpm build                  # TypeScript compile to dist/
pnpm start                  # Run production server

# Database
pnpm db:generate            # Regenerate Prisma client after schema changes
pnpm db:push                # Push schema to database (no migration)
pnpm db:migrate             # Create and apply migration
pnpm db:seed                # Seed with Lakers vs Celtics test data
pnpm db:studio              # Open Prisma Studio GUI

# Testing
pnpm test                   # Vitest watch mode
pnpm test:unit              # Single test run
pnpm lint                   # Type check (tsc --noEmit)
```

### Web (run from `web/` directory)

```bash
pnpm dev                    # Start dev server (port 3000)
pnpm build                  # Production build
pnpm lint                   # ESLint
pnpm type-check             # TypeScript check
```

## Architecture

### Data Flow

```
Frontend (Next.js) → API Client → Hono API → Prisma → PostgreSQL (Supabase)
                                     ↓
                              Supabase Realtime (WebSocket broadcasts)
```

### Database Schema (Prisma)

Four models in `api/prisma/schema.prisma`:
- **Team**: id, name, logoUrl, players[], homeGames[], awayGames[]
- **Player**: id, name, jerseyNumber, position (PG/SG/SF/PF/C), teamId, actions[]
- **Game**: id, homeTeamId, awayTeamId, status (SCHEDULED/LIVE/FINISHED), scoreHome, scoreAway, actions[]
- **Action**: id, gameId, playerId, type (TWO_PT_MAKE/MISS, THREE_PT_MAKE/MISS, REB, AST, STL, BLK, FOUL, TO), quarter, createdAt

### API Routes

- `GET /api/games/:id` - Game with teams, players, recent actions
- `POST /api/actions` - Record action (uses Prisma transaction to update score atomically)

### Frontend Patterns

**State Management**:
- React Query for server state (`useGame`, `useRecordAction` hooks in `web/src/lib/hooks/`)
- React Context for auth (`web/src/lib/auth-context.tsx`)
- Optimistic updates with rollback on error

**Component Architecture**:
- shadcn/ui components in `web/src/components/ui/`
- Domain components use compound pattern (e.g., `PlayerSelector.Root`, `PlayerSelector.Team`)
- Radix UI primitives for accessibility

**Styling**:
- Tailwind CSS with CSS variables (HSL)
- Dark mode via class strategy
- Custom colors: `home-team`, `away-team`, `success`, `destructive`

### Authentication

- Supabase Auth (JWT) in production
- Development bypass: `dev-token` header on API, localStorage mock session on frontend
- RBAC roles: coach, scorer, viewer

## Key Files

| Path | Purpose |
|------|---------|
| `api/src/index.ts` | API entry point, middleware stack |
| `api/src/routes/actions.ts` | Action recording with score transaction |
| `api/src/lib/db.ts` | Prisma client singleton |
| `api/prisma/schema.prisma` | Database models |
| `web/src/app/scout/[gameId]/page.tsx` | Game scouting UI |
| `web/src/lib/hooks/use-game.ts` | React Query hooks with optimistic updates |
| `web/src/lib/api-client.ts` | Fetch wrapper with auth headers |
| `web/src/lib/auth-context.tsx` | Auth provider with dev mode bypass |

## Environment Variables

**API** (`api/.env`):
- `DATABASE_URL` - Supabase pooler connection
- `DIRECT_URL` - Direct connection for migrations
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` - Supabase credentials

**Web** (`web/.env.local`):
- `NEXT_PUBLIC_API_URL` - API base URL (default: http://localhost:3002)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase public credentials

## Development Notes

- API and Web have independent `package.json` files (not a pnpm workspace)
- Next.js 15 uses async `params` in page components: `const { id } = await params`
- Prisma client must be regenerated after schema changes (`pnpm db:generate`)
- Test data: Lakers vs Celtics game with 5 players each (run `pnpm db:seed` in api/)
