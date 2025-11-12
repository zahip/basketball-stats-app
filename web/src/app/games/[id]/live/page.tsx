"use client";

import { useState, useEffect, useRef } from "react";
import { use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { GameHeader } from "@/components/game/game-header";
import { ActionGrid } from "@/components/game/action-grid";
import { PlayersGrid } from "@/components/game/players-grid";
import { BoxScore } from "@/components/game/box-score";
import { GameControls } from "@/components/game/game-controls";
import { PlayByPlay } from "@/components/game/play-by-play";
import { eventQueueManager } from "@/lib/offline-queue";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeGame } from "@/hooks/use-realtime-game";
import { usePlayersStore } from "@/lib/stores/players-store";
import { gamesApi, UpdateGameData } from "@/lib/api-client";

interface LiveGamePageProps {
  params: Promise<{ id: string }>;
}

// Helper function to convert clock seconds to MM:SS format
function formatClock(clockSec: number): string {
  const minutes = Math.floor(clockSec / 60);
  const seconds = clockSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Helper function to convert game status from API to component format
function mapGameStatus(
  apiStatus: string
): "scheduled" | "active" | "paused" | "completed" {
  switch (apiStatus) {
    case "LIVE":
      return "active";
    case "FINAL":
      return "completed";
    case "PLANNED":
      return "scheduled";
    default:
      return "scheduled";
  }
}

// Helper function to calculate stat deltas from event types
interface StatDelta {
  scoreIncrement: number;
  fgmIncrement?: number;
  fgaIncrement?: number;
  fg3mIncrement?: number;
  fg3aIncrement?: number;
  ftmIncrement?: number;
  ftaIncrement?: number;
  orebIncrement?: number;
  drebIncrement?: number;
  astIncrement?: number;
  stlIncrement?: number;
  blkIncrement?: number;
  tovIncrement?: number;
  pfIncrement?: number;
}

function calculateStatDelta(eventType: string): StatDelta {
  const delta: StatDelta = { scoreIncrement: 0 };

  switch (eventType) {
    case 'SHOT_2_MADE':
      delta.scoreIncrement = 2;
      delta.fgmIncrement = 1;
      delta.fgaIncrement = 1;
      break;
    case 'SHOT_2_MISS':
      delta.fgaIncrement = 1;
      break;
    case 'SHOT_3_MADE':
      delta.scoreIncrement = 3;
      delta.fg3mIncrement = 1;
      delta.fg3aIncrement = 1;
      delta.fgmIncrement = 1;
      delta.fgaIncrement = 1;
      break;
    case 'SHOT_3_MISS':
      delta.fg3aIncrement = 1;
      delta.fgaIncrement = 1;
      break;
    case 'FT_MADE':
      delta.scoreIncrement = 1;
      delta.ftmIncrement = 1;
      delta.ftaIncrement = 1;
      break;
    case 'FT_MISS':
      delta.ftaIncrement = 1;
      break;
    case 'REB_O':
      delta.orebIncrement = 1;
      break;
    case 'REB_D':
      delta.drebIncrement = 1;
      break;
    case 'AST':
      delta.astIncrement = 1;
      break;
    case 'STL':
      delta.stlIncrement = 1;
      break;
    case 'BLK':
      delta.blkIncrement = 1;
      break;
    case 'TOV':
      delta.tovIncrement = 1;
      break;
    case 'FOUL':
      delta.pfIncrement = 1;
      break;
  }

  return delta;
}

function LiveGameContent({ gameId }: { gameId: string }) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [gameData, setGameData] = useState({
    id: gameId,
    homeTeam: "Your Team",
    awayTeam: "Opponent",
    homeScore: 0,
    awayScore: 0,
    status: "scheduled" as "scheduled" | "active" | "paused" | "completed",
    period: 1,
    clock: "00:00",
  });
  const [pendingEventsCount, setPendingEventsCount] = useState(0);
  const { toast } = useToast();
  const {
    gameState,
    recentEvents,
    connectionStatus,
    isConnected,
    broadcastScoreUpdate,
  } = useRealtimeGame(gameId);
  const queryClient = useQueryClient();

  // Fetch game data from API
  const {
    data: gameApiData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["game", gameId],
    queryFn: () => gamesApi.getById(gameId),
    refetchOnWindowFocus: true, // Refetch when switching tabs
    refetchInterval: false, // Disable polling - we're using Supabase Realtime instead
  });

  // Track the last mutation timestamp to prevent stale updates
  const lastMutationRef = useRef<number>(0);
  // Track mutation sequence to prevent stale broadcasts
  const mutationSequenceRef = useRef<number>(0);

  // Mutation to update game score with optimistic updates for current tab
  const updateGameMutation = useMutation({
    mutationFn: (data: UpdateGameData) => gamesApi.update(gameId, data),
    onMutate: async (updatedData) => {
      // Record mutation timestamp and increment sequence
      lastMutationRef.current = Date.now();
      mutationSequenceRef.current += 1;
      const currentSequence = mutationSequenceRef.current;

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["game", gameId] });

      // Snapshot previous value
      const previousGameData = queryClient.getQueryData(["game", gameId]);
      const oldData = previousGameData as
        | { id: string; game: Record<string, unknown> }
        | undefined;

      // Calculate the new scores for optimistic update
      // ISSUE #3 FIX: Add null guards to prevent crashes when cache data is undefined
      let optimisticOurScore = (oldData?.game.ourScore as number) ?? 0;
      let optimisticOppScore = (oldData?.game.oppScore as number) ?? 0;

      if (updatedData.incrementOurScore !== undefined) {
        optimisticOurScore =
          ((oldData?.game.ourScore as number) ?? 0) + updatedData.incrementOurScore;
      } else if (updatedData.ourScore !== undefined) {
        optimisticOurScore = updatedData.ourScore;
      }

      if (updatedData.incrementOppScore !== undefined) {
        optimisticOppScore =
          ((oldData?.game.oppScore as number) ?? 0) + updatedData.incrementOppScore;
      } else if (updatedData.oppScore !== undefined) {
        optimisticOppScore = updatedData.oppScore;
      }

      // Broadcast IMMEDIATELY to other tabs (before server responds)
      await broadcastScoreUpdate({
        ourScore: optimisticOurScore,
        oppScore: optimisticOppScore,
        period: (updatedData.period ?? oldData?.game.period ?? 1) as number,
        clockSec: (updatedData.clockSec ?? oldData?.game.clockSec ?? 600) as number,
        status: (updatedData.status ?? oldData?.game.status ?? 'PLANNED') as string,
      });
      console.log("📡 Instant broadcast sent to other tabs (before server)");

      // Optimistically update current tab immediately
      queryClient.setQueryData(["game", gameId], (old: unknown) => {
        if (!old) return old;
        const oldData = old as { id: string; game: Record<string, unknown> };

        const updatedGame = { ...oldData.game };

        // ISSUE #3 FIX: Add null guards to prevent crashes when cache data is undefined
        // Handle increments for optimistic update
        if (updatedData.incrementOurScore !== undefined) {
          updatedGame.ourScore =
            ((oldData.game.ourScore as number) ?? 0) + updatedData.incrementOurScore;
        } else if (updatedData.ourScore !== undefined) {
          updatedGame.ourScore = updatedData.ourScore;
        }

        if (updatedData.incrementOppScore !== undefined) {
          updatedGame.oppScore =
            ((oldData.game.oppScore as number) ?? 0) + updatedData.incrementOppScore;
        } else if (updatedData.oppScore !== undefined) {
          updatedGame.oppScore = updatedData.oppScore;
        }

        // Handle other fields
        if (updatedData.status) updatedGame.status = updatedData.status;
        if (updatedData.period !== undefined)
          updatedGame.period = updatedData.period;
        if (updatedData.clockSec !== undefined)
          updatedGame.clockSec = updatedData.clockSec;

        return {
          ...oldData,
          game: updatedGame,
        };
      });

      console.log("⚡ Optimistic update applied:", updatedData);
      return { previousGameData, updatedData, sequence: currentSequence };
    },
    onSuccess: async (data, _variables, context: unknown) => {
      const ctx = context as { sequence?: number };
      const currentCacheData = queryClient.getQueryData(["game", gameId]) as
        | { game: { ourScore: number; oppScore: number } }
        | undefined;

      // Only update if this response is not stale (score hasn't moved ahead)
      if (
        !currentCacheData ||
        data.game.ourScore >= currentCacheData.game.ourScore
      ) {
        // Update cache with authoritative server response
        queryClient.setQueryData(["game", gameId], data);

        // Only broadcast if this is the latest mutation or score moved forward
        await broadcastScoreUpdate({
          ourScore: data.game.ourScore,
          oppScore: data.game.oppScore,
          period: data.game.period,
          clockSec: data.game.clockSec,
          status: data.game.status,
        });

        console.log(
          "✅ Score update confirmed by server - authoritative broadcast sent",
          { sequence: ctx?.sequence, score: data.game.ourScore }
        );
      } else {
        console.log(
          "⏭️ Skipping stale server response",
          {
            sequence: ctx?.sequence,
            serverScore: data.game.ourScore,
            currentScore: currentCacheData.game.ourScore,
          }
        );
      }
    },
    onError: (error, _updatedData, context: unknown) => {
      console.error("❌ Failed to update score:", error);
      // Rollback on error
      const ctx = context as { previousGameData?: unknown };
      if (ctx?.previousGameData) {
        queryClient.setQueryData(["game", gameId], ctx.previousGameData);
      }
    },
  });

  console.log("gameApiData", gameApiData);

  // Derive display data directly from API data (no local state for scores)
  const displayData = gameApiData
    ? {
        id: gameApiData.id,
        homeTeam: gameApiData.game.team?.name || "Your Team",
        awayTeam: gameApiData.game.opponent || "Opponent",
        homeScore: gameApiData.game.ourScore,
        awayScore: gameApiData.game.oppScore,
        status: mapGameStatus(gameApiData.game.status),
        period: gameApiData.game.period,
        clock: formatClock(gameApiData.game.clockSec),
      }
    : gameData;

  // Update React Query cache when realtime update comes in
  useEffect(() => {
    if (gameState && gameApiData) {
      const timeSinceLastMutation = Date.now() - lastMutationRef.current;

      // If we just made a mutation in the last 2 seconds, ignore realtime updates
      // to prevent stale database state from overwriting our optimistic update
      if (timeSinceLastMutation < 2000) {
        console.log("⏭️ Ignoring realtime update (recent mutation)", {
          timeSinceLastMutation,
        });
        return;
      }

      console.log("🔥 Realtime update received, updating cache:", gameState);

      // Update the query cache with realtime data
      queryClient.setQueryData(["game", gameId], (old: unknown) => {
        if (!old) return old;
        const oldData = old as { id: string; game: Record<string, unknown> };

        // Check if incoming score is stale (lower than current cache)
        const currentScore = oldData.game.ourScore as number;
        if (gameState.homeScore < currentScore) {
          console.log("⏭️ Ignoring stale realtime update in cache sync", {
            incomingScore: gameState.homeScore,
            currentScore,
          });
          return old; // Keep current cache, ignore stale update
        }

        return {
          ...oldData,
          game: {
            ...oldData.game,
            ourScore: gameState.homeScore,
            oppScore: gameState.awayScore,
            period: gameState.period,
            clockSec:
              parseInt(gameState.clock.split(":")[0]) * 60 +
              parseInt(gameState.clock.split(":")[1]),
            status:
              gameState.status === "active"
                ? "LIVE"
                : gameState.status === "completed"
                ? "FINAL"
                : "PLANNED",
          },
        };
      });
    }
  }, [gameState, gameApiData, queryClient, gameId]);

  console.log("Live Game Debug:", {
    gameId,
    gameData,
    selectedPlayer,
    pendingEventsCount,
    connectionStatus,
  });

  useEffect(() => {
    // Setup offline queue network listeners
    eventQueueManager.setupNetworkListeners();

    // Check for pending events on load
    updatePendingEventsCount();

    // Set up interval to check pending events
    const interval = setInterval(updatePendingEventsCount, 5000);
    return () => clearInterval(interval);
  }, [gameId]);

  const updatePendingEventsCount = async () => {
    const pendingEvents = await eventQueueManager.getPendingEvents(gameId);
    console.log("pendingEvents", pendingEvents);
    setPendingEventsCount(pendingEvents.length);
  };

  const handlePlayerSelect = (playerId: string) => {
    if (playerId === "") {
      setSelectedPlayer(null);
    } else {
      setSelectedPlayer(playerId);
    }
  };

  const handleAction = async (eventType: string, data: any) => {
    if (!selectedPlayer) {
      toast({
        title: "Selection Required",
        description: "Please select a player first",
        variant: "destructive",
      });
      return;
    }

    // ISSUE #2 FIX: Move Zustand store call outside async handler to avoid React rules violations
    // Get the selected player details before entering try block
    const { getActivePlayers } = usePlayersStore.getState();
    const players = getActivePlayers();

    // Declare snapshots outside try block for rollback access
    let previousGameData: unknown = null;
    let previousBoxScore: unknown = null;

    try {
      const player = players.find((p) => p.id === selectedPlayer);

      if (!player) {
        toast({
          title: "Player Not Found",
          description: "Selected player not found in roster",
          variant: "destructive",
        });
        return;
      }

      // Convert clock time to seconds (e.g., "08:42" -> 522 seconds)
      const clockToSeconds = (clockString: string): number => {
        const [minutes, seconds] = clockString.split(":").map(Number);
        return minutes * 60 + seconds;
      };

      console.log("Recording event:", {
        eventType,
        player: { id: player.id, number: player.number, name: player.name },
        gameId,
        period: gameData.period,
        clock: gameData.clock,
      });

      // Calculate stat deltas for optimistic updates
      const statDelta = calculateStatDelta(eventType);

      // Snapshot current data BEFORE any optimistic updates (for rollback)
      await queryClient.cancelQueries({ queryKey: ["game", gameId] });
      await queryClient.cancelQueries({ queryKey: ["boxscore", gameId] });

      previousGameData = queryClient.getQueryData(["game", gameId]);
      previousBoxScore = queryClient.getQueryData(["boxscore", gameId]);

      // OPTIMISTIC UPDATE #1: Update game score immediately
      if (statDelta.scoreIncrement > 0) {
        // Optimistically update game score in cache
        queryClient.setQueryData(["game", gameId], (old: unknown) => {
          if (!old) return old;
          const oldData = old as { id: string; game: Record<string, unknown> };

          return {
            ...oldData,
            game: {
              ...oldData.game,
              ourScore: ((oldData.game.ourScore as number) ?? 0) + statDelta.scoreIncrement,
            },
          };
        });

        // Broadcast optimistic score update to other tabs
        const updatedGame = queryClient.getQueryData(["game", gameId]) as
          | { game: { ourScore: number; oppScore: number; period: number; clockSec: number; status: string } }
          | undefined;

        if (updatedGame) {
          await broadcastScoreUpdate({
            ourScore: updatedGame.game.ourScore,
            oppScore: updatedGame.game.oppScore,
            period: updatedGame.game.period,
            clockSec: updatedGame.game.clockSec,
            status: updatedGame.game.status,
          });
        }

        console.log(`⚡ Optimistic score update: +${statDelta.scoreIncrement} points`);
      }

      // OPTIMISTIC UPDATE #2: Update box score immediately

      // Optimistically update player stats in box score cache
      queryClient.setQueryData(["boxscore", gameId], (old: unknown) => {
        if (!old) return old;
        const oldData = old as {
          gameId: string;
          teamStats: any[];
          playerStats: Array<{
            playerId: string;
            playerNumber: number;
            playerName: string;
            points: number;
            fgm: number;
            fga: number;
            fg3m: number;
            fg3a: number;
            ftm: number;
            fta: number;
            oreb: number;
            dreb: number;
            reb: number;
            ast: number;
            stl: number;
            blk: number;
            tov: number;
            pf: number;
            plusMinus: number;
            minutesPlayed: number;
          }>;
        };

        // Safety check: If playerStats doesn't exist, initialize it
        if (!oldData.playerStats) {
          console.log("⚠️ Box score data not loaded yet, skipping optimistic update");
          return old;
        }

        // Find or create player stats entry
        const playerIndex = oldData.playerStats.findIndex(
          (p) => p.playerNumber === player.number
        );

        let updatedPlayerStats = [...oldData.playerStats];

        if (playerIndex >= 0) {
          // Update existing player stats
          const currentStats = updatedPlayerStats[playerIndex];
          updatedPlayerStats[playerIndex] = {
            ...currentStats,
            points: currentStats.points + statDelta.scoreIncrement,
            fgm: currentStats.fgm + (statDelta.fgmIncrement ?? 0),
            fga: currentStats.fga + (statDelta.fgaIncrement ?? 0),
            fg3m: currentStats.fg3m + (statDelta.fg3mIncrement ?? 0),
            fg3a: currentStats.fg3a + (statDelta.fg3aIncrement ?? 0),
            ftm: currentStats.ftm + (statDelta.ftmIncrement ?? 0),
            fta: currentStats.fta + (statDelta.ftaIncrement ?? 0),
            oreb: currentStats.oreb + (statDelta.orebIncrement ?? 0),
            dreb: currentStats.dreb + (statDelta.drebIncrement ?? 0),
            reb: currentStats.reb + (statDelta.orebIncrement ?? 0) + (statDelta.drebIncrement ?? 0),
            ast: currentStats.ast + (statDelta.astIncrement ?? 0),
            stl: currentStats.stl + (statDelta.stlIncrement ?? 0),
            blk: currentStats.blk + (statDelta.blkIncrement ?? 0),
            tov: currentStats.tov + (statDelta.tovIncrement ?? 0),
            pf: currentStats.pf + (statDelta.pfIncrement ?? 0),
          };
        } else {
          // Create new player stats entry (first event for this player)
          updatedPlayerStats.push({
            playerId: player.id,
            playerNumber: player.number,
            playerName: player.name,
            points: statDelta.scoreIncrement,
            fgm: statDelta.fgmIncrement ?? 0,
            fga: statDelta.fgaIncrement ?? 0,
            fg3m: statDelta.fg3mIncrement ?? 0,
            fg3a: statDelta.fg3aIncrement ?? 0,
            ftm: statDelta.ftmIncrement ?? 0,
            fta: statDelta.ftaIncrement ?? 0,
            oreb: statDelta.orebIncrement ?? 0,
            dreb: statDelta.drebIncrement ?? 0,
            reb: (statDelta.orebIncrement ?? 0) + (statDelta.drebIncrement ?? 0),
            ast: statDelta.astIncrement ?? 0,
            stl: statDelta.stlIncrement ?? 0,
            blk: statDelta.blkIncrement ?? 0,
            tov: statDelta.tovIncrement ?? 0,
            pf: statDelta.pfIncrement ?? 0,
            plusMinus: 0,
            minutesPlayed: 0,
          });
        }

        // Update team stats as well
        const updatedTeamStats = (oldData.teamStats || []).map((team) => {
          if (team.teamSide === 'US') {
            return {
              ...team,
              points: team.points + statDelta.scoreIncrement,
              fgm: team.fgm + (statDelta.fgmIncrement ?? 0),
              fga: team.fga + (statDelta.fgaIncrement ?? 0),
              fg3m: team.fg3m + (statDelta.fg3mIncrement ?? 0),
              fg3a: team.fg3a + (statDelta.fg3aIncrement ?? 0),
              ftm: team.ftm + (statDelta.ftmIncrement ?? 0),
              fta: team.fta + (statDelta.ftaIncrement ?? 0),
              oreb: team.oreb + (statDelta.orebIncrement ?? 0),
              dreb: team.dreb + (statDelta.drebIncrement ?? 0),
              reb: team.reb + (statDelta.orebIncrement ?? 0) + (statDelta.drebIncrement ?? 0),
              ast: team.ast + (statDelta.astIncrement ?? 0),
              stl: team.stl + (statDelta.stlIncrement ?? 0),
              blk: team.blk + (statDelta.blkIncrement ?? 0),
              tov: team.tov + (statDelta.tovIncrement ?? 0),
              pf: team.pf + (statDelta.pfIncrement ?? 0),
            };
          }
          return team;
        });

        console.log(`⚡ Optimistic box score update for player #${player.number}`);

        return {
          ...oldData,
          playerStats: updatedPlayerStats,
          teamStats: updatedTeamStats,
        };
      });

      // Add event to offline queue (always for "your team")
      // Use player number as ID since that's more likely what backend expects
      await eventQueueManager.addEvent(
        gameId,
        eventType,
        player.number.toString(), // Use player number instead of UUID
        "home", // Your team is always considered "home" in the data
        {
          ...data,
          period: gameData.period,
          clockSec: clockToSeconds(gameData.clock),
        }
      );

      // The event will sync through offline queue
      // When it succeeds, backend will broadcast updates via Supabase Realtime
      // The real-time updates will be applied through useRealtimeGame hook
      // If sync fails, we'll keep the optimistic state until successful sync

      // Update pending events count
      updatePendingEventsCount();

      toast({
        title: "Event Recorded",
        description: `${eventType.replace(/_/g, " ")} recorded for player #${
          player.number
        }`,
      });

      // Keep player selected for rapid stat entry
    } catch (error) {
      console.error("Failed to record event:", error);

      // Rollback optimistic updates on error
      // Use the snapshots captured BEFORE optimistic updates
      if (previousGameData) {
        queryClient.setQueryData(["game", gameId], previousGameData);
        console.log("🔄 Rolled back game score update");
      }
      if (previousBoxScore) {
        queryClient.setQueryData(["boxscore", gameId], previousBoxScore);
        console.log("🔄 Rolled back box score update");
      }

      toast({
        title: "Recording Failed",
        description: "Could not record event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUndoLastEvent = async () => {
    const success = await eventQueueManager.removeLastPendingEvent(gameId);
    if (success) {
      toast({
        title: "Event Undone",
        description: "Last pending event has been removed",
      });
      updatePendingEventsCount();
    } else {
      toast({
        title: "Nothing to Undo",
        description: "No pending events found",
        variant: "destructive",
      });
    }
  };

  const handleSyncNow = async () => {
    if (!navigator.onLine) {
      toast({
        title: "Offline",
        description: "Cannot sync while offline",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await eventQueueManager.syncPendingEvents();
      updatePendingEventsCount();

      if (result.total === 0) {
        toast({
          title: "Nothing to Sync",
          description: "No pending events found",
        });
      } else if (result.synced === result.total) {
        toast({
          title: "Sync Complete",
          description: `All ${result.synced} events synced successfully`,
        });
      } else if (result.synced === 0) {
        // Check if it's an auth issue or API issue
        const pendingEvents = await eventQueueManager.getPendingEvents(gameId);
        if (pendingEvents.length > 0) {
          toast({
            title: "Sync Issue",
            description:
              "Events queued - check authentication or API connection",
            variant: "destructive",
          });
        } else {
          toast({
            title: "API Unavailable",
            description: "Events will sync when backend is running",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Partial Sync",
          description: `${result.synced}/${result.total} events synced`,
        });
      }
    } catch (error) {
      toast({
        title: "Sync Error",
        description: "Unexpected error during sync",
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex justify-center items-center min-h-[50vh]">
          <p className="text-muted-foreground">Loading game data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex justify-center items-center min-h-[50vh]">
          <p className="text-red-500">Error loading game: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Game Controls - Top of Page */}
      <GameControls
        gameId={gameId}
        currentPeriod={displayData.period}
        currentClock={
          parseInt(displayData.clock.split(":")[0]) * 60 +
          parseInt(displayData.clock.split(":")[1])
        }
        status={displayData.status}
      />

      {/* Game Header */}
      <GameHeader
        gameId={gameId}
        homeTeam={displayData.homeTeam}
        awayTeam={displayData.awayTeam}
        homeScore={displayData.homeScore}
        awayScore={displayData.awayScore}
        period={displayData.period}
        clock={displayData.clock}
        status={displayData.status}
      />

      {/* Offline Status & Controls */}
      <Card className="mb-4">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div
                className={`flex items-center gap-2 ${
                  navigator.onLine ? "text-green-600" : "text-red-600"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    navigator.onLine ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                {navigator.onLine ? "Online" : "Offline"}
              </div>
              <div
                className={`flex items-center gap-2 ${
                  isConnected ? "text-green-600" : "text-yellow-600"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-yellow-500"
                  }`}
                />
                Realtime: {connectionStatus}
              </div>
              {pendingEventsCount > 0 && (
                <div className="text-yellow-600">
                  📋 {pendingEventsCount} events pending sync
                  {!navigator.onLine && (
                    <span className="text-xs ml-1">(offline)</span>
                  )}
                </div>
              )}
              {recentEvents.length > 0 && (
                <div className="text-blue-600">
                  📡 {recentEvents.length} recent events
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleUndoLastEvent}
                variant="outline"
                size="sm"
                disabled={pendingEventsCount === 0}
              >
                ↶ Undo Last
              </Button>
              <Button
                onClick={handleSyncNow}
                variant="outline"
                size="sm"
                disabled={!navigator.onLine || pendingEventsCount === 0}
              >
                🔄 Sync Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Game Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Left Column: Action Grid */}
        <div className="lg:col-span-2">
          <ActionGrid
            selectedPlayer={selectedPlayer}
            onAction={handleAction}
            disabled={displayData.status !== "active"}
          />
        </div>

        {/* Right Column: Players Grid */}
        <div className="space-y-4">
          <PlayersGrid
            selectedPlayer={selectedPlayer}
            onPlayerSelect={handlePlayerSelect}
          />
        </div>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BoxScore gameId={gameId} />
        <PlayByPlay gameId={gameId} />
      </div>
    </div>
  );
}

export default function LiveGamePage({ params }: LiveGamePageProps) {
  const { id } = use(params);

  return (
    <ProtectedRoute requiredRole="scorer">
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4">Live Game: {id}</h2>
        <LiveGameContent gameId={id} />
      </div>
    </ProtectedRoute>
  );
}
