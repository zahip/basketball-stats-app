"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!gameId || !supabase) {
      // If no Supabase client, just set disconnected status
      setConnectionStatus("disconnected");
      return;
    }

    console.log(`📡 Setting up Supabase Realtime for game: ${gameId}`);

    // Subscribe to database changes on the games table for this specific game
    const gameChannel = supabase
      .channel(`game_${gameId}_db_changes`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          console.log("🔥 Game database update received:", payload);
          // Payload.new contains the updated row
          const updatedGame = payload.new as any;

          console.log("🔥 updatedGame", updatedGame);

          // Update game state with new data
          if (updatedGame) {
            setGameState({
              id: updatedGame.id,
              homeTeam: updatedGame.teamId, // You may need to adjust based on your schema
              awayTeam: updatedGame.opponent,
              homeScore: updatedGame.ourScore,
              awayScore: updatedGame.oppScore,
              period: updatedGame.period,
              clock: formatClockFromSeconds(updatedGame.clockSec),
              status: mapDatabaseStatusToLocal(updatedGame.status),
            });
          }
        }
      )
      .subscribe((status) => {
        console.log("Game realtime subscription status:", status);
        setConnectionStatus(
          status === "SUBSCRIBED" ? "connected" : "connecting"
        );
      });

    // Subscribe to game events (you can keep this for event tracking)
    const eventsChannel = supabase
      .channel(`game_${gameId}_events`)
      .on("broadcast", { event: "game_event" }, (payload) => {
        console.log("Game event:", payload);
        if (payload.payload) {
          setRecentEvents((prev) => [payload.payload, ...prev.slice(0, 9)]); // Keep last 10 events
        }
      })
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
      eventsChannel.unsubscribe();
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

  return {
    gameState,
    recentEvents,
    boxScore,
    connectionStatus,
    isConnected: connectionStatus === "connected",
  };
}
