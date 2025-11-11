'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePlayersStore } from '@/lib/stores/players-store';
import { ArrowRightLeft, ChevronDown, ChevronUp } from 'lucide-react';

interface SubstitutionsProps {
  gameId: string;
  onSubstitution: (eventType: 'sub_in' | 'sub_out', playerId: string) => void;
  disabled?: boolean;
}

export function Substitutions({ gameId, onSubstitution, disabled }: SubstitutionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [onCourtPlayers, setOnCourtPlayers] = useState<Set<string>>(new Set());
  const { getActivePlayers } = usePlayersStore();
  const players = getActivePlayers();

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`game-${gameId}-oncourt`);
    if (saved) {
      try {
        const playerIds = JSON.parse(saved);
        setOnCourtPlayers(new Set(playerIds));
      } catch (e) {
        console.error('Failed to load on-court players', e);
      }
    }
  }, [gameId]);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(
      `game-${gameId}-oncourt`,
      JSON.stringify(Array.from(onCourtPlayers))
    );
  }, [gameId, onCourtPlayers]);

  const handleSubIn = (playerId: string) => {
    if (onCourtPlayers.size >= 5) {
      alert('Maximum 5 players on court. Substitute out a player first.');
      return;
    }
    setOnCourtPlayers((prev) => new Set([...prev, playerId]));
    onSubstitution('sub_in', playerId);
  };

  const handleSubOut = (playerId: string) => {
    setOnCourtPlayers((prev) => {
      const next = new Set(prev);
      next.delete(playerId);
      return next;
    });
    onSubstitution('sub_out', playerId);
  };

  const onCourtPlayersList = players.filter((p) => onCourtPlayers.has(p.id));
  const benchPlayersList = players.filter((p) => !onCourtPlayers.has(p.id));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">
              <ArrowRightLeft className="inline w-4 h-4 mr-2" />
              Substitutions
            </CardTitle>
            <CardDescription>
              {onCourtPlayers.size}/5 players on court
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* On Court Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold">On Court</h4>
              <Badge variant="default" className="bg-green-600">
                {onCourtPlayers.size}
              </Badge>
            </div>
            <div className="space-y-2">
              {onCourtPlayersList.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-2">
                  No players on court
                </div>
              ) : (
                onCourtPlayersList.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between bg-green-50 dark:bg-green-950 p-2 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        #{player.number}
                      </Badge>
                      <span className="text-sm">{player.name}</span>
                    </div>
                    <Button
                      onClick={() => handleSubOut(player.id)}
                      variant="ghost"
                      size="sm"
                      disabled={disabled}
                      className="h-7 text-xs"
                    >
                      Sub Out
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bench Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold">Bench</h4>
              <Badge variant="secondary">{benchPlayersList.length}</Badge>
            </div>
            <div className="space-y-2">
              {benchPlayersList.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-2">
                  All players on court
                </div>
              ) : (
                benchPlayersList.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        #{player.number}
                      </Badge>
                      <span className="text-sm">{player.name}</span>
                    </div>
                    <Button
                      onClick={() => handleSubIn(player.id)}
                      variant="ghost"
                      size="sm"
                      disabled={disabled || onCourtPlayers.size >= 5}
                      className="h-7 text-xs"
                    >
                      Sub In
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {onCourtPlayers.size > 5 && (
            <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950 p-2 rounded">
              Warning: More than 5 players on court!
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
