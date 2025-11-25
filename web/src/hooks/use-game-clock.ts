"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gamesApi } from "@/lib/api-client";

interface UseGameClockProps {
  gameId: string;
  initialClockSec: number;
  initialPeriod: number;
  status: "scheduled" | "active" | "paused" | "completed";
  courtPlayers: string[]; // Array of player IDs currently on court
}

interface UseGameClockReturn {
  clockSec: number;
  playingTime: Record<string, number>; // playerId -> seconds played
  isRunning: boolean;
  resetClock: (newClockSec: number) => void;
}

const SYNC_INTERVAL_MS = 15000; // Sync to backend every 15 seconds

/**
 * Custom hook to manage game clock and player playing time tracking
 *
 * Features:
 * - Runs 1-second interval when status === 'active'
 * - Decrements clock each second
 * - Increments playing time for all courtPlayers each second
 * - Syncs to backend every 15 seconds
 * - Stops at 0 seconds (period end)
 */
export function useGameClock({
  gameId,
  initialClockSec,
  initialPeriod,
  status,
  courtPlayers,
}: UseGameClockProps): UseGameClockReturn {
  const [clockSec, setClockSec] = useState(initialClockSec);
  const [playingTime, setPlayingTime] = useState<Record<string, number>>({});
  const [isRunning, setIsRunning] = useState(status === "active");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<number>(Date.now());
  const periodRef = useRef(initialPeriod);

  // Update isRunning when status changes
  useEffect(() => {
    setIsRunning(status === "active");
  }, [status]);

  // Update clock when initial value changes (e.g., period change, external update)
  useEffect(() => {
    setClockSec(initialClockSec);
  }, [initialClockSec]);

  // Update period ref when it changes
  useEffect(() => {
    periodRef.current = initialPeriod;
  }, [initialPeriod]);

  // Sync clock to backend
  const syncClockToBackend = useCallback(
    async (currentClockSec: number) => {
      try {
        await gamesApi.update(gameId, {
          clockSec: currentClockSec,
        });
        lastSyncRef.current = Date.now();
        console.log(`⏱️ Synced clock to backend: ${currentClockSec}s`);
      } catch (error) {
        console.error("Failed to sync clock to backend:", error);
      }
    },
    [gameId]
  );

  // Reset clock (used for period changes)
  const resetClock = useCallback((newClockSec: number) => {
    setClockSec(newClockSec);
    lastSyncRef.current = Date.now(); // Reset sync timer
  }, []);

  // Main clock interval effect
  useEffect(() => {
    if (!isRunning) {
      // Clear interval if not running
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start 1-second interval
    intervalRef.current = setInterval(() => {
      setClockSec((prevClock) => {
        // Stop at 0 (period end)
        if (prevClock <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsRunning(false);
          return 0;
        }

        const newClock = prevClock - 1;

        // Increment playing time for all court players
        setPlayingTime((prevTime) => {
          const updatedTime = { ...prevTime };
          courtPlayers.forEach((playerId) => {
            updatedTime[playerId] = (updatedTime[playerId] || 0) + 1;
          });
          return updatedTime;
        });

        // Check if we need to sync to backend
        const timeSinceLastSync = Date.now() - lastSyncRef.current;
        if (timeSinceLastSync >= SYNC_INTERVAL_MS) {
          syncClockToBackend(newClock);
        }

        return newClock;
      });
    }, 1000);

    // Cleanup on unmount or when isRunning changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, courtPlayers, syncClockToBackend]);

  return {
    clockSec,
    playingTime,
    isRunning,
    resetClock,
  };
}
