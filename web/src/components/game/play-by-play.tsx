'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

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
    refetchInterval: 5000, // Refetch every 5 seconds during live game
  });

  const formatClock = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatEventType = (eventType: string) => {
    return eventType
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getEventIcon = (eventType: string | null | undefined) => {
    if (!eventType) return '•';
    if (eventType.includes('MADE')) return '✓';
    if (eventType.includes('MISS')) return '✗';
    if (eventType.includes('AST')) return '🎯';
    if (eventType.includes('REB')) return '🏀';
    if (eventType.includes('STL')) return '🔒';
    if (eventType.includes('BLK')) return '🛑';
    if (eventType.includes('TOV')) return '⚠️';
    if (eventType.includes('FOUL')) return '🟨';
    if (eventType.includes('SUB')) return '↔️';
    return '•';
  };

  const getEventColor = (eventType: string | null | undefined, teamSide: string) => {
    if (!eventType) return 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700';

    const isOurTeam = teamSide === 'US';

    if (eventType.includes('MADE')) {
      return isOurTeam
        ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
        : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
    }
    if (eventType.includes('MISS')) {
      return 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700';
    }
    if (eventType.includes('AST') || eventType.includes('REB') || eventType.includes('STL') || eventType.includes('BLK')) {
      return isOurTeam
        ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700';
    }
    if (eventType.includes('TOV') || eventType.includes('FOUL')) {
      return isOurTeam
        ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700';
    }
    return 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Play-by-Play</CardTitle>
          <CardDescription>Loading events...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error || !events || !events.events) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Play-by-Play</CardTitle>
          <CardDescription>No events recorded</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Failed to load play-by-play. Start recording events to see the feed.
        </CardContent>
      </Card>
    );
  }

  // Sort events by period (desc) then clock (asc) - most recent first
  const sortedEvents = [...events.events].sort((a, b) => {
    if (a.period !== b.period) return b.period - a.period;
    return b.clockSec - a.clockSec;
  });

  // Group events by period
  const eventsByPeriod = sortedEvents.reduce((acc, event) => {
    const period = `Period ${event.period}`;
    if (!acc[period]) acc[period] = [];
    acc[period].push(event);
    return acc;
  }, {} as Record<string, GameEvent[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Play-by-Play</CardTitle>
        <CardDescription>
          {events.events.length} events recorded
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {sortedEvents.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No events recorded yet. Start tracking to see play-by-play!
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(eventsByPeriod).map(([period, periodEvents]) => (
                <div key={period}>
                  <div className="sticky top-0 bg-background z-10 pb-2">
                    <h3 className="font-semibold text-sm text-muted-foreground">{period}</h3>
                  </div>
                  <div className="space-y-2">
                    {periodEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${getEventColor(
                          event.type,
                          event.teamSide
                        )}`}
                      >
                        <div className="text-lg">{getEventIcon(event.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2 mb-1">
                            <span className="font-semibold text-sm">
                              {formatEventType(event.type)}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                              {formatClock(event.clockSec)}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {event.teamSide === 'US' ? 'Your Team' : 'Opponent'}
                            {event.playerId && ` • Player ${event.playerId}`}
                          </div>
                          {event.meta && Object.keys(event.meta).length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {JSON.stringify(event.meta)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
