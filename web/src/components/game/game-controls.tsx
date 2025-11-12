'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { gamesApi } from '@/lib/api-client';
import { Play, Pause, SkipForward, RotateCcw, Flag } from 'lucide-react';

interface GameControlsProps {
  gameId: string;
  currentPeriod: number;
  currentClock: number; // in seconds
  status: 'scheduled' | 'active' | 'paused' | 'completed';
}

interface SavedGameState {
  period: number;
  clockSeconds: number;
  isRunning: boolean;
}

export function GameControls({ gameId, currentPeriod, currentClock, status }: GameControlsProps) {
  const [clockSeconds, setClockSeconds] = useState(currentClock);
  const [period, setPeriod] = useState(currentPeriod);
  const [isRunning, setIsRunning] = useState(status === 'active');
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load persisted state from localStorage on mount
  useEffect(() => {
    try {
      const storageKey = `game_controls_${gameId}`;
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        const parsed: SavedGameState = JSON.parse(savedState);
        setClockSeconds(parsed.clockSeconds);
        setPeriod(parsed.period);
        setIsRunning(parsed.isRunning);
        console.log('✅ Restored game state from localStorage:', parsed);
      }
    } catch (error) {
      console.error('Failed to restore game state from localStorage:', error);
    }
    setIsInitialized(true);
  }, [gameId]);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    if (!isInitialized) return; // Skip first render

    try {
      const storageKey = `game_controls_${gameId}`;
      const stateToSave: SavedGameState = {
        period,
        clockSeconds,
        isRunning,
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
      console.log('💾 Saved game state to localStorage:', stateToSave);
    } catch (error) {
      console.error('Failed to save game state to localStorage:', error);
    }
  }, [gameId, period, clockSeconds, isRunning, isInitialized]);

  // Sync with props when they change (from real-time updates)
  // Only update if the values are significantly different (not from our own saves)
  useEffect(() => {
    if (!isInitialized) return;

    // Only update from API if period/clock are different from our local state
    // This prevents overwriting user's manual time adjustments
    if (currentPeriod !== period || currentClock !== clockSeconds) {
      setClockSeconds(currentClock);
      setPeriod(currentPeriod);
    }
    setIsRunning(status === 'active');
  }, [status, isInitialized]);

  // Clock countdown effect
  useEffect(() => {
    if (!isRunning || clockSeconds <= 0) return;

    const interval = setInterval(() => {
      setClockSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          toast({
            title: 'Period Ended',
            description: `Period ${period} has ended`,
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, clockSeconds, period, toast]);

  const updateGameMutation = useMutation({
    mutationFn: (data: {
      period?: number;
      clockSec?: number;
      status?: 'PLANNED' | 'LIVE' | 'FINAL';
    }) => gamesApi.update(gameId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update game',
        variant: 'destructive',
      });
    },
  });

  const formatClock = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    const newStatus = isRunning ? 'PLANNED' : 'LIVE';
    setIsRunning(!isRunning);
    updateGameMutation.mutate({
      status: newStatus,
      clockSec: clockSeconds,
      period: period,
    });
  };

  const handleNextPeriod = () => {
    const newPeriod = period + 1;
    setPeriod(newPeriod);
    setClockSeconds(600); // Reset to 10 minutes
    setIsRunning(false);
    updateGameMutation.mutate({
      period: newPeriod,
      clockSec: 600,
      status: 'PLANNED', // Pause between periods
    });
    toast({
      title: 'Period Advanced',
      description: `Now in Period ${newPeriod}`,
    });
  };

  const handleResetClock = () => {
    setClockSeconds(600); // Reset to 10 minutes
    setIsRunning(false);
    updateGameMutation.mutate({
      clockSec: 600,
      period: period,
      status: 'PLANNED',
    });
    toast({
      title: 'Clock Reset',
      description: 'Clock reset to 10:00',
    });
  };

  const handleSetTime = (minutes: number) => {
    const newSeconds = minutes * 60;
    setClockSeconds(newSeconds);
    updateGameMutation.mutate({
      clockSec: newSeconds,
      period: period,
    });
  };

  const handleEndGame = () => {
    setIsRunning(false);
    updateGameMutation.mutate({
      status: 'FINAL',
      clockSec: clockSeconds,
      period: period,
    });
    toast({
      title: 'Game Ended',
      description: 'Game status set to FINAL',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Game Controls</CardTitle>
        <CardDescription>Manage period, clock, and game status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Clock Display */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-lg p-6 text-center">
          <div className="text-sm mb-1 opacity-75">Period {period}</div>
          <div className="text-5xl font-bold font-mono tracking-wider">
            {formatClock(clockSeconds)}
          </div>
          <div className="mt-2">
            <span
              className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
                isRunning
                  ? 'bg-green-600'
                  : clockSeconds === 0
                  ? 'bg-red-600'
                  : 'bg-yellow-600'
              }`}
            >
              {isRunning ? 'RUNNING' : clockSeconds === 0 ? 'ENDED' : 'PAUSED'}
            </span>
          </div>
        </div>

        {/* Primary Controls */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleStartPause}
            size="lg"
            variant={isRunning ? 'destructive' : 'default'}
            disabled={status === 'completed'}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start
              </>
            )}
          </Button>
          <Button
            onClick={handleNextPeriod}
            size="lg"
            variant="outline"
            disabled={status === 'completed'}
          >
            <SkipForward className="w-4 h-4 mr-2" />
            Next Period
          </Button>
        </div>

        {/* Quick Time Sets */}
        <div>
          <Label className="text-sm mb-2 block">Quick Set Time</Label>
          <div className="grid grid-cols-4 gap-2">
            <Button
              onClick={() => handleSetTime(10)}
              size="sm"
              variant="outline"
              disabled={status === 'completed'}
            >
              10:00
            </Button>
            <Button
              onClick={() => handleSetTime(5)}
              size="sm"
              variant="outline"
              disabled={status === 'completed'}
            >
              5:00
            </Button>
            <Button
              onClick={() => handleSetTime(2)}
              size="sm"
              variant="outline"
              disabled={status === 'completed'}
            >
              2:00
            </Button>
            <Button
              onClick={() => handleSetTime(1)}
              size="sm"
              variant="outline"
              disabled={status === 'completed'}
            >
              1:00
            </Button>
          </div>
        </div>

        {/* Secondary Controls */}
        <div className="flex gap-2">
          <Button
            onClick={handleResetClock}
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={status === 'completed'}
          >
            <RotateCcw className="w-3 h-3 mr-2" />
            Reset Clock
          </Button>
          <Button
            onClick={handleEndGame}
            variant="destructive"
            size="sm"
            className="flex-1"
            disabled={status === 'completed'}
          >
            <Flag className="w-3 h-3 mr-2" />
            End Game
          </Button>
        </div>

        {status === 'completed' && (
          <div className="bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-100 rounded p-3 text-sm text-center">
            Game is finished. Controls are disabled.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
