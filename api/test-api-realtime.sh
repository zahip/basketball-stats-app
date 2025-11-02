#!/bin/bash

echo "🏀 Testing API with realtime broadcasting..."

# Test event ingestion (no auth required in current setup)
echo "📝 Posting a game event..."

curl -X POST http://localhost:3002/games/game_2/events \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: test_$(date +%s)" \
  -d '{
    "period": 2,
    "clockSec": 250,
    "teamSide": "US",
    "type": "SHOT_3_MADE",
    "meta": {"x": 25, "y": 3},
    "ingestKey": "realtime_test_'$(date +%s)'"
  }' | jq

echo -e "\n✅ Event posted! Check realtime listener for broadcasts."