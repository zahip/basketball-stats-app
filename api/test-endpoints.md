# Basketball Stats API - Test Endpoints

## Prerequisites
Start the API server:
```bash
cd api
npm run dev  # Server runs on http://localhost:3002
```

## Health Check
```bash
curl http://localhost:3002/health
```

## Teams & Players

### Get Team Details
```bash
curl http://localhost:3002/teams/team_1
```

### Get Team Players
```bash
curl http://localhost:3002/teams/team_1/players
```

### Create a Player (requires auth)
```bash
curl -X POST http://localhost:3002/teams/team_1/players \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "jersey": 11,
    "firstName": "New",
    "lastName": "Player",
    "position": "G"
  }'
```

## Games

### Create a Game (requires auth)
```bash
curl -X POST http://localhost:3002/games \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "teamId": "team_1",
    "opponent": "Rockets",
    "date": "2024-11-20T19:00:00Z",
    "venue": "Home Court"
  }'
```

### Get Game Details
```bash
curl http://localhost:3002/games/game_1
```

### List Games
```bash
# All games
curl http://localhost:3002/games

# Filter by team
curl "http://localhost:3002/games?teamId=team_1"

# Filter by status
curl "http://localhost:3002/games?status=LIVE"
```

### Update Game State (requires auth)
```bash
curl -X PATCH http://localhost:3002/games/game_2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "status": "LIVE",
    "period": 2,
    "clockSec": 420,
    "ourScore": 48,
    "oppScore": 45
  }'
```

## Game Events

### Record Single Event (requires auth + idempotency)
```bash
curl -X POST http://localhost:3002/games/game_2/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Idempotency-Key: shot_$(date +%s)" \
  -d '{
    "period": 2,
    "clockSec": 400,
    "teamSide": "US",
    "type": "SHOT_2_MADE",
    "meta": {"x": 15, "y": 8},
    "ingestKey": "shot_unique_123"
  }'
```

### Record Batch Events (requires auth + idempotency)
```bash
curl -X POST http://localhost:3002/games/game_2/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Idempotency-Key: batch_$(date +%s)" \
  -d '{
    "events": [
      {
        "gameId": "game_2",
        "period": 2,
        "clockSec": 380,
        "teamSide": "US",
        "type": "AST",
        "ingestKey": "assist_123"
      },
      {
        "gameId": "game_2",
        "period": 2,
        "clockSec": 370,
        "teamSide": "OPP",
        "type": "SHOT_3_MISS",
        "meta": {"x": 25, "y": 3},
        "ingestKey": "miss_124"
      }
    ]
  }'
```

### Get Play-by-Play Events
```bash
# All events for a game
curl http://localhost:3002/games/game_2/events

# Filter by period
curl "http://localhost:3002/games/game_2/events?period=2"

# Limit results
curl "http://localhost:3002/games/game_2/events?limit=10"
```

## Box Scores

### Get Team Box Score
```bash
curl http://localhost:3002/games/game_2/boxscore/team
```

### Get Player Box Scores
```bash
curl http://localhost:3002/games/game_2/boxscore/players
```

### Get Complete Box Score
```bash
curl http://localhost:3002/games/game_2/boxscore
```

### Get Four Factors Summary
```bash
curl http://localhost:3002/games/game_2/boxscore/summary
```

## Example Response Formats

### Team Box Score Response
```json
{
  "teamBoxScores": [
    {
      "id": "...",
      "gameId": "game_2",
      "teamSide": "US",
      "pts": 42,
      "fgm2": 15,
      "fga2": 28,
      "fgm3": 4,
      "fga3": 12,
      "ftm": 8,
      "fta": 10,
      "oreb": 5,
      "dreb": 18,
      "ast": 12,
      "stl": 3,
      "blk": 2,
      "tov": 8,
      "pf": 6,
      "advanced": {
        "eFG": 60.0,
        "tsPercent": 65.5,
        "fgPercent": 47.5,
        "threePercent": 33.3,
        "ftPercent": 80.0,
        "totalReb": 23,
        "astToRatio": 1.5
      }
    }
  ]
}
```

### Player Box Score Response
```json
{
  "playerBoxScores": [
    {
      "id": "...",
      "gameId": "game_2",
      "playerId": "...",
      "minutes": 18,
      "pts": 12,
      "fgm2": 4,
      "fga2": 7,
      "fgm3": 0,
      "fga3": 0,
      "ftm": 4,
      "fta": 4,
      "oreb": 1,
      "dreb": 3,
      "ast": 3,
      "stl": 1,
      "blk": 0,
      "tov": 2,
      "pf": 1,
      "plusMinus": 0,
      "player": {
        "firstName": "John",
        "lastName": "Smith",
        "jersey": 1,
        "position": "PG"
      },
      "advanced": {
        "eFG": 57.1,
        "tsPercent": 85.7,
        "fgPercent": 57.1,
        "threePercent": 0,
        "ftPercent": 100.0,
        "totalReb": 4,
        "astToRatio": 1.5
      }
    }
  ]
}
```

## Testing Without Auth
Most GET endpoints work without authentication. For testing POST/PATCH endpoints that require auth, you can temporarily remove the `authMiddleware` from the route handlers.