"use client";

import { useState, useEffect, useRef } from "react";
import { use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { GameScoreboard } from "@/components/game/game-scoreboard";
import { UnifiedPlayerSection } from "@/components/game/unified-player-section";
import { ActionPad } from "@/components/game/action-pad";
import { QuickBench } from "@/components/game/quick-bench";
import { BoxScore } from "@/components/game/box-score";
import { PlayByPlay } from "@/components/game/play-by-play";
import { eventQueueManager } from "@/lib/offline-queue";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeGame } from "@/hooks/use-realtime-game";
import { useGameClock } from "@/hooks/use-game-clock";
import { usePlayersStore } from "@/lib/stores/players-store";
import { gamesApi, UpdateGameData } from "@/lib/api-client";

interface LiveGamePageProps {
  params: Promise<{ id: string }>;
}

function formatClock(clockSec: number): string {
  const minutes = Math.floor(clockSec / 60);
  const seconds = clockSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

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
    case "SHOT_2_MADE":
      delta.scoreIncrement = 2;
      delta.fgmIncrement = 1;
      delta.fgaIncrement = 1;
      break;
    case "SHOT_2_MISS":
      delta.fgaIncrement = 1;
      break;
    case "SHOT_3_MADE":
      delta.scoreIncrement = 3;
      delta.fg3mIncrement = 1;
      delta.fg3aIncrement = 1;
      delta.fgmIncrement = 1;
      delta.fgaIncrement = 1;
      break;
    case "SHOT_3_MISS":
      delta.fg3aIncrement = 1;
      delta.fgaIncrement = 1;
      break;
    case "FT_MADE":
      delta.scoreIncrement = 1;
      delta.ftmIncrement = 1;
      delta.ftaIncrement = 1;
      break;
    case "FT_MISS":
      delta.ftaIncrement = 1;
      break;
    case "REB_O":
      delta.orebIncrement = 1;
      break;
    case "REB_D":
      delta.drebIncrement = 1;
      break;
    case "AST":
      delta.astIncrement = 1;
      break;
    case "STL":
      delta.stlIncrement = 1;
      break;
    case "BLK":
      delta.blkIncrement = 1;
      break;
    case "TOV":
      delta.tovIncrement = 1;
      break;
    case "FOUL":
      delta.pfIncrement = 1;
      break;
  }

  return delta;
}

function LiveGameContent({ gameId }: { gameId: string }) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<"home" | "away">("home");
  const [pendingEventsCount, setPendingEventsCount] = useState(0);
  const [boxScoreOpen, setBoxScoreOpen] = useState(false);
  const [playByPlayOpen, setPlayByPlayOpen] = useState(false);
  const [benchOpen, setBenchOpen] = useState(false);
  const [courtPlayers, setCourtPlayers] = useState<string[]>([]);

  const { toast } = useToast();
  const { gameState, isConnected, broadcastScoreUpdate } =
    useRealtimeGame(gameId);
  const queryClient = useQueryClient();
  const lastMutationRef = useRef<number>(0);
  const mutationSequenceRef = useRef<number>(0);

  const { getActivePlayers } = usePlayersStore();
  const allPlayers = getActivePlayers();
  const courtPlayersList = allPlayers.filter((p) =>
    courtPlayers.includes(p.id)
  );
  const benchPlayersList = allPlayers.filter(
    (p) => !courtPlayers.includes(p.id)
  );

  // Fetch game data
  const {
    data: gameApiData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["game", gameId],
    queryFn: () => gamesApi.getById(gameId),
    refetchOnWindowFocus: true,
    refetchInterval: false,
  });

  // Initial status for useGameClock hook
  const initialStatus = gameApiData
    ? mapGameStatus(gameApiData.game.status)
    : ("scheduled" as const);

  // Game clock hook - manages timer and player playing time
  const { clockSec, playingTime, resetClock } = useGameClock({
    gameId,
    initialClockSec: gameApiData?.game.clockSec ?? 600,
    initialPeriod: gameApiData?.game.period ?? 1,
    status: initialStatus,
    courtPlayers,
  });

  // Derived display data (uses local clockSec from useGameClock)
  const displayData = gameApiData
    ? {
        id: gameApiData.id,
        homeTeam: gameApiData.game.team?.name || "Your Team",
        awayTeam: gameApiData.game.opponent || "Opponent",
        homeScore: gameApiData.game.ourScore,
        awayScore: gameApiData.game.oppScore,
        status: mapGameStatus(gameApiData.game.status),
        period: gameApiData.game.period,
        clock: formatClock(clockSec), // Use local clock from useGameClock
      }
    : {
        id: gameId,
        homeTeam: "Your Team",
        awayTeam: "Opponent",
        homeScore: 0,
        awayScore: 0,
        status: "scheduled" as const,
        period: 1,
        clock: formatClock(clockSec), // Use local clock from useGameClock
      };

  // Game update mutation
  const updateGameMutation = useMutation({
    mutationFn: (data: UpdateGameData) => gamesApi.update(gameId, data),
    onMutate: async (updatedData) => {
      lastMutationRef.current = Date.now();
      mutationSequenceRef.current += 1;
      const currentSequence = mutationSequenceRef.current;

      await queryClient.cancelQueries({ queryKey: ["game", gameId] });

      const previousGameData = queryClient.getQueryData(["game", gameId]);
      const oldData = previousGameData as
        | { id: string; game: Record<string, unknown> }
        | undefined;

      let optimisticOurScore = (oldData?.game.ourScore as number) ?? 0;
      let optimisticOppScore = (oldData?.game.oppScore as number) ?? 0;

      if (updatedData.incrementOurScore !== undefined) {
        optimisticOurScore =
          ((oldData?.game.ourScore as number) ?? 0) +
          updatedData.incrementOurScore;
      } else if (updatedData.ourScore !== undefined) {
        optimisticOurScore = updatedData.ourScore;
      }

      if (updatedData.incrementOppScore !== undefined) {
        optimisticOppScore =
          ((oldData?.game.oppScore as number) ?? 0) +
          updatedData.incrementOppScore;
      } else if (updatedData.oppScore !== undefined) {
        optimisticOppScore = updatedData.oppScore;
      }

      await broadcastScoreUpdate({
        ourScore: optimisticOurScore,
        oppScore: optimisticOppScore,
        period: (updatedData.period ?? oldData?.game.period ?? 1) as number,
        clockSec: (updatedData.clockSec ??
          oldData?.game.clockSec ??
          600) as number,
        status: (updatedData.status ??
          oldData?.game.status ??
          "PLANNED") as string,
      });

      queryClient.setQueryData(["game", gameId], (old: unknown) => {
        if (!old) return old;
        const oldData = old as { id: string; game: Record<string, unknown> };

        const updatedGame = { ...oldData.game };

        if (updatedData.incrementOurScore !== undefined) {
          updatedGame.ourScore =
            ((oldData.game.ourScore as number) ?? 0) +
            updatedData.incrementOurScore;
        } else if (updatedData.ourScore !== undefined) {
          updatedGame.ourScore = updatedData.ourScore;
        }

        if (updatedData.incrementOppScore !== undefined) {
          updatedGame.oppScore =
            ((oldData.game.oppScore as number) ?? 0) +
            updatedData.incrementOppScore;
        } else if (updatedData.oppScore !== undefined) {
          updatedGame.oppScore = updatedData.oppScore;
        }

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

      return { previousGameData, updatedData, sequence: currentSequence };
    },
    onSuccess: async (data) => {
      const currentCacheData = queryClient.getQueryData(["game", gameId]) as
        | { game: { ourScore: number; oppScore: number } }
        | undefined;

      if (
        !currentCacheData ||
        data.game.ourScore >= currentCacheData.game.ourScore
      ) {
        queryClient.setQueryData(["game", gameId], data);

        await broadcastScoreUpdate({
          ourScore: data.game.ourScore,
          oppScore: data.game.oppScore,
          period: data.game.period,
          clockSec: data.game.clockSec,
          status: data.game.status,
        });
      }
    },
    onError: (error, _updatedData, context: unknown) => {
      console.error("Failed to update score:", error);
      const ctx = context as { previousGameData?: unknown };
      if (ctx?.previousGameData) {
        queryClient.setQueryData(["game", gameId], ctx.previousGameData);
      }
    },
  });

  // Sync cache with realtime updates
  useEffect(() => {
    if (gameState && gameApiData) {
      const timeSinceLastMutation = Date.now() - lastMutationRef.current;

      if (timeSinceLastMutation < 2000) {
        return;
      }

      queryClient.setQueryData(["game", gameId], (old: unknown) => {
        if (!old) return old;
        const oldData = old as { id: string; game: Record<string, unknown> };

        const currentScore = oldData.game.ourScore as number;
        if (gameState.homeScore < currentScore) {
          return old;
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

  const updatePendingEventsCount = async () => {
    const pendingEvents = await eventQueueManager.getPendingEvents(gameId);
    setPendingEventsCount(pendingEvents.length);
  };

  // Setup offline queue
  useEffect(() => {
    eventQueueManager.setupNetworkListeners();
    updatePendingEventsCount();

    const interval = setInterval(updatePendingEventsCount, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  const handlePlayerSelect = (playerId: string) => {
    setSelectedPlayer(playerId === "" ? null : playerId);
  };

  const handleAction = async (eventType: string, data?: Record<string, unknown>) => {
    if (selectedTeam === "home" && !selectedPlayer) {
      toast({
        title: "Selection Required",
        description: "Please select a player first",
        variant: "destructive",
      });
      return;
    }

    const players = getActivePlayers();
    let previousGameData: unknown = null;
    let previousBoxScore: unknown = null;

    try {
      let player = null;
      if (selectedTeam === "home") {
        player = players.find((p) => p.id === selectedPlayer);

        if (!player) {
          toast({
            title: "Player Not Found",
            description: "Selected player not found in roster",
            variant: "destructive",
          });
          return;
        }
      }

      const statDelta = calculateStatDelta(eventType);

      await queryClient.cancelQueries({ queryKey: ["game", gameId] });
      await queryClient.cancelQueries({ queryKey: ["boxscore", gameId] });

      previousGameData = queryClient.getQueryData(["game", gameId]);
      previousBoxScore = queryClient.getQueryData(["boxscore", gameId]);

      if (statDelta.scoreIncrement > 0) {
        const scoreField = selectedTeam === "home" ? "ourScore" : "oppScore";
        queryClient.setQueryData(["game", gameId], (old: unknown) => {
          if (!old) return old;
          const oldData = old as { id: string; game: Record<string, unknown> };

          return {
            ...oldData,
            game: {
              ...oldData.game,
              [scoreField]:
                ((oldData.game[scoreField] as number) ?? 0) +
                statDelta.scoreIncrement,
            },
          };
        });

        const updatedGame = queryClient.getQueryData(["game", gameId]) as
          | {
              game: {
                ourScore: number;
                oppScore: number;
                period: number;
                clockSec: number;
                status: string;
              };
            }
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
      }

      // Queue event for offline processing
      await eventQueueManager.addEvent(
        gameId,
        eventType,
        selectedTeam === "home" ? player?.number.toString() || "" : "",
        selectedTeam
      );

      toast({
        title: "Event Recorded",
        description: `${eventType} recorded`,
      });

      updatePendingEventsCount();
    } catch (error) {
      console.error("Failed to record event:", error);
      if (previousGameData) {
        queryClient.setQueryData(["game", gameId], previousGameData);
      }
      if (previousBoxScore) {
        queryClient.setQueryData(["boxscore", gameId], previousBoxScore);
      }

      toast({
        title: "Error",
        description: "Failed to record event",
        variant: "destructive",
      });
    }
  };

  const handlePlayPause = async () => {
    const currentStatus = displayData.status;
    const newStatus = currentStatus === "active" ? "LIVE" : "active";

    updateGameMutation.mutate({
      status: newStatus === "active" ? "LIVE" : "PLANNED",
    });
  };

  const handleNextPeriod = async () => {
    const nextPeriod = displayData.period + 1;
    if (nextPeriod <= 4) {
      resetClock(600); // Reset local clock immediately
      updateGameMutation.mutate({
        period: nextPeriod,
        clockSec: 600,
      });
    }
  };

  const handleSubIn = async (playerInId: string, playerOutId: string) => {
    const newCourt = courtPlayers.filter((id) => id !== playerOutId);
    newCourt.push(playerInId);
    setCourtPlayers(newCourt);

    // Record SUB_OUT event for player leaving court
    if (playerOutId) {
      const playerOut = allPlayers.find((p) => p.id === playerOutId);
      if (playerOut) {
        await eventQueueManager.addEvent(
          gameId,
          "SUB_OUT",
          playerOut.number.toString(),
          "home",
          {
            period: displayData.period,
            clockSec: clockSec,
          }
        );
      }
    }

    // Record SUB_IN event for player entering court
    const playerIn = allPlayers.find((p) => p.id === playerInId);
    if (playerIn) {
      await eventQueueManager.addEvent(
        gameId,
        "SUB_IN",
        playerIn.number.toString(),
        "home",
        {
          period: displayData.period,
          clockSec: clockSec,
        }
      );
    }

    toast({
      title: "Substitution",
      description: "Player substituted",
    });

    updatePendingEventsCount();
  };

  const handleSubOut = async (playerId: string) => {
    setCourtPlayers(courtPlayers.filter((id) => id !== playerId));

    // Record SUB_OUT event
    const player = allPlayers.find((p) => p.id === playerId);
    if (player) {
      await eventQueueManager.addEvent(
        gameId,
        "SUB_OUT",
        player.number.toString(),
        "home",
        {
          period: displayData.period,
          clockSec: clockSec,
        }
      );

      toast({
        title: "Substitution",
        description: `${player.name} out`,
      });

      updatePendingEventsCount();
    }
  };

  const handleCourtPlayersChange = async (
    newCourtPlayers: typeof courtPlayersList
  ) => {
    const newCourtPlayerIds = newCourtPlayers.map((p) => p.id);
    const oldCourtPlayerIds = courtPlayers;

    // Find players who were added (SUB_IN)
    const playersIn = newCourtPlayerIds.filter(
      (id) => !oldCourtPlayerIds.includes(id)
    );

    // Find players who were removed (SUB_OUT)
    const playersOut = oldCourtPlayerIds.filter(
      (id) => !newCourtPlayerIds.includes(id)
    );

    // Update state first
    setCourtPlayers(newCourtPlayerIds);

    // Record SUB_OUT events for players leaving court
    for (const playerId of playersOut) {
      const player = allPlayers.find((p) => p.id === playerId);
      if (player) {
        await eventQueueManager.addEvent(
          gameId,
          "SUB_OUT",
          player.number.toString(),
          "home",
          {
            period: displayData.period,
            clockSec: clockSec,
          }
        );
      }
    }

    // Record SUB_IN events for players entering court
    for (const playerId of playersIn) {
      const player = allPlayers.find((p) => p.id === playerId);
      if (player) {
        await eventQueueManager.addEvent(
          gameId,
          "SUB_IN",
          player.number.toString(),
          "home",
          {
            period: displayData.period,
            clockSec: clockSec,
          }
        );
      }
    }

    // Update pending events count if any subs occurred
    if (playersIn.length > 0 || playersOut.length > 0) {
      updatePendingEventsCount();

      toast({
        title: "Substitution",
        description: `${playersOut.length} out, ${playersIn.length} in`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <p className="text-muted-foreground">Loading game data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-4">
        <p className="text-red-500">Error loading game: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background overflow-hidden">
      {/* Professional Scoreboard Header */}
      <GameScoreboard
        homeTeam={displayData.homeTeam}
        awayTeam={displayData.awayTeam}
        homeScore={displayData.homeScore}
        awayScore={displayData.awayScore}
        period={displayData.period}
        clock={displayData.clock}
        status={displayData.status}
        onPlayPause={handlePlayPause}
        onNextPeriod={handleNextPeriod}
        onSettings={() => {
          /* Settings modal */
        }}
      />

      {/* Main Content Container */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Container wrapper for consistent alignment */}
          <div className="max-w-6xl mx-auto w-full px-4 flex flex-col gap-2 py-3">
            {/* Unified Player Section - Selection + Drag & Drop */}
            {selectedTeam === "home" && (
              <UnifiedPlayerSection
                courtPlayers={courtPlayersList}
                benchPlayers={benchPlayersList}
                playingTime={playingTime}
                onCourtPlayersChange={handleCourtPlayersChange}
                activePlayer={selectedPlayer}
                onPlayerSelect={handlePlayerSelect}
                onSubstitution={handleSubIn}
              />
            )}

            {/* Opponent Mode Notice */}
            {selectedTeam === "away" && (
              <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-y border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold text-center">
                  📊 Recording opponent stats (team-level only)
                </p>
              </div>
            )}

            {/* Action Pad */}
            <div
              className="flex-1"
              role="main"
              aria-label="Game stat recording area"
            >
              <ActionPad
                selectedPlayer={selectedPlayer}
                selectedTeam={selectedTeam}
                onAction={handleAction}
                disabled={displayData.status !== "active"}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="flex-shrink-0 border-t border-primary/10 bg-gradient-to-r from-white/80 via-white/75 to-white/80 dark:from-slate-950/80 dark:via-slate-950/75 dark:to-slate-950/80 backdrop-blur-sm shadow-lg">
        <div
          className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3"
          role="navigation"
          aria-label="Game controls"
        >
          <div className="flex items-center gap-2">
            <Button
              variant={selectedTeam === "home" ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setSelectedTeam(selectedTeam === "home" ? "away" : "home")
              }
              className={`text-xs h-9 px-4 font-semibold transition-all duration-200 rounded-lg ${
                selectedTeam === "home"
                  ? "ring-2 ring-primary ring-offset-2 shadow-md"
                  : "hover:shadow-sm"
              }`}
            >
              {selectedTeam === "home" ? "📊 Your Team" : "👥 Opponent"}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBoxScoreOpen(true)}
              className="text-xs h-9 px-3 font-semibold hover:bg-primary/10 rounded-lg transition-all duration-200"
            >
              <span className="text-lg">📈</span>
              <span className="hidden sm:inline ml-1">Box Score</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPlayByPlayOpen(true)}
              className="text-xs h-9 px-3 font-semibold hover:bg-primary/10 rounded-lg transition-all duration-200"
            >
              <span className="text-lg">📝</span>
              <span className="hidden sm:inline ml-1">Play-by-Play</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {!navigator.onLine && (
              <Badge
                variant="destructive"
                className="text-[10px] h-7 px-2.5 font-semibold rounded-full"
              >
                🔴 Offline
              </Badge>
            )}
            {!isConnected && (
              <Badge
                variant="secondary"
                className="text-[10px] h-7 px-2.5 font-semibold rounded-full"
              >
                ⚠️ Disconnected
              </Badge>
            )}
            {pendingEventsCount > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] h-7 px-2.5 font-semibold rounded-full border-yellow-400/50 bg-yellow-50 dark:bg-yellow-950/20"
              >
                ⏳ {pendingEventsCount} pending
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Box Score Modal */}
      <Dialog open={boxScoreOpen} onOpenChange={setBoxScoreOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              📈 Box Score
            </DialogTitle>
            <DialogDescription>
              Live player and team statistics
            </DialogDescription>
          </DialogHeader>
          <BoxScore gameId={gameId} />
        </DialogContent>
      </Dialog>

      {/* Play-by-Play Modal */}
      <Dialog open={playByPlayOpen} onOpenChange={setPlayByPlayOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              📝 Play-by-Play
            </DialogTitle>
            <DialogDescription>
              Game events in chronological order
            </DialogDescription>
          </DialogHeader>
          <PlayByPlay gameId={gameId} />
        </DialogContent>
      </Dialog>

      {/* Quick Bench Substitution Sheet */}
      <QuickBench
        isOpen={benchOpen}
        onClose={() => setBenchOpen(false)}
        courtPlayers={courtPlayersList}
        benchPlayers={benchPlayersList}
        playingTime={playingTime}
        onSubIn={handleSubIn}
        onSubOut={handleSubOut}
      />
    </div>
  );
}

export default function LiveGamePage({ params }: LiveGamePageProps) {
  const { id } = use(params);

  return (
    <ProtectedRoute>
      <LiveGameContent gameId={id} />
    </ProtectedRoute>
  );
}
