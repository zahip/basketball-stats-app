# Basketball Stats App

A production-grade PWA for tracking live basketball game statistics. Built with Next.js frontend and Hono backend.

## Tech Stack

### Frontend (`web/`)
- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query + Zustand
- **Offline Support**: Dexie (IndexedDB)
- **PWA**: next-pwa
- **Charts**: Recharts + react-konva (shot charts)
- **Auth**: Supabase Auth

### Backend (`api/`)
- **Framework**: Hono + TypeScript
- **Database**: Postgres (Supabase/Neon) + Prisma ORM
- **Validation**: Zod
- **Realtime**: Supabase Realtime
- **Monitoring**: Sentry

## Project Structure

```
basketball-stats-app/
├── web/                    # Next.js frontend
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   └── lib/          # Utilities, stores, database
│   ├── public/           # Static assets
│   └── package.json
├── api/                   # Hono backend
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── lib/          # Database, validation, utilities
│   │   └── middleware/   # Auth, logging, etc.
│   ├── prisma/           # Database schema & migrations
│   └── package.json
└── README.md
```

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Supabase account)

### 1. Environment Setup

#### Frontend (.env.local)
```bash
cp web/.env.example web/.env.local
# Edit with your Supabase credentials
```

#### Backend (.env)
```bash
cp api/.env.example api/.env
# Edit with your database and Supabase credentials
```

### 2. Install Dependencies

```bash
# Frontend
cd web
npm install

# Backend  
cd ../api
npm install
```

### 3. Database Setup

```bash
# In api/ directory
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed with sample data
```

### 4. Run Development Servers

```bash
# Terminal 1 - Backend (API)
cd api
npm run dev          # Runs on http://localhost:3001

# Terminal 2 - Frontend (Web)
cd web
npm run dev          # Runs on http://localhost:3000
```

## Key Features

### Live Game Tracking
- Real-time event recording (shots, rebounds, assists, etc.)
- Offline-first with automatic sync
- Touch-optimized interface for tablets
- Undo last event functionality

### Statistics & Reporting
- Live box scores (team & player)
- Four factors analysis (eFG%, TS%, etc.)
- Shot charts with court visualization
- Export to PDF

### Offline Support
- Events queued in IndexedDB when offline
- Background sync with exponential backoff
- Optimistic UI updates

### Realtime Updates
- Multiple devices can view same game
- Supabase Realtime for instant updates
- Role-based access (coach, scorer, viewer)

## API Endpoints

```
GET    /health                        # Health check
GET    /teams/:teamId/players         # Get team players
POST   /teams/:teamId/players         # Create player
POST   /games                         # Create game
GET    /games/:gameId                 # Get game details
PATCH  /games/:gameId                 # Update game state
POST   /games/:gameId/events          # Record events (with idempotency)
GET    /games/:gameId/events          # Get play-by-play
GET    /games/:gameId/boxscore/team   # Get team stats
GET    /games/:gameId/boxscore/players # Get player stats
```

## Deployment

### Frontend (Vercel)
```bash
cd web
npm run build
# Deploy to Vercel
```

### Backend (Fly.io/Render)
```bash
cd api
npm run build
# Deploy to your preferred platform
```

## Testing

```bash
# API tests
cd api
npm test

# E2E tests (Playwright)
cd web  
npm run test:e2e
```

## Next Steps

After STEP 1 completion, proceed with:
- STEP 2: Prisma schema and migrations
- STEP 3: API routes implementation
- STEP 4: Realtime broadcasting
- STEP 5: Authentication setup
- STEP 6: Live game screen
- STEP 7: Game reports
- STEP 8: Testing and monitoring
- STEP 9: Polish and deployment

---

## STEP 1 Complete ✅

**File Tree:**
```
basketball-stats-app/
├── web/                           # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── games/page.tsx
│   │   │   └── players/page.tsx
│   │   ├── components/ui/
│   │   │   ├── button.tsx
│   │   │   └── card.tsx
│   │   └── lib/
│   │       ├── providers.tsx
│   │       ├── store.ts
│   │       ├── db.ts
│   │       └── utils.ts
│   ├── public/
│   │   ├── manifest.json
│   │   ├── icon-192x192.png
│   │   └── icon-512x512.png
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── components.json
│   └── .env.example
├── api/                           # Hono Backend
│   ├── src/
│   │   ├── routes/               # (Ready for STEP 3)
│   │   ├── lib/
│   │   │   ├── db.ts
│   │   │   ├── supabase.ts
│   │   │   └── validation.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   └── idempotency.ts
│   │   └── index.ts
│   ├── prisma/                   # (Ready for STEP 2)
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
└── README.md
```

Ready for **"continue"** to proceed to STEP 2! 🏀# basketball-stats-app
