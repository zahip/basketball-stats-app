# Full-Stack Starter Template

A production-ready full-stack web application starter built with modern technologies.

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful UI components
- **React Query** - Data fetching and caching
- **Dexie** - IndexedDB wrapper for offline storage
- **PWA** - Progressive Web App support

### Backend
- **Hono** - Lightweight web framework
- **Prisma** - Type-safe ORM
- **PostgreSQL** - Relational database
- **Supabase** - Auth and real-time infrastructure
- **TypeScript** - Type safety

### Infrastructure
- **Supabase Auth** - JWT-based authentication
- **Supabase Realtime** - WebSocket-based real-time updates
- **CORS** - Cross-origin resource sharing
- **Sentry** - Error tracking (optional)

## Project Structure

```
basketball-stats-app/
├── api/                          # Backend (Hono)
│   ├── src/
│   │   ├── index.ts             # Server entry point
│   │   ├── middleware/          # Auth, CORS, idempotency
│   │   └── lib/
│   │       ├── db.ts            # Prisma client
│   │       └── supabase.ts      # Supabase client
│   ├── prisma/
│   │   └── schema.prisma        # Database schema
│   └── package.json
│
├── web/                          # Frontend (Next.js)
│   ├── src/
│   │   ├── app/                 # Next.js App Router
│   │   │   ├── page.tsx         # Home page
│   │   │   ├── layout.tsx       # Root layout
│   │   │   └── globals.css      # Global styles
│   │   ├── components/
│   │   │   └── ui/              # shadcn/ui components
│   │   ├── lib/
│   │   │   ├── api-client.ts    # API fetch wrapper
│   │   │   ├── supabase.ts      # Supabase client
│   │   │   ├── db.ts            # Dexie setup
│   │   │   ├── providers.tsx    # React Query + Auth
│   │   │   └── utils.ts         # Utilities
│   │   └── hooks/
│   │       └── use-toast.ts     # Toast notifications
│   └── package.json
│
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- PostgreSQL database (or use Supabase/Neon)
- Supabase project (for auth and realtime)

### 1. Setup Environment Variables

#### Backend (`api/.env`)
```bash
# Copy example
cp api/.env.example api/.env

# Edit with your values
DATABASE_URL="postgresql://user:password@host:5432/database"
DIRECT_URL="postgresql://user:password@host:5432/database"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_KEY="your-service-key"
PORT=3002
FRONTEND_URL="http://localhost:3000"
```

#### Frontend (`web/.env.local`)
```bash
# Copy example
cp web/.env.example web/.env.local

# Edit with your values
NEXT_PUBLIC_API_URL="http://localhost:3002"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

### 2. Install Dependencies

```bash
# Install all dependencies
cd api && pnpm install
cd ../web && pnpm install
```

### 3. Setup Database

```bash
cd api

# Generate Prisma client
pnpm db:generate

# Run migrations (if you have any)
pnpm db:migrate

# Or push schema directly (for development)
pnpm db:push
```

### 4. Run Development Servers

```bash
# Terminal 1: Backend
cd api
pnpm dev
# Runs on http://localhost:3002

# Terminal 2: Frontend
cd web
pnpm dev
# Runs on http://localhost:3000
```

### 5. Open in Browser

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## Available Scripts

### Backend (api/)
```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Prisma Studio
```

### Frontend (web/)
```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm type-check       # Run TypeScript compiler
```

## Features

### Built-in Infrastructure
- ✅ Type-safe API and database layer
- ✅ Authentication ready (Supabase Auth)
- ✅ Real-time updates (Supabase Realtime)
- ✅ Offline support (Dexie IndexedDB)
- ✅ API client with auth headers
- ✅ CORS middleware
- ✅ Idempotency middleware
- ✅ PWA support (service worker, manifest)
- ✅ Toast notifications
- ✅ Dark mode ready (via Tailwind CSS variables)
- ✅ Responsive design
- ✅ shadcn/ui component library

## Customization

### Add Database Models

Edit `api/prisma/schema.prisma`:
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
}
```

Then run:
```bash
cd api
pnpm db:migrate
pnpm db:generate
```

### Add API Routes

Create a new route in `api/src/routes/`:
```typescript
import { Hono } from 'hono'
import { prisma } from '@/lib/db'

export const users = new Hono()

users.get('/', async (c) => {
  const users = await prisma.user.findMany()
  return c.json(users)
})
```

Then mount it in `api/src/index.ts`:
```typescript
import { users } from './routes/users'
app.route('/users', users)
```

### Add Frontend Pages

Create a new page in `web/src/app/`:
```typescript
// web/src/app/users/page.tsx
export default function UsersPage() {
  return <div>Users</div>
}
```

## Deployment

### Backend
Deploy to Fly.io, Render, Railway, or any Node.js hosting:
```bash
cd api
pnpm build
pnpm start
```

### Frontend
Deploy to Vercel, Netlify, or any static hosting:
```bash
cd web
pnpm build
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Hono Documentation](https://hono.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

## License

MIT
