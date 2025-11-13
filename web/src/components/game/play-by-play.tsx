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
  const { data: events, isLoading, error, refetch } = useQuery<{ events: GameEvent[] }>({
    queryKey: ['events', gameId],
    queryFn: async () => {
      const response = await apiClient(`/games/${gameId}/events`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      return response.json();
    },
    refetchInterval: 1000,
    staleTime: 0,
  });

  const formatClock = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEventDescription = (event: GameEvent): string => {
    const team = event.teamSide === 'US' ? '🏀 Your Team' : '👥 Opponent';
    const player = event.playerId ? ` #${event.playerId}` : '';
    const assist = event.meta?.assistedBy ? ` (Assist by #${event.meta.assistedBy})` : '';

    switch (event.type) {
      case 'SHOT_2_MADE':
        return `${team}${player} made 2-pointer${assist}`;
      case 'SHOT_2_MISS':
        return `${team}${player} missed 2-pointer`;
      case 'SHOT_3_MADE':
        return `${team}${player} made 3-pointer${assist}`;
      case 'SHOT_3_MISS':
        return `${team}${player} missed 3-pointer`;
      case 'FT_MADE':
        return `${team}${player} made free throw${assist}`;
      case 'FT_MISS':
        return `${team}${player} missed free throw`;
      case 'AST':
        return `${team}${player} assist`;
      case 'REB_O':
        return `${team}${player} offensive rebound`;
      case 'REB_D':
        return `${team}${player} defensive rebound`;
      case 'STL':
        return `${team}${player} steal`;
      case 'BLK':
        return `${team}${player} block`;
      case 'TOV':
        return `${team}${player} turnover`;
      case 'FOUL':
        return `${team}${player} foul`;
      case 'SUB_IN':
        return `${team}${player} substituted in`;
      case 'SUB_OUT':
        return `${team}${player} substituted out`;
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
    <div className="space-y-4">
      {sortedEvents.length === 0 ? (
        <div className="text-center text-muted-foreground py-12 text-sm">
          No events recorded yet
        </div>
      ) : (
        <ScrollArea className="h-[calc(90vh-200px)] pr-4">
          <div className="space-y-2">
          {sortedEvents.map((event, index) => {
            const emoji = getEventEmoji(event.type);
            const description = getEventDescription(event);
            const isOurTeam = event.teamSide === 'US';
            const isScoring = event.type.includes('MADE');
            const isAssist = event.type === 'AST';

            return (
              <div
                key={event.id}
                className={`flex gap-3 p-3 rounded-lg border-l-4 transition-colors ${
                  isOurTeam
                    ? 'bg-green-50 dark:bg-green-950/40 border-l-green-600 hover:bg-green-100 dark:hover:bg-green-900/50'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-l-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                } ${isScoring ? 'ring-1 ring-yellow-400/30' : ''}`}
              >
                {/* Left Column: Time & Emoji */}
                <div className="flex flex-col items-center gap-1.5 min-w-fit">
                  <span className="text-xs font-bold font-mono text-muted-foreground">
                    {formatClock(event.clockSec)}
                  </span>
                  <span className="text-xl">{emoji}</span>
                </div>

                {/* Middle Column: Event Description & Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">
                    {description}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span className="font-mono">Q{event.period}</span>
                    {isAssist && (event.meta as any)?.assistFor && (
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-200 rounded-sm font-semibold">
                        Assist for Shot
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Column: Score Badge */}
                <div className="flex flex-col items-end gap-1 min-w-fit">
                  <Badge
                    variant={isOurTeam ? 'default' : 'secondary'}
                    className={`text-xs font-bold px-2.5 py-0.5 ${isScoring ? 'text-base' : ''}`}
                  >
                    {isOurTeam ? ourScore : oppScore}
                  </Badge>
                  {isScoring && (
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {event.type === 'SHOT_2_MADE' ? '+2' : event.type === 'SHOT_3_MADE' ? '+3' : '+1'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
