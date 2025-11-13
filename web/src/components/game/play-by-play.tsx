'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface GameEvent {
  id: string;
  gameId: string;
  type: string;
  playerId: string | null;
  teamSide: string;
  period: number;
  clockSec: number;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

interface PlayByPlayProps {
  gameId: string;
}

export function PlayByPlay({ gameId }: PlayByPlayProps) {
  const { data: events, isLoading, error } = useQuery<{ events: GameEvent[] }>({
    queryKey: ['events', gameId],
    queryFn: async () => {
      const response = await apiClient(`/games/${gameId}/events`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      return response.json();
    },
    refetchInterval: 5000,
  });

  const formatClock = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEventDescription = (event: GameEvent): string => {
    const team = event.teamSide === 'US' ? '🏀 Your Team' : '👥 Opponent';
    const player = event.playerId ? ` #${event.playerId}` : '';
    const assist = event.meta?.assistedBy ? ` (Assist: #${event.meta.assistedBy})` : '';

    switch (event.type) {
      case 'SHOT_2_MADE':
        return `${team}${player} 2PT Made${assist}`;
      case 'SHOT_2_MISS':
        return `${team}${player} 2PT Miss`;
      case 'SHOT_3_MADE':
        return `${team}${player} 3PT Made${assist}`;
      case 'SHOT_3_MISS':
        return `${team}${player} 3PT Miss`;
      case 'FT_MADE':
        return `${team}${player} Free Throw${assist}`;
      case 'FT_MISS':
        return `${team}${player} Free Throw Miss`;
      case 'AST':
        return `${team}${player} Assist`;
      case 'REB_O':
        return `${team}${player} Offensive Rebound`;
      case 'REB_D':
        return `${team}${player} Defensive Rebound`;
      case 'STL':
        return `${team}${player} Steal`;
      case 'BLK':
        return `${team}${player} Block`;
      case 'TOV':
        return `${team}${player} Turnover`;
      case 'FOUL':
        return `${team}${player} Foul`;
      case 'SUB_IN':
        return `${team}${player} Substitution In`;
      case 'SUB_OUT':
        return `${team}${player} Substitution Out`;
      default:
        return `${team}${player} ${event.type}`;
    }
  };

  const getEventEmoji = (eventType: string): string => {
    if (eventType.includes('MADE')) return '✓';
    if (eventType.includes('MISS')) return '✗';
    if (eventType.includes('AST')) return '🎯';
    if (eventType.includes('REB_O')) return '↗️';
    if (eventType.includes('REB_D')) return '↘️';
    if (eventType.includes('STL')) return '🔥';
    if (eventType.includes('BLK')) return '🚫';
    if (eventType.includes('TOV')) return '⚠️';
    if (eventType.includes('FOUL')) return '🟨';
    if (eventType.includes('SUB')) return '↔️';
    return '•';
  };

  const getScorePoints = (eventType: string): number => {
    if (eventType === 'SHOT_2_MADE' || eventType === 'SHOT_2_MISS') return 0; // Miss doesn't count
    if (eventType === 'SHOT_2_MADE') return 2;
    if (eventType === 'SHOT_3_MADE') return 3;
    if (eventType === 'FT_MADE') return 1;
    return 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error || !events || !events.events) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        No events recorded yet. Start tracking to see play-by-play!
      </div>
    );
  }

  // Sort events by period (desc) then clock (desc) - most recent first
  const sortedEvents = [...events.events].sort((a, b) => {
    if (a.period !== b.period) return b.period - a.period;
    return b.clockSec - a.clockSec;
  });

  // Calculate running score as we go through events
  let ourScore = 0;
  let oppScore = 0;

  // Find final scores
  sortedEvents.forEach((event) => {
    if (event.type.includes('MADE')) {
      const points = event.type === 'SHOT_2_MADE' ? 2 : event.type === 'SHOT_3_MADE' ? 3 : 1;
      if (event.teamSide === 'US') {
        ourScore += points;
      } else {
        oppScore += points;
      }
    }
  });

  return (
    <ScrollArea className="h-[500px] pr-4">
      {sortedEvents.length === 0 ? (
        <div className="text-center text-muted-foreground py-8 text-sm">
          No events recorded yet
        </div>
      ) : (
        <div className="space-y-3">
          {sortedEvents.map((event, index) => {
            const emoji = getEventEmoji(event.type);
            const description = getEventDescription(event);
            const isOurTeam = event.teamSide === 'US';

            return (
              <div
                key={event.id}
                className={`flex gap-3 p-2.5 rounded-lg border transition-colors ${
                  isOurTeam
                    ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40'
                    : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }`}
              >
                {/* Time */}
                <div className="flex flex-col items-center gap-1 min-w-fit">
                  <span className="text-xs font-bold font-mono text-muted-foreground">
                    {formatClock(event.clockSec)}
                  </span>
                  <span className="text-lg">{emoji}</span>
                </div>

                {/* Event Description */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug">
                    {description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Q{event.period}
                  </p>
                </div>

                {/* Score */}
                <div className="flex flex-col items-end gap-1 min-w-fit">
                  <Badge
                    variant={isOurTeam ? 'default' : 'secondary'}
                    className="text-xs font-bold px-2 py-0.5"
                  >
                    {isOurTeam ? ourScore : oppScore}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ScrollArea>
  );
}
