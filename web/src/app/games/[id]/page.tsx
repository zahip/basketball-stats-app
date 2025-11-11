'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gamesApi, type Game as GameType } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function GameDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const gameId = params.id as string;

  // Fetch game details
  const { data: gameResponse, isLoading, error } = useQuery({
    queryKey: ['game', gameId],
    queryFn: () => gamesApi.getById(gameId),
  });

  const game = gameResponse?.game;

  // Start game mutation
  const startGameMutation = useMutation({
    mutationFn: () => gamesApi.update(gameId, { status: 'LIVE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] });
      toast({
        title: 'Game Started',
        description: 'The game is now live. Redirecting to live tracking...',
      });
      router.push(`/games/${gameId}/live`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start game',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : 'Failed to load game details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/games">
              <Button variant="outline">Back to Games</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatClock = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'secondary' | 'default' | 'outline'> = {
      PLANNED: 'secondary',
      LIVE: 'default',
      FINAL: 'outline',
    };
    return (
      <Badge variant={variants[status] || 'secondary'} className={status === 'LIVE' ? 'bg-green-600' : ''}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/games">
          <Button variant="ghost" className="mb-4">
            ← Back to Games
          </Button>
        </Link>
      </div>

      {/* Game Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Game Details</CardTitle>
            {getStatusBadge(game.status)}
          </div>
          <CardDescription>{formatDate(game.date)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Score Display */}
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6">
              <div className="grid grid-cols-3 gap-4 items-center text-center">
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    {game.team?.name || 'Us'}
                  </div>
                  <div className="text-4xl font-bold">{game.ourScore}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Period {game.period}
                  </div>
                  <div className="text-xl font-semibold">{formatClock(game.clockSec)}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    {game.opponent}
                  </div>
                  <div className="text-4xl font-bold">{game.oppScore}</div>
                </div>
              </div>
            </div>

            {/* Game Info */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Opponent</div>
                <div className="font-semibold">{game.opponent}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Venue</div>
                <div className="font-semibold">{game.venue || 'Not specified'}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Status</div>
                <div className="font-semibold">{game.status}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Game ID</div>
                <div className="font-mono text-xs">{game.id}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        {game.status === 'PLANNED' && (
          <Button
            onClick={() => startGameMutation.mutate()}
            disabled={startGameMutation.isPending}
            size="lg"
            className="flex-1"
          >
            {startGameMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Game
              </>
            )}
          </Button>
        )}

        {game.status === 'LIVE' && (
          <Link href={`/games/${gameId}/live`} className="flex-1">
            <Button size="lg" className="w-full">
              <Play className="w-4 h-4 mr-2" />
              Go to Live Tracking
            </Button>
          </Link>
        )}

        {game.status === 'FINAL' && (
          <Link href={`/games/${gameId}/live`} className="flex-1">
            <Button size="lg" variant="outline" className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              View Final Stats
            </Button>
          </Link>
        )}
      </div>

      {/* Box Score Preview (if game has started) */}
      {(game.status === 'LIVE' || game.status === 'FINAL') && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>
              {game.status === 'LIVE' ? 'Live game statistics' : 'Final game statistics'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-slate-600 dark:text-slate-400 py-4">
              <p className="mb-2">
                View detailed box scores, play-by-play, and analytics in the live tracking page.
              </p>
              <Link href={`/games/${gameId}/live`}>
                <Button variant="link">
                  Go to {game.status === 'LIVE' ? 'Live' : 'Final'} Stats →
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
