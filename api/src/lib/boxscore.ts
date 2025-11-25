import { EventType } from "@prisma/client";

// Pure function to calculate box score aggregations
export async function calculateBoxScores(gameId: string, tx: any) {
  // Get all events for the game
  const events = await tx.gameEvent.findMany({
    where: { gameId },
    orderBy: { tsServer: "asc" },
  });

  console.log("events", events);

  // Get the game to find its team
  const game = await tx.game.findUnique({
    where: { id: gameId },
    select: { teamId: true },
  });

  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }

  // Get all players for the team to create jersey -> UUID mapping
  const players = await tx.player.findMany({
    where: { teamId: game.teamId },
    select: { id: true, jersey: true },
  });

  // Create jersey number -> player UUID mapping
  const jerseyToPlayerId = new Map<string, string>();
  players.forEach((player: { id: string; jersey: number }) => {
    jerseyToPlayerId.set(player.jersey.toString(), player.id);
  });

  console.log("Jersey to Player ID mapping:", Object.fromEntries(jerseyToPlayerId));

  // Initialize team stats
  const teamStats = {
    US: {
      pts: 0,
      fgm2: 0,
      fga2: 0,
      fgm3: 0,
      fga3: 0,
      ftm: 0,
      fta: 0,
      oreb: 0,
      dreb: 0,
      ast: 0,
      stl: 0,
      blk: 0,
      tov: 0,
      pf: 0,
    },
    OPP: {
      pts: 0,
      fgm2: 0,
      fga2: 0,
      fgm3: 0,
      fga3: 0,
      ftm: 0,
      fta: 0,
      oreb: 0,
      dreb: 0,
      ast: 0,
      stl: 0,
      blk: 0,
      tov: 0,
      pf: 0,
    },
  };

  // Initialize player stats map
  const playerStats = new Map<string, any>();

  // Track players on court by period
  const playersOnCourt = new Map<string, { onCourt: boolean; lastSubTime: number | null }>();

  // Process each event
  for (const event of events) {
    console.log("blablaaaa");
    const team = teamStats[event.teamSide as keyof typeof teamStats];

    // Update team stats
    switch (event.type) {
      case EventType.SHOT_2_MADE:
        team.fgm2++;
        team.fga2++;
        team.pts += 2;
        break;
      case EventType.SHOT_2_MISS:
        team.fga2++;
        break;
      case EventType.SHOT_3_MADE:
        team.fgm3++;
        team.fga3++;
        team.pts += 3;
        break;
      case EventType.SHOT_3_MISS:
        team.fga3++;
        break;
      case EventType.FT_MADE:
        team.ftm++;
        team.fta++;
        team.pts += 1;
        break;
      case EventType.FT_MISS:
        team.fta++;
        break;
      case EventType.REB_O:
        team.oreb++;
        break;
      case EventType.REB_D:
        team.dreb++;
        break;
      case EventType.AST:
        team.ast++;
        break;
      case EventType.STL:
        team.stl++;
        break;
      case EventType.BLK:
        team.blk++;
        break;
      case EventType.TOV:
        team.tov++;
        break;
      case EventType.FOUL:
        team.pf++;
        break;
    }

    // Handle SUB_IN/SUB_OUT for non-US team (opponent) - just track for period events
    if (event.playerId && event.teamSide === "OPP") {
      const oppPlayerId = `OPP_${event.playerId}`; // Use a synthetic ID for opponent players

      if (!playersOnCourt.has(oppPlayerId)) {
        playersOnCourt.set(oppPlayerId, { onCourt: false, lastSubTime: null });
      }

      if (event.type === EventType.SUB_IN) {
        playersOnCourt.get(oppPlayerId)!.onCourt = true;
        playersOnCourt.get(oppPlayerId)!.lastSubTime = event.clockSec;
      } else if (event.type === EventType.SUB_OUT) {
        playersOnCourt.get(oppPlayerId)!.onCourt = false;
        playersOnCourt.get(oppPlayerId)!.lastSubTime = null;
      }
    }

    // Update player stats if playerId is present
    // FIX: Map jersey number (from event.playerId) to actual player UUID
    if (event.playerId && event.teamSide === "US") {
      // event.playerId contains jersey number as string (e.g., "23")
      // We need to map it to the actual player UUID
      const actualPlayerId = jerseyToPlayerId.get(event.playerId);

      if (!actualPlayerId) {
        console.warn(`Player with jersey ${event.playerId} not found in team ${game.teamId}`);
        continue; // Skip this event if player not found
      }

      if (!playerStats.has(actualPlayerId)) {
        playerStats.set(actualPlayerId, {
          gameId,
          playerId: actualPlayerId, // Use UUID, not jersey number
          secondsPlayed: 0,
          onCourt: false,
          lastSubTime: null,
          pts: 0,
          fgm2: 0,
          fga2: 0,
          fgm3: 0,
          fga3: 0,
          ftm: 0,
          fta: 0,
          oreb: 0,
          dreb: 0,
          ast: 0,
          stl: 0,
          blk: 0,
          tov: 0,
          pf: 0,
          plusMinus: 0, // TODO: Calculate +/-
        });
      }

      const player = playerStats.get(actualPlayerId);

      console.log("player", player);

      switch (event.type) {
        case EventType.SHOT_2_MADE:
          player.fgm2++;
          player.fga2++;
          player.pts += 2;
          break;
        case EventType.SHOT_2_MISS:
          player.fga2++;
          break;
        case EventType.SHOT_3_MADE:
          player.fgm3++;
          player.fga3++;
          player.pts += 3;
          break;
        case EventType.SHOT_3_MISS:
          player.fga3++;
          break;
        case EventType.FT_MADE:
          player.ftm++;
          player.fta++;
          player.pts += 1;
          break;
        case EventType.FT_MISS:
          player.fta++;
          break;
        case EventType.REB_O:
          player.oreb++;
          break;
        case EventType.REB_D:
          player.dreb++;
          break;
        case EventType.AST:
          player.ast++;
          break;
        case EventType.STL:
          player.stl++;
          break;
        case EventType.BLK:
          player.blk++;
          break;
        case EventType.TOV:
          player.tov++;
          break;
        case EventType.FOUL:
          player.pf++;
          break;
        case EventType.SUB_IN:
          // Player enters court
          player.onCourt = true;
          player.lastSubTime = event.clockSec;
          playersOnCourt.set(actualPlayerId, { onCourt: true, lastSubTime: event.clockSec });
          break;
        case EventType.SUB_OUT:
          // Player leaves court - calculate time played
          if (player.onCourt && player.lastSubTime !== null) {
            // Clock counts down, so: timePlayedInSeconds = lastSubTime - currentClockSec
            const timePlayedInSeconds = Math.max(0, player.lastSubTime - event.clockSec);
            player.secondsPlayed += timePlayedInSeconds;
          }
          player.onCourt = false;
          player.lastSubTime = null;
          playersOnCourt.set(actualPlayerId, { onCourt: false, lastSubTime: null });
          break;
      }
    }

    // Handle period events for all players
    if (event.type === EventType.END_PERIOD) {
      // Accumulate time for all players on court when period ends
      for (const [playerId, courtStatus] of playersOnCourt) {
        if (courtStatus.onCourt && courtStatus.lastSubTime !== null) {
          const player = playerStats.get(playerId);
          if (player) {
            // Clock counts down to 0 at end of period
            const timePlayedInSeconds = Math.max(0, courtStatus.lastSubTime - 0);
            player.secondsPlayed += timePlayedInSeconds;
            // Reset lastSubTime but keep onCourt status
            player.lastSubTime = null;
            courtStatus.lastSubTime = null;
          }
        }
      }
    } else if (event.type === EventType.START_PERIOD) {
      // Set lastSubTime for all players on court when period starts
      const periodStartTime = event.clockSec; // Usually 600 (10 minutes)
      for (const [playerId, courtStatus] of playersOnCourt) {
        if (courtStatus.onCourt) {
          const player = playerStats.get(playerId);
          if (player) {
            player.lastSubTime = periodStartTime;
            courtStatus.lastSubTime = periodStartTime;
          }
        }
      }
    }
  }

  console.log("tomerrrr");
  // Upsert team box scores
  for (const [teamSide, stats] of Object.entries(teamStats)) {
    console.log("teamSide", teamSide);
    console.log("stats", stats);
    await tx.boxScoreTeam.upsert({
      where: { gameId_teamSide: { gameId, teamSide } },
      update: stats,
      create: { gameId, teamSide, ...stats },
    });
  }

  console.log("playerStats", playerStats);

  // Upsert player box scores
  for (const [playerId, stats] of playerStats) {
    await tx.boxScorePlayer.upsert({
      where: { gameId_playerId: { gameId, playerId } },
      update: stats,
      create: stats,
    });
  }

  console.log("zahiiiii");
}

// Basketball advanced stats calculations
export function calculateAdvancedStats(boxScore: any) {
  const fgm = boxScore.fgm2 + boxScore.fgm3;
  const fga = boxScore.fga2 + boxScore.fga3;
  const reb = boxScore.oreb + boxScore.dreb;

  return {
    // Effective Field Goal %
    eFG: fga > 0 ? ((fgm + 0.5 * boxScore.fgm3) / fga) * 100 : 0,

    // True Shooting %
    tsPercent:
      fga > 0 ? (boxScore.pts / (2 * (fga + 0.44 * boxScore.fta))) * 100 : 0,

    // Field Goal %
    fgPercent: fga > 0 ? (fgm / fga) * 100 : 0,

    // Three Point %
    threePercent: boxScore.fga3 > 0 ? (boxScore.fgm3 / boxScore.fga3) * 100 : 0,

    // Free Throw %
    ftPercent: boxScore.fta > 0 ? (boxScore.ftm / boxScore.fta) * 100 : 0,

    // Total rebounds
    totalReb: reb,

    // Assist to turnover ratio
    astToRatio: boxScore.tov > 0 ? boxScore.ast / boxScore.tov : boxScore.ast,
  };
}
