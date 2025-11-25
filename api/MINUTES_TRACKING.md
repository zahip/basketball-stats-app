# Player Minutes Tracking - Implementation Guide

## Overview

This document describes the backend implementation of accurate player minutes tracking using second-precision timekeeping and automatic calculation based on substitution events.

## Database Schema Changes

### BoxScorePlayer Model Updates

**File**: `/api/prisma/schema.prisma`

Changed fields:
- `minutes` (Int) → **REMOVED** (was inaccurate, rounded to whole minutes)
- `secondsPlayed` (Int) → **ADDED** (precise tracking, default: 0)
- `onCourt` (Boolean) → **ADDED** (current court status, default: false)
- `lastSubTime` (Int?) → **ADDED** (nullable, tracks when player entered court)

```prisma
model BoxScorePlayer {
  id            String  @id @default(cuid())
  gameId        String
  playerId      String
  secondsPlayed Int     @default(0)  // NEW: Precise time tracking
  onCourt       Boolean @default(false)  // NEW: Current status
  lastSubTime   Int?  // NEW: Clock time when player entered court
  pts           Int     @default(0)
  // ... other stats
}
```

### Migration Applied

**Migration**: `20251124_add_player_court_tracking`

Changes:
1. Added `secondsPlayed` column (default 0)
2. Added `onCourt` column (default false)
3. Added `lastSubTime` column (nullable)
4. Migrated existing `minutes` data: `secondsPlayed = minutes * 60`
5. Dropped `minutes` column

**Status**: ✅ Applied to database

## Box Score Calculation Logic

### File: `/api/src/lib/boxscore.ts`

#### New Event Handling

**SUB_IN Events**:
```typescript
case EventType.SUB_IN:
  player.onCourt = true;
  player.lastSubTime = event.clockSec;
  break;
```

**SUB_OUT Events**:
```typescript
case EventType.SUB_OUT:
  if (player.onCourt && player.lastSubTime !== null) {
    // Clock counts down, so: timePlayedInSeconds = lastSubTime - currentClockSec
    const timePlayedInSeconds = Math.max(0, player.lastSubTime - event.clockSec);
    player.secondsPlayed += timePlayedInSeconds;
  }
  player.onCourt = false;
  player.lastSubTime = null;
  break;
```

**END_PERIOD Events**:
```typescript
if (event.type === EventType.END_PERIOD) {
  // Accumulate time for all players on court when period ends
  for (const [playerId, courtStatus] of playersOnCourt) {
    if (courtStatus.onCourt && courtStatus.lastSubTime !== null) {
      // Clock counts down to 0 at end of period
      const timePlayedInSeconds = Math.max(0, courtStatus.lastSubTime - 0);
      player.secondsPlayed += timePlayedInSeconds;
      player.lastSubTime = null;  // Reset for next period
    }
  }
}
```

**START_PERIOD Events**:
```typescript
if (event.type === EventType.START_PERIOD) {
  // Set lastSubTime for all players on court when period starts
  const periodStartTime = event.clockSec; // Usually 600 (10 minutes)
  for (const [playerId, courtStatus] of playersOnCourt) {
    if (courtStatus.onCourt) {
      player.lastSubTime = periodStartTime;
    }
  }
}
```

#### Edge Cases Handled

1. **Negative Time Prevention**: `Math.max(0, ...)` prevents negative seconds
2. **Null Check**: Always verify `lastSubTime !== null` before calculations
3. **Opponent Players**: Track separately using synthetic IDs (`OPP_${playerId}`)
4. **Period Transitions**: Accumulate time at END_PERIOD, reset at START_PERIOD

## API Response Updates

### File: `/api/src/routes/boxscore.ts`

All box score endpoints now return:
- `secondsPlayed` (Int) - Raw seconds for precision
- `minutes` (Int) - Computed field: `Math.floor(secondsPlayed / 60)`
- `onCourt` (Boolean) - Current court status

```typescript
const enrichedBoxScores = playerBoxScores.map(boxScore => {
  const player = players.find(p => p.id === boxScore.playerId)
  return {
    ...boxScore,
    minutes: Math.floor(boxScore.secondsPlayed / 60), // Computed field
    player: { /* ... */ },
    advanced: calculateAdvancedStats(boxScore)
  }
})
```

**Endpoints Updated**:
- `GET /games/:gameId/boxscore/players` ✅
- `GET /games/:gameId/boxscore` ✅

## Real-time Broadcasting

### File: `/api/src/lib/supabase.ts`

New broadcast function:
```typescript
export const broadcastPlayerCourtStatus = async (gameId: string, playerBoxScores: any[]) => {
  const channel = supabase.channel(`game:${gameId}`)
  await channel.subscribe()

  await channel.send({
    type: 'broadcast',
    event: 'player_court_status',
    payload: {
      playerBoxScores,
      updatedAt: new Date().toISOString()
    }
  })

  await channel.unsubscribe()
}
```

### File: `/api/src/routes/events.ts`

After event ingestion:
```typescript
// Check if any substitution events were processed
const hasSubstitutionEvents = result.events.some(
  event => event.type === 'SUB_IN' || event.type === 'SUB_OUT'
);

// Broadcast player court status if substitutions occurred
if (hasSubstitutionEvents) {
  const playerBoxScores = await prisma.boxScorePlayer.findMany({
    where: { gameId },
    select: { playerId, onCourt, lastSubTime, secondsPlayed }
  });

  await broadcastPlayerCourtStatus(gameId, playerBoxScores);
}
```

**Broadcast Event**: `player_court_status`
**Channel**: `game:${gameId}`
**Triggered By**: SUB_IN, SUB_OUT events

## New API Endpoint

### GET /games/:gameId/court

**File**: `/api/src/routes/games.ts`

Returns players currently on court.

**Response**:
```json
{
  "gameId": "game_1",
  "playersOnCourt": [
    {
      "playerId": "player_uuid",
      "onCourt": true,
      "lastSubTime": 450,
      "secondsPlayed": 150,
      "minutes": 2,
      "player": {
        "firstName": "John",
        "lastName": "Doe",
        "jersey": 23,
        "position": "PG",
        "avatarUrl": "..."
      }
    }
  ],
  "count": 5
}
```

**Features**:
- Only returns players with `onCourt = true`
- Sorted by jersey number
- Includes computed `minutes` field
- Enriched with player details

## Testing

### Manual API Testing

Start the API server:
```bash
cd api
npm run dev
```

Test sequence:
```bash
# 1. Start period (600 seconds = 10:00)
curl -X POST http://localhost:3002/games/GAME_ID/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "events": [{
      "gameId": "GAME_ID",
      "type": "START_PERIOD",
      "period": 1,
      "clockSec": 600,
      "teamSide": "US",
      "ingestKey": "unique-key-1"
    }]
  }'

# 2. Player #23 enters at 600 seconds
curl -X POST http://localhost:3002/games/GAME_ID/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "events": [{
      "gameId": "GAME_ID",
      "type": "SUB_IN",
      "playerId": "23",
      "period": 1,
      "clockSec": 600,
      "teamSide": "US",
      "ingestKey": "unique-key-2"
    }]
  }'

# 3. Player #23 exits at 400 seconds (played 200 seconds = 3:20)
curl -X POST http://localhost:3002/games/GAME_ID/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "events": [{
      "gameId": "GAME_ID",
      "type": "SUB_OUT",
      "playerId": "23",
      "period": 1,
      "clockSec": 400,
      "teamSide": "US",
      "ingestKey": "unique-key-3"
    }]
  }'

# 4. Check box score
curl http://localhost:3002/games/GAME_ID/boxscore/players

# Expected: Player #23 has secondsPlayed=200, minutes=3, onCourt=false

# 5. Check who's on court
curl http://localhost:3002/games/GAME_ID/court
```

### Automated Test Script

Run the bash test script:
```bash
cd api
chmod +x test-minutes-api.sh
./test-minutes-api.sh
```

**Prerequisites**:
- API server running on port 3002
- At least one LIVE game in database
- Team with at least 2 players
- `jq` installed (`brew install jq`)

## Integration with Frontend

### Expected Frontend Changes

1. **Subscribe to court status broadcasts**:
```typescript
supabase.channel(`game_${gameId}`)
  .on('broadcast', { event: 'player_court_status' }, (payload) => {
    updatePlayerCourtStatus(payload.playerBoxScores);
  })
  .subscribe();
```

2. **Use computed minutes field**:
```typescript
// In box score display
<div>Minutes: {player.minutes}:{(player.secondsPlayed % 60).toString().padStart(2, '0')}</div>
```

3. **Poll /games/:gameId/court for live updates**:
```typescript
const { data } = await fetch(`/api/games/${gameId}/court`);
// Update UI with data.playersOnCourt
```

## Performance Considerations

### Current Implementation
- **O(n)** box score recalculation on every event ingestion (where n = event count)
- Substitution broadcasts add minimal overhead (~50ms per SUB event)
- `/court` endpoint is efficient (single query + join)

### Future Optimizations
1. **Incremental Updates**: Only update affected player box scores
2. **Caching**: Cache player court status in Redis
3. **Batch Broadcasting**: Combine multiple SUB events in one broadcast

## Known Limitations

1. **Manual Period Events**: Requires START_PERIOD and END_PERIOD events to be sent
2. **Clock Accuracy**: Assumes clock is updated correctly in game state
3. **No Validation**: Doesn't validate if exactly 5 players on court (rules enforcement)
4. **Opponent Tracking**: Opponent player minutes not stored in box scores

## Backward Compatibility

### Breaking Changes
- `minutes` field removed from BoxScorePlayer model
- API responses now include `secondsPlayed` instead of `minutes` (though computed `minutes` is still returned)

### Migration Path
1. Existing data migrated: `secondsPlayed = minutes * 60`
2. All API responses include computed `minutes` for display
3. Frontend should transition to using `secondsPlayed` for accuracy

## Troubleshooting

### Issue: Player shows 0 seconds played
**Cause**: No SUB_IN/SUB_OUT events recorded
**Solution**: Ensure substitution events are being sent with correct jersey numbers

### Issue: Minutes not accumulating
**Cause**: Missing START_PERIOD or END_PERIOD events
**Solution**: Send period events at appropriate times

### Issue: Negative seconds
**Cause**: Clock time inconsistency (SUB_OUT before SUB_IN time)
**Solution**: Verify clock values, Math.max(0, ...) prevents this

### Issue: Player stuck "on court" after game ends
**Cause**: Missing END_PERIOD event
**Solution**: Send END_PERIOD event when quarter/period ends

## Files Modified

### Schema & Migrations
- `/api/prisma/schema.prisma` ✅
- `/api/prisma/migrations/20251124_add_player_court_tracking/migration.sql` ✅

### Core Logic
- `/api/src/lib/boxscore.ts` ✅ (main calculation logic)
- `/api/src/lib/supabase.ts` ✅ (broadcasting)

### API Routes
- `/api/src/routes/boxscore.ts` ✅ (response transformation)
- `/api/src/routes/events.ts` ✅ (substitution broadcasting)
- `/api/src/routes/games.ts` ✅ (new /court endpoint)

### Testing
- `/api/test-minutes-tracking.js` ✅ (unit-style test)
- `/api/test-minutes-api.sh` ✅ (API integration test)
- `/api/MINUTES_TRACKING.md` ✅ (this document)

## Deployment Checklist

- [x] Schema updated
- [x] Migration created and applied
- [x] Box score calculation enhanced
- [x] API responses updated
- [x] Real-time broadcasting added
- [x] New endpoint implemented
- [x] TypeScript compilation verified
- [x] Documentation created
- [ ] Frontend integration (pending)
- [ ] End-to-end testing (pending)
- [ ] Production deployment (pending)

---

**Last Updated**: 2024-11-24
**Version**: 1.0.0
**Author**: Backend Implementation
