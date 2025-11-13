'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TeamSelectorProps {
  selectedTeam: 'home' | 'away';
  onTeamSelect: (team: 'home' | 'away') => void;
  homeTeamName?: string;
  awayTeamName?: string;
}

export function TeamSelector({
  selectedTeam,
  onTeamSelect,
  homeTeamName = 'Your Team',
  awayTeamName = 'Opponent',
}: TeamSelectorProps) {
  return (
    <Card className="mb-4">
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground mb-2 font-medium">
          Recording for:
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={selectedTeam === 'home' ? 'default' : 'outline'}
            className={cn(
              'h-16 flex-col justify-center items-center',
              selectedTeam === 'home' && 'ring-2 ring-primary'
            )}
            onClick={() => onTeamSelect('home')}
          >
            <div className="text-sm font-semibold">🏀 {homeTeamName}</div>
            {selectedTeam === 'home' && (
              <div className="text-xs mt-1 opacity-75">Recording now</div>
            )}
          </Button>

          <Button
            variant={selectedTeam === 'away' ? 'default' : 'outline'}
            className={cn(
              'h-16 flex-col justify-center items-center',
              selectedTeam === 'away' && 'ring-2 ring-primary'
            )}
            onClick={() => onTeamSelect('away')}
          >
            <div className="text-sm font-semibold">👥 {awayTeamName}</div>
            {selectedTeam === 'away' && (
              <div className="text-xs mt-1 opacity-75">Recording now</div>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
