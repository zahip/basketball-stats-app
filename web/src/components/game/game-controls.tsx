'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { gamesApi } from '@/lib/api-client';
import { Play, Pause, SkipForward, RotateCcw, Flag, Settings } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface GameControlsProps {
  gameId: string;
  currentPeriod: number;
  currentClock: number; // in seconds
  status: 'scheduled' | 'active' | 'paused' | 'completed';
  homeScore?: number;
  awayScore?: number;
  homeTeamName?: string;
  awayTeamName?: string;
}

interface SavedGameState {
  period: number;
  clockSeconds: number;
  isRunning: boolean;
}

// Advanced Controls Component (used in both Sheet and Dialog)
function AdvancedControlsContent({
  clockSeconds,
  period,
  isRunning,
  status,
  onSetTime,
  onResetClock,
  onNextPeriod,
  onEndGame,
}: {
  clockSeconds: number;
  period: number;
  isRunning: boolean;
  status: string;
  onSetTime: (minutes: number) => void;
  onResetClock: () => void;
  onNextPeriod: () => void;
  onEndGame: () => void;
}) {
  const formatClock = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 text-center">
        <div className="text-sm text-muted-foreground mb-1">Period {period}</div>
        <div className="text-4xl font-bold font-mono tracking-wider">
          {formatClock(clockSeconds)}
        </div>
        <div className="mt-2">
          <Badge
            variant={
              isRunning
                ? 'default'
                : clockSeconds === 0
                ? 'destructive'
                : 'secondary'
            }
          >
            {isRunning ? 'RUNNING' : clockSeconds === 0 ? 'ENDED' : 'PAUSED'}
          </Badge>
        </div>
      </div>

      {/* Quick Time Sets */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Quick Set Time</h4>
        <div className="grid grid-cols-4 gap-2">
          <Button
            onClick={() => onSetTime(10)}
            size="sm"
            variant="outline"
            disabled={status === 'completed'}
          >
            10:00
          </Button>
          <Button
            onClick={() => onSetTime(5)}
            size="sm"
            variant="outline"
            disabled={status === 'completed'}
          >
            5:00
          </Button>
          <Button
            onClick={() => onSetTime(2)}
            size="sm"
            variant="outline"
            disabled={status === 'completed'}
          >
            2:00
          </Button>
          <Button
            onClick={() => onSetTime(1)}
            size="sm"
            variant="outline"
            disabled={status === 'completed'}
          >
            1:00
          </Button>
        </div>
      </div>

      {/* Period Controls */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Period Controls</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={onNextPeriod}
            variant="outline"
            disabled={status === 'completed'}
            className="w-full"
          >
            <SkipForward className="w-4 h-4 mr-2" />
            Next Period
          </Button>
          <Button
            onClick={onResetClock}
            variant="outline"
            disabled={status === 'completed'}
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Clock
          </Button>
        </div>
      </div>

      {/* End Game */}
      <div>
        <h4 className="text-sm font-semibold mb-3 text-destructive">Danger Zone</h4>
        <Button
          onClick={onEndGame}
          variant="destructive"
          disabled={status === 'completed'}
          className="w-full"
        >
          <Flag className="w-4 h-4 mr-2" />
          End Game
        </Button>
      </div>

      {status === 'completed' && (
        <div className="bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 rounded-lg p-3 text-sm text-center">
          Game is finished. Controls are disabled.
        </div>
      )}
    </div>
  );
}

export function GameControls({
  gameId,
  currentPeriod,
  currentClock,
  status,
  homeScore = 0,
  awayScore = 0,
  homeTeamName,
  awayTeamName,
}: GameControlsProps) {
  const [clockSeconds, setClockSeconds] = useState(currentClock);
  const [period, setPeriod] = useState(currentPeriod);
  const [isRunning, setIsRunning] = useState(status === 'active');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
  useEffect(() => {
    if (!isInitialized) return;

    // Only update from API if period/clock are different from our local state
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
    setIsSheetOpen(false);
    setIsDialogOpen(false);
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
    setIsSheetOpen(false);
    setIsDialogOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Compact Clock Display - Always Visible */}
      <div className="flex items-center gap-2">
        <div className="bg-slate-900 dark:bg-slate-950 text-white rounded px-2 py-1.5">
          <div className="text-[10px] opacity-75 leading-none mb-0.5">P{period}</div>
          <div className="text-lg font-bold font-mono tracking-tight leading-none">
            {formatClock(clockSeconds)}
          </div>
        </div>
        <Badge
          variant={
            isRunning
              ? 'success'
              : clockSeconds === 0
              ? 'destructive'
              : 'secondary'
          }
          className="hidden sm:inline-flex text-xs"
        >
          {isRunning ? '● LIVE' : clockSeconds === 0 ? 'ENDED' : 'PAUSED'}
        </Badge>
      </div>

      {/* Primary Action - Start/Pause */}
      <Button
        onClick={handleStartPause}
        size="sm"
        variant={isRunning ? 'destructive' : 'default'}
        disabled={status === 'completed'}
        className="h-8 px-2 text-xs font-semibold gap-1"
      >
        {isRunning ? (
          <>
            <Pause className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pause</span>
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Start</span>
          </>
        )}
      </Button>

      {/* Mobile: Sheet (Drawer from bottom) */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 lg:hidden"
            disabled={status === 'completed'}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Game Controls</SheetTitle>
            <SheetDescription>
              Manage period, clock, and game settings
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <AdvancedControlsContent
              clockSeconds={clockSeconds}
              period={period}
              isRunning={isRunning}
              status={status}
              onSetTime={handleSetTime}
              onResetClock={handleResetClock}
              onNextPeriod={handleNextPeriod}
              onEndGame={handleEndGame}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop: Dialog (Modal) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 hidden lg:flex gap-1 text-xs font-semibold"
            disabled={status === 'completed'}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>More</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Game Controls</DialogTitle>
            <DialogDescription>
              Manage period, clock, and game settings
            </DialogDescription>
          </DialogHeader>
          <AdvancedControlsContent
            clockSeconds={clockSeconds}
            period={period}
            isRunning={isRunning}
            status={status}
            onSetTime={handleSetTime}
            onResetClock={handleResetClock}
            onNextPeriod={handleNextPeriod}
            onEndGame={handleEndGame}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
