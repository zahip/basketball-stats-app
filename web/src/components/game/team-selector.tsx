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
    <Card className="mb-2 border-2 border-primary/20">
      <CardContent className="p-3">
        <div className="text-[11px] text-muted-foreground mb-2 font-semibold uppercase tracking-wide">
          📍 Recording for:
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={selectedTeam === 'home' ? 'default' : 'outline'}
            className={cn(
              'h-14 flex-col justify-center items-center py-2 font-bold transition-all duration-200',
              selectedTeam === 'home' && 'ring-2 ring-offset-1 ring-primary shadow-lg scale-105'
            )}
            onClick={() => onTeamSelect('home')}
          >
            <div className="text-sm font-bold leading-tight">🏀</div>
            <div className="text-xs font-bold leading-tight mt-1">{homeTeamName}</div>
            {selectedTeam === 'home' && (
              <div className="text-[8px] mt-1 opacity-90 font-semibold">● RECORDING</div>
            )}
          </Button>

          <Button
            variant={selectedTeam === 'away' ? 'default' : 'outline'}
            className={cn(
              'h-14 flex-col justify-center items-center py-2 font-bold transition-all duration-200',
              selectedTeam === 'away' && 'ring-2 ring-offset-1 ring-primary shadow-lg scale-105'
            )}
            onClick={() => onTeamSelect('away')}
          >
            <div className="text-sm font-bold leading-tight">👥</div>
            <div className="text-xs font-bold leading-tight mt-1">{awayTeamName}</div>
            {selectedTeam === 'away' && (
              <div className="text-[8px] mt-1 opacity-90 font-semibold">● RECORDING</div>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
