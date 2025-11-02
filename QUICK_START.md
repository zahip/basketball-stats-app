# Basketball Stats App - Quick Start

## 🚀 Get Running in 2 Minutes

### 1. API Setup (without database)
```bash
cd api
pnpm install  # or npm install
pnpm dev      # or npm run dev
```

**✅ API will start on http://localhost:3002 in development mode:**
- 📡 Supabase realtime: ⚠️ Not configured (development mode)
- 🔐 Authentication: 🔓 Disabled (development mode)

### 2. Frontend Setup
```bash
cd web
pnpm install  # or npm install
pnpm dev      # or npm run dev
```

**✅ Frontend will start on http://localhost:3000**

### 3. Test API (No Database Required)
```bash
# Health check
curl http://localhost:3002/health

# API info
curl http://localhost:3002/
```

---

## 🗄️ Full Setup with Database

### Option A: Supabase (Recommended)
1. **Create Supabase project**: https://supabase.com
2. **Get credentials** from Settings > API
3. **Update environment**:
   ```bash
   # api/.env
   DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"
   SUPABASE_URL="https://[project-id].supabase.co"
   SUPABASE_SERVICE_KEY="[service-role-key]"
   ```
4. **Run migrations**:
   ```bash
   cd api
   pnpm db:migrate
   pnpm db:seed
   ```

### Option B: Local Postgres
1. **Install PostgreSQL**
2. **Create database**: `createdb basketball_stats`
3. **Update environment**:
   ```bash
   # api/.env
   DATABASE_URL="postgresql://username:password@localhost:5432/basketball_stats"
   ```
4. **Run migrations**:
   ```bash
   cd api
   pnpm db:migrate
   pnpm db:seed
   ```

---

## 🧪 Test with Sample Data

Once database is set up:

```bash
# Get sample team
curl http://localhost:3002/teams/team_1

# Get sample players
curl http://localhost:3002/teams/team_1/players

# Get sample games
curl http://localhost:3002/games

# Get live game stats
curl http://localhost:3002/games/game_2/boxscore
```

---

## 🔧 Development Mode Features

Without Supabase configuration:
- ✅ **All API routes work** (except realtime)
- ✅ **Authentication bypassed** for POST/PATCH routes
- ✅ **Box score calculations** work perfectly
- ✅ **Event ingestion** with idempotency
- ⚠️ **Realtime broadcasting** disabled (logged)

This allows you to develop and test the core functionality without external dependencies!

---

## 📱 Frontend Features Available

Even without backend:
- ✅ **PWA installation**
- ✅ **Offline data storage** (Dexie)
- ✅ **UI components** (shadcn/ui)
- ✅ **State management** (Zustand)

---

## 🎯 What's Working Right Now

- **API**: 16 endpoints, advanced stats, idempotent events
- **Database**: Complete schema with sample data
- **Frontend**: PWA with offline-first architecture
- **Development**: TypeScript, linting, building all work

**Start coding immediately** - database and Supabase can be added later!