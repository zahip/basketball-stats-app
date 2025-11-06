# Supabase Realtime Setup

This guide explains how to enable Supabase Realtime for instant score updates across all tabs.

## Prerequisites

- Supabase project is set up
- Database is connected to Supabase

## Steps to Enable Realtime

### 1. Enable Realtime for the games Table

Go to your Supabase Dashboard and run this SQL query:

```sql
-- Enable realtime for the games table
ALTER PUBLICATION supabase_realtime ADD TABLE "games";
```

Alternatively, you can do this via the Supabase Dashboard UI:

1. Go to **Database** → **Replication**
2. Find the `games` table
3. Toggle **Enable Realtime** to ON

### 2. Verify Realtime is Enabled

Run this query to check:

```sql
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

You should see `games` in the results.

### 3. Test the Setup

1. Open your app in two browser tabs
2. Navigate to a live game in both tabs
3. Update the score in one tab (record a basket)
4. The other tab should update **instantly** without refresh

## How It Works

### Hybrid Architecture: Broadcast + Postgres

The system uses a **hybrid approach** for optimal performance and reliability:

1. **Atomic Increments at Database Level**
   - Score updates use `incrementOurScore` instead of absolute values
   - Prevents race conditions when multiple users update simultaneously
   - Postgres/Prisma handles: `UPDATE games SET ourScore = ourScore + N`

2. **Optimistic Updates (Current Tab)**
   - Instant visual feedback when you record a score
   - No waiting for server response

3. **Supabase Realtime Broadcast (Other Tabs)**
   - After server confirms update, broadcast to all connected tabs
   - Uses Supabase's pub/sub for instant fan-out
   - No database polling needed

4. **Postgres Changes (Fallback)**
   - Listens to actual database changes as backup
   - Ensures sync even if broadcast fails
   - Provides recovery for disconnected tabs

### Flow Diagram

```
User records basket (Tab 1)
  ↓
⚡ Optimistic update (Tab 1 - instant)
  │
  ├─→ 📡 INSTANT Broadcast optimistic score (Tab 2,3,N see it NOW!)
  │
  └─→ API: PATCH /games/:id { incrementOurScore: 3 }
      ↓
      → Postgres: UPDATE games SET ourScore = ourScore + 3 (atomic)
      ↓
      ← Server response: { game: { ourScore: 57, ... } }
      ↓
      ✅ Update Tab 1 cache with server response
      ↓
      📡 Broadcast authoritative score (confirmation to all tabs)
      ↓
      ✅ All tabs confirmed with correct score
```

**Key improvement:** Broadcast happens TWICE:
1. **Optimistic broadcast** (instant) - before server responds
2. **Authoritative broadcast** (correction) - after server confirms

**Fast-click protection:** When clicking rapidly (e.g., 54→56→58), the system prevents flickering at **three levels**:

1. **Level 1 - Sender (Tab 1 onSuccess):**
   - Tracks mutation sequence numbers
   - Skips broadcasting stale server responses (56) if cache already shows newer score (58)
   - Location: `page.tsx` line 169-205

2. **Level 2 - Realtime Receivers:**
   - **Broadcast channel**: Compares incoming score with current state, ignores lower scores
   - **Postgres fallback**: Same protection against stale database updates
   - Location: `use-realtime-game.ts` lines 68-91, 125-148

3. **Level 3 - Cache Sync (Tab 2):**
   - Before syncing realtime updates to React Query cache, checks if incoming score is stale
   - Prevents stale `gameState` from overwriting newer cache values
   - Location: `page.tsx` lines 254-262

**Result:**
- No flickering: score smoothly goes 54→56→58 in all tabs
- Stale updates are blocked at sender, receiver, AND cache sync layers
- Protection works even during rapid clicking or network delays

This ensures instant visual feedback across all tabs without any flickering!

### Concurrent Update Safety

**Example with atomic increments:**
- Score is 54
- User A (Tab 1): Records +2 → Sends `incrementOurScore: 2`
- User B (Tab 2): Records +2 → Sends `incrementOurScore: 2`
- Database executes atomically: 54 + 2 + 2 = **58** ✅

**Without atomic increments (old approach):**
- Both tabs see 54, both send `ourScore: 56`
- Result: Score incorrectly shows 56 ❌

## Troubleshooting

### Realtime Not Working?

1. Check connection status in the UI (should show "Realtime: connected")
2. Open browser console and look for these messages:
   - `📡 Setting up Supabase Realtime for game: <gameId>`
   - `Game realtime subscription status: SUBSCRIBED`
3. Verify environment variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Verify Realtime is Enabled at Project Level

**IMPORTANT**: The table publication is not enough. You must also enable Realtime at the project level:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/_
2. Navigate to **Project Settings** → **API**
3. Scroll down to the **Realtime** section
4. Ensure **Enable Realtime** is toggled ON
5. Check that **Database Changes** is enabled

### Verify Table Replication

Run this query to confirm the `games` table is in the replication publication:

```sql
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

You should see `games` in the results.

### Test Database Updates

When you record a score change:
- Look for `🔥 Game database update received:` in the console
- If you see "SUBSCRIBED" but no fire emoji messages, Realtime is not sending updates

This usually means:
1. Realtime is not enabled at the project level (see above)
2. Database changes are being made outside the replication slot
3. Your Supabase plan doesn't include Realtime features

### Still Not Working?

Check the console for errors and ensure:
- Supabase Realtime is enabled on your plan (Free tier includes it)
- The `games` table has Realtime enabled (note: lowercase "games", not "Game")
- Your Supabase connection URL is correct
- You're using the anon key, not the service role key in the frontend
