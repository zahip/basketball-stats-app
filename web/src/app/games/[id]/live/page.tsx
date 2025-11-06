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
  const { gameState, recentEvents, connectionStatus, isConnected } =
    useRealtimeGame(gameId);
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

  // Mutation to update game score with optimistic updates for current tab
  const updateGameMutation = useMutation({
    mutationFn: (data: UpdateGameData) => gamesApi.update(gameId, data),
    onMutate: async (updatedData) => {
      // Record mutation timestamp
      lastMutationRef.current = Date.now();

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["game", gameId] });

      // Snapshot previous value
      const previousGameData = queryClient.getQueryData(["game", gameId]);

      // Optimistically update current tab immediately
      queryClient.setQueryData(["game", gameId], (old: unknown) => {
        if (!old) return old;
        const oldData = old as { id: string; game: Record<string, unknown> };
        return {
          ...oldData,
          game: {
            ...oldData.game,
            ...updatedData,
          },
        };
      });

      console.log("⚡ Optimistic update applied:", updatedData);
      return { previousGameData };
    },
    onSuccess: async (data) => {
      // Update cache with server response
      queryClient.setQueryData(["game", gameId], data);
      console.log("✅ Score update confirmed by server - Supabase Realtime will notify other tabs");
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
        console.log('⏭️ Ignoring realtime update (recent mutation)', { timeSinceLastMutation });
        return;
      }

      console.log('🔥 Realtime update received, updating cache:', gameState);

      // Update the query cache with realtime data
      queryClient.setQueryData(["game", gameId], (old: unknown) => {
        if (!old) return old;
        const oldData = old as { id: string; game: Record<string, unknown> };

        return {
          ...oldData,
          game: {
            ...oldData.game,
            ourScore: gameState.homeScore,
            oppScore: gameState.awayScore,
            period: gameState.period,
            clockSec: parseInt(gameState.clock.split(':')[0]) * 60 + parseInt(gameState.clock.split(':')[1]),
            status: gameState.status === 'active' ? 'LIVE' :
                    gameState.status === 'completed' ? 'FINAL' : 'PLANNED',
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

    try {
      // Get the selected player details
      const { getActivePlayers } = usePlayersStore.getState();
      const players = getActivePlayers();
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

      // Calculate points and update score in database
      if (
        eventType.includes("made") ||
        eventType.includes("field_goal_made") ||
        eventType.includes("three_point_made")
      ) {
        const points = eventType.includes("three_point")
          ? 3
          : eventType.includes("free_throw")
          ? 1
          : 2;

        // Calculate new score from current API data
        const newScore = (gameApiData?.game.ourScore || 0) + points;

        // Update score in database - optimistic update in mutation will show it immediately
        updateGameMutation.mutate({
          ourScore: newScore,
        });
      }

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
      toast({
        title: "Recording Failed",
        description: "Event will be retried when connection is restored",
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Action Grid */}
        <div className="lg:col-span-2">
          <ActionGrid
            selectedPlayer={selectedPlayer}
            onAction={handleAction}
            disabled={displayData.status !== "active"}
          />
        </div>

        {/* Right Column: Players Grid */}
        <div>
          <PlayersGrid
            selectedPlayer={selectedPlayer}
            onPlayerSelect={handlePlayerSelect}
          />
        </div>
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
