# Basketball Stats - Realtime Broadcasting

## 📡 **Supabase Realtime Integration**

Our basketball stats app uses Supabase Realtime for live updates across multiple devices watching the same game.

## 🎯 **Channel Structure**

Each game has its own realtime channel:
```
Channel: game:{gameId}
Example: game:game_2
```

## 📨 **Event Types**

### 1. Game Events (`game_event`)
Broadcasted when new basketball events are recorded:

```typescript
{
  type: 'event:new',
  payload: {
    id: 'event_123',
    type: 'SHOT_2_MADE' | 'SHOT_3_MISS' | 'REB_O' | ...,
    period: 2,
    clockSec: 300,
    teamSide: 'US' | 'OPP',
    playerId?: 'player_123',
    meta?: { x: 15, y: 8 }, // Shot location
    tsServer: '2024-11-02T10:30:00Z',
    ingestKey: 'unique_key_123'
  }
}
```

### 2. Header Updates (`header_update`)
Broadcasted when game state changes (score, period, clock):

```typescript
{
  type: 'header:update', 
  payload: {
    ourScore: 56,
    oppScore: 52,
    period: 2,
    clockSec: 300,
    status: 'LIVE' | 'PLANNED' | 'FINAL'
  }
}
```

### 3. Box Score Updates (`boxscore_update`)
Broadcasted when statistics are recalculated:

```typescript
{
  type: 'boxscore:update',
  payload: {
    teamBoxScores: [
      {
        teamSide: 'US',
        pts: 56,
        fgm2: 20, fga2: 35,
        fgm3: 5, fga3: 12,
        ftm: 6, fta: 8,
        oreb: 8, dreb: 22,
        ast: 15, stl: 6, blk: 3, tov: 12, pf: 8
      },
      {
        teamSide: 'OPP',
        // ... opponent stats
      }
    ],
    updatedAt: '2024-11-02T10:30:00Z'
  }
}
```

## 🧪 **Testing Realtime**

### Demo Mode
```bash
# Terminal 1: Listen for updates
npm run demo:realtime

# Terminal 2: Send test broadcasts
npm run test:broadcast

# Terminal 3: Test API integration
./test-api-realtime.sh
```

### Manual Testing
```bash
# Listen to game channel
npm run demo:realtime

# In another terminal, post real events
curl -X POST http://localhost:3002/games/game_2/events \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: test_$(date +%s)" \
  -d '{
    "period": 2,
    "clockSec": 300,
    "teamSide": "US", 
    "type": "SHOT_3_MADE",
    "meta": {"x": 25, "y": 3},
    "ingestKey": "test_'$(date +%s)'"
  }'
```

## 🏀 **Frontend Integration** 

### Subscribe to Game Channel
```typescript
import { supabase } from '@/lib/supabase'

const gameId = 'game_2'
const channel = supabase.channel(`game:${gameId}`)

channel
  .on('broadcast', { event: 'game_event' }, (payload) => {
    // Handle new game event
    console.log('New event:', payload.payload)
    // Update UI optimistically
  })
  .on('broadcast', { event: 'header_update' }, (payload) => {
    // Update game header (score, period, clock)
    updateGameHeader(payload.payload)
  })
  .on('broadcast', { event: 'boxscore_update' }, (payload) => {
    // Update statistics in real-time
    updateBoxScore(payload.payload.teamBoxScores)
  })
  .subscribe()
```

### Cleanup
```typescript
// Unsubscribe when component unmounts
channel.unsubscribe()
```

## ⚡ **Broadcasting Flow**

1. **Event Ingestion**: Client posts event to `/games/{gameId}/events`
2. **Database Transaction**: Event saved, box scores recalculated
3. **Triple Broadcast**:
   - `game_event`: The new event
   - `header_update`: Updated scores/period/clock  
   - `boxscore_update`: Updated team statistics
4. **Realtime Delivery**: All subscribed clients receive updates within 1-2s

## 🔐 **Security**

- **Channel Access**: No authentication required to subscribe to game channels
- **Broadcasting**: Only server can broadcast (service role key required)
- **Event Ingestion**: Requires authentication for posting events

## 📊 **Performance**

- **Latency**: 1-2 seconds for realtime delivery
- **Concurrent Viewers**: Unlimited (Supabase handles scaling)
- **Message Size**: Optimized payloads (~1KB per broadcast)
- **Reliability**: Automatic reconnection on network issues

## 🐛 **Troubleshooting**

### Common Issues

1. **Connection Failed**
   - Check SUPABASE_URL and SUPABASE_SERVICE_KEY in .env
   - Verify network connectivity

2. **Messages Not Received**
   - Ensure correct gameId in channel name
   - Check browser console for subscription status

3. **Authentication Errors**
   - Use anon key for frontend subscriptions
   - Use service role key for server broadcasting

### Debug Mode
```bash
# Enable debug logging
SUPABASE_DEBUG=true npm run demo:realtime
```

## 🚀 **Production Considerations**

- **Rate Limiting**: Supabase has generous limits for realtime
- **Message Retention**: Messages are not persisted (live updates only)
- **Scaling**: Handles thousands of concurrent connections per game
- **Monitoring**: Track connection counts and message delivery rates