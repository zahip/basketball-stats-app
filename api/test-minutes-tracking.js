/**
 * Test script for player minutes tracking functionality
 *
 * This tests:
 * 1. SUB_IN events set onCourt = true and lastSubTime
 * 2. SUB_OUT events calculate secondsPlayed and reset onCourt
 * 3. END_PERIOD events accumulate time for players on court
 * 4. START_PERIOD events set lastSubTime for players on court
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMinutesTracking() {
  console.log('\n=== Testing Player Minutes Tracking ===\n');

  try {
    // Find a test game
    const game = await prisma.game.findFirst({
      include: {
        team: {
          include: {
            players: true
          }
        }
      }
    });

    if (!game) {
      console.log('❌ No games found. Please create a game first.');
      return;
    }

    console.log(`✓ Using game: ${game.id} (${game.team.name} vs ${game.opponent})`);

    // Get some players
    const players = game.team.players.slice(0, 2);
    if (players.length < 2) {
      console.log('❌ Need at least 2 players for testing');
      return;
    }

    console.log(`✓ Testing with players: #${players[0].jersey} ${players[0].firstName} and #${players[1].jersey} ${players[1].firstName}\n`);

    // Clear existing events and box scores for this game
    await prisma.gameEvent.deleteMany({ where: { gameId: game.id } });
    await prisma.boxScorePlayer.deleteMany({ where: { gameId: game.id } });
    await prisma.boxScoreTeam.deleteMany({ where: { gameId: game.id } });

    console.log('1. Testing START_PERIOD event (period 1, 600 seconds)');
    await createEvent(game.id, 'START_PERIOD', null, 1, 600);

    console.log('2. Testing SUB_IN for player 1 at 600 seconds');
    await createEvent(game.id, 'SUB_IN', players[0].jersey.toString(), 1, 600);
    await verifyBoxScore(game.id, players[0].id, {
      onCourt: true,
      lastSubTime: 600,
      secondsPlayed: 0
    });

    console.log('3. Testing SUB_IN for player 2 at 580 seconds');
    await createEvent(game.id, 'SUB_IN', players[1].jersey.toString(), 1, 580);
    await verifyBoxScore(game.id, players[1].id, {
      onCourt: true,
      lastSubTime: 580,
      secondsPlayed: 0
    });

    console.log('4. Testing SUB_OUT for player 1 at 400 seconds (should have 200 seconds)');
    await createEvent(game.id, 'SUB_OUT', players[0].jersey.toString(), 1, 400);
    await verifyBoxScore(game.id, players[0].id, {
      onCourt: false,
      lastSubTime: null,
      secondsPlayed: 200 // 600 - 400
    });

    console.log('5. Testing END_PERIOD (player 2 still on court, should get 580 seconds)');
    await createEvent(game.id, 'END_PERIOD', null, 1, 0);
    await verifyBoxScore(game.id, players[1].id, {
      onCourt: true,
      lastSubTime: null,
      secondsPlayed: 580 // 580 - 0
    });

    console.log('6. Testing START_PERIOD for period 2 (player 2 still on court)');
    await createEvent(game.id, 'START_PERIOD', null, 2, 600);
    await verifyBoxScore(game.id, players[1].id, {
      onCourt: true,
      lastSubTime: 600,
      secondsPlayed: 580
    });

    console.log('7. Testing SUB_IN for player 1 in period 2 at 550 seconds');
    await createEvent(game.id, 'SUB_IN', players[0].jersey.toString(), 2, 550);
    await verifyBoxScore(game.id, players[0].id, {
      onCourt: true,
      lastSubTime: 550,
      secondsPlayed: 200 // Still has 200 from period 1
    });

    console.log('8. Testing SUB_OUT for player 2 at 300 seconds (should add 300 seconds)');
    await createEvent(game.id, 'SUB_OUT', players[1].jersey.toString(), 2, 300);
    await verifyBoxScore(game.id, players[1].id, {
      onCourt: false,
      lastSubTime: null,
      secondsPlayed: 880 // 580 + 300
    });

    // Final verification
    console.log('\n=== Final Results ===');
    const finalBoxScores = await prisma.boxScorePlayer.findMany({
      where: { gameId: game.id }
    });

    for (const boxScore of finalBoxScores) {
      const player = players.find(p => p.id === boxScore.playerId);
      if (player) {
        const minutes = Math.floor(boxScore.secondsPlayed / 60);
        const seconds = boxScore.secondsPlayed % 60;
        console.log(`\nPlayer #${player.jersey} ${player.firstName}:`);
        console.log(`  - On Court: ${boxScore.onCourt}`);
        console.log(`  - Seconds Played: ${boxScore.secondsPlayed}`);
        console.log(`  - Minutes: ${minutes}:${seconds.toString().padStart(2, '0')}`);
        console.log(`  - Last Sub Time: ${boxScore.lastSubTime}`);
      }
    }

    console.log('\n✅ All tests passed!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

async function createEvent(gameId, type, playerId, period, clockSec) {
  const { calculateBoxScores } = require('./dist/lib/boxscore');

  await prisma.$transaction(async (tx) => {
    await tx.gameEvent.create({
      data: {
        gameId,
        type,
        playerId,
        period,
        clockSec,
        teamSide: 'US',
        ingestKey: `test_${Date.now()}_${Math.random()}`
      }
    });

    await calculateBoxScores(gameId, tx);
  });
}

async function verifyBoxScore(gameId, playerId, expected) {
  const boxScore = await prisma.boxScorePlayer.findUnique({
    where: { gameId_playerId: { gameId, playerId } }
  });

  if (!boxScore) {
    throw new Error(`No box score found for player ${playerId}`);
  }

  const checks = [
    { field: 'onCourt', expected: expected.onCourt, actual: boxScore.onCourt },
    { field: 'lastSubTime', expected: expected.lastSubTime, actual: boxScore.lastSubTime },
    { field: 'secondsPlayed', expected: expected.secondsPlayed, actual: boxScore.secondsPlayed }
  ];

  for (const check of checks) {
    if (check.actual !== check.expected) {
      throw new Error(
        `Expected ${check.field} to be ${check.expected}, but got ${check.actual}`
      );
    }
  }

  console.log(`   ✓ onCourt=${boxScore.onCourt}, lastSubTime=${boxScore.lastSubTime}, secondsPlayed=${boxScore.secondsPlayed}`);
}

// Run the test
testMinutesTracking();
