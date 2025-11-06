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

- **Atomic Increments**: Score updates use database-level atomic increments to prevent race conditions
- **Optimistic Updates**: When you record a score, it updates immediately in your tab
- **Postgres Changes**: Supabase listens to database changes via `postgres_changes`
- **React Query Cache**: When a realtime update comes in, it updates the React Query cache
- **Instant Sync**: All tabs listening to the same game get the update in real-time

### Concurrent Update Safety

The system uses **atomic increments** at the database level to handle concurrent updates safely:

**Example:**
- Score is 54
- User A records +2 points → Sends `incrementOurScore: 2`
- User B records +2 points → Sends `incrementOurScore: 2`
- Database processes both: 54 + 2 + 2 = **58** ✅

Without atomic increments, both users would send `ourScore: 56`, resulting in only 56 points total ❌

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
