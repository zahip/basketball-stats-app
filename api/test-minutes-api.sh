#!/bin/bash

# Test script for player minutes tracking via API
# This tests the complete flow through HTTP endpoints

API_URL="http://localhost:3002"

echo "=== Testing Player Minutes Tracking via API ==="
echo ""

# Get a game to test with
echo "1. Fetching games..."
GAME_JSON=$(curl -s "$API_URL/games?status=LIVE")
GAME_ID=$(echo "$GAME_JSON" | jq -r '.games[0].id // empty')

if [ -z "$GAME_ID" ]; then
  echo "❌ No live games found. Please create a game and set status to LIVE first."
  exit 1
fi

echo "✓ Using game: $GAME_ID"
echo ""

# Get team info to find players
echo "2. Fetching game details..."
GAME_DETAILS=$(curl -s "$API_URL/games/$GAME_ID")
TEAM_ID=$(echo "$GAME_DETAILS" | jq -r '.game.teamId')

echo "3. Fetching team players..."
PLAYERS_JSON=$(curl -s "$API_URL/teams/$TEAM_ID/players")
PLAYER1_JERSEY=$(echo "$PLAYERS_JSON" | jq -r '.players[0].jersey')
PLAYER2_JERSEY=$(echo "$PLAYERS_JSON" | jq -r '.players[1].jersey')

echo "✓ Testing with players: #$PLAYER1_JERSEY and #$PLAYER2_JERSEY"
echo ""

# Test SUB_IN event
echo "4. Testing SUB_IN event for player #$PLAYER1_JERSEY..."
SUB_IN_RESULT=$(curl -s -X POST "$API_URL/games/$GAME_ID/events" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test" \
  -H "X-Idempotency-Key: test-sub-in-$(date +%s)" \
  -d "{
    \"events\": [{
      \"gameId\": \"$GAME_ID\",
      \"type\": \"SUB_IN\",
      \"playerId\": \"$PLAYER1_JERSEY\",
      \"period\": 1,
      \"clockSec\": 600,
      \"teamSide\": \"US\",
      \"ingestKey\": \"test-sub-in-$(uuidgen)\"
    }]
  }")

echo "$SUB_IN_RESULT" | jq '.'
echo ""

# Check box score
echo "5. Checking box score after SUB_IN..."
BOX_SCORE=$(curl -s "$API_URL/games/$GAME_ID/boxscore/players")
echo "$BOX_SCORE" | jq ".playerBoxScores[] | select(.player.jersey == $PLAYER1_JERSEY) | {jersey: .player.jersey, onCourt, lastSubTime, secondsPlayed, minutes}"
echo ""

# Test SUB_OUT event
echo "6. Testing SUB_OUT event for player #$PLAYER1_JERSEY after 200 seconds..."
sleep 1
SUB_OUT_RESULT=$(curl -s -X POST "$API_URL/games/$GAME_ID/events" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test" \
  -H "X-Idempotency-Key: test-sub-out-$(date +%s)" \
  -d "{
    \"events\": [{
      \"gameId\": \"$GAME_ID\",
      \"type\": \"SUB_OUT\",
      \"playerId\": \"$PLAYER1_JERSEY\",
      \"period\": 1,
      \"clockSec\": 400,
      \"teamSide\": \"US\",
      \"ingestKey\": \"test-sub-out-$(uuidgen)\"
    }]
  }")

echo "$SUB_OUT_RESULT" | jq '.'
echo ""

# Check box score again
echo "7. Checking box score after SUB_OUT (should have ~200 seconds = 3 minutes)..."
BOX_SCORE=$(curl -s "$API_URL/games/$GAME_ID/boxscore/players")
echo "$BOX_SCORE" | jq ".playerBoxScores[] | select(.player.jersey == $PLAYER1_JERSEY) | {jersey: .player.jersey, onCourt, lastSubTime, secondsPlayed, minutes}"
echo ""

# Test GET /games/:gameId/court endpoint
echo "8. Testing GET /games/:gameId/court endpoint..."
COURT_STATUS=$(curl -s "$API_URL/games/$GAME_ID/court")
echo "$COURT_STATUS" | jq '.'
echo ""

echo "✅ API test completed!"
echo ""
echo "Expected results:"
echo "  - Player should have onCourt=false after SUB_OUT"
echo "  - Player should have secondsPlayed=200"
echo "  - Player should have minutes=3"
echo "  - GET /court should show only players with onCourt=true"
