"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only create Supabase client if credentials are available
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

interface GameState {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  period: number;
  clock: string;
  status: "scheduled" | "active" | "paused" | "completed";
}

interface GameEvent {
  id: string;
  gameId: string;
  type: string;
  playerId: string;
  team: "home" | "away";
  timestamp: number;
}

interface BoxScore {
  gameId: string;
  homeStats: any;
  awayStats: any;
  playerStats: any[];
}

export function useRealtimeGame(gameId: string) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [recentEvents, setRecentEvents] = useState<GameEvent[]>([]);
  const [boxScore, setBoxScore] = useState<BoxScore | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!gameId || !supabase) {
      // If no Supabase client, just set disconnected status
      setConnectionStatus("disconnected");
      return;
    }

    console.log(`📡 Setting up Supabase Realtime for game: ${gameId}`);

    // Primary channel: Broadcast for instant fan-out
    const gameChannel = supabase
      .channel(`game_${gameId}`)
      .on("broadcast", { event: "score_update" }, (payload) => {
        console.log("🔥 Score update broadcast received:", payload);

        if (payload.payload) {
          // Only update if the incoming score is >= current score (prevent stale updates)
          setGameState((currentState) => {
            if (
              currentState &&
              payload.payload.ourScore < currentState.homeScore
            ) {
              console.log("⏭️ Ignoring stale broadcast update", {
                incomingScore: payload.payload.ourScore,
                currentScore: currentState.homeScore,
              });
              return currentState; // Keep current state, ignore stale update
            }

            return {
              id: gameId,
              homeTeam: "", // Not needed for score updates
              awayTeam: "",
              homeScore: payload.payload.ourScore,
              awayScore: payload.payload.oppScore,
              period: payload.payload.period,
              clock: formatClockFromSeconds(payload.payload.clockSec),
              status: mapDatabaseStatusToLocal(payload.payload.status),
            };
          });
        }
      })
      .on("broadcast", { event: "game_event" }, (payload) => {
        console.log("Game event:", payload);
        if (payload.payload) {
          setRecentEvents((prev) => [payload.payload, ...prev.slice(0, 9)]);
        }
      })
      .subscribe((status) => {
        console.log("Game realtime subscription status:", status);
        setConnectionStatus(
          status === "SUBSCRIBED" ? "connected" : "connecting"
        );
      });

    channelRef.current = gameChannel;

    // Fallback: Postgres changes for recovery/sync
    const postgresChannel = supabase
      .channel(`game_${gameId}_postgres`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          console.log("🔄 Postgres fallback update:", payload);
          const updatedGame = payload.new as any;

          if (updatedGame) {
            // Only update if the incoming score is >= current score (prevent stale updates)
            setGameState((currentState) => {
              if (
                currentState &&
                updatedGame.ourScore < currentState.homeScore
              ) {
                console.log("⏭️ Ignoring stale Postgres update", {
                  incomingScore: updatedGame.ourScore,
                  currentScore: currentState.homeScore,
                });
                return currentState; // Keep current state, ignore stale update
              }

              return {
                id: updatedGame.id,
                homeTeam: updatedGame.teamId,
                awayTeam: updatedGame.opponent,
                homeScore: updatedGame.ourScore,
                awayScore: updatedGame.oppScore,
                period: updatedGame.period,
                clock: formatClockFromSeconds(updatedGame.clockSec),
                status: mapDatabaseStatusToLocal(updatedGame.status),
              };
            });
          }
        }
      )
      .subscribe();

    // Handle connection state changes
    const handleConnectionChange = () => {
      setConnectionStatus(navigator.onLine ? "connected" : "disconnected");
    };

    window.addEventListener("online", handleConnectionChange);
    window.addEventListener("offline", handleConnectionChange);

    // Cleanup subscriptions
    return () => {
      gameChannel.unsubscribe();
      postgresChannel.unsubscribe();
      window.removeEventListener("online", handleConnectionChange);
      window.removeEventListener("offline", handleConnectionChange);
    };
  }, [gameId]);

  // Helper function to format clock
  const formatClockFromSeconds = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper function to map database status to local status
  const mapDatabaseStatusToLocal = (
    dbStatus: string
  ): "scheduled" | "active" | "paused" | "completed" => {
    switch (dbStatus) {
      case "LIVE":
        return "active";
      case "FINAL":
        return "completed";
      case "PLANNED":
        return "scheduled";
      default:
        return "scheduled";
    }
  };

  // Function to broadcast score updates to other tabs
  const broadcastScoreUpdate = async (update: {
    ourScore: number;
    oppScore: number;
    period: number;
    clockSec: number;
    status: string;
    timestamp?: number; // Add timestamp to detect stale broadcasts
  }) => {
    if (channelRef.current) {
      const payload = {
        ...update,
        timestamp: update.timestamp || Date.now(), // Add timestamp if not provided
      };
      await channelRef.current.send({
        type: "broadcast",
        event: "score_update",
        payload,
      });
      console.log("📡 Broadcast sent to other tabs:", payload);
    }
  };

  return {
    gameState,
    recentEvents,
    boxScore,
    connectionStatus,
    isConnected: connectionStatus === "connected",
    broadcastScoreUpdate,
  };
}
