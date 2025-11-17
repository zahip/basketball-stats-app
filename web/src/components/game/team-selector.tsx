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
    <Card className="border-l-4 border-l-primary shadow-sm flex-shrink-0">
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground mb-2.5 font-medium">
          Recording Stats For
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <Button
            variant={selectedTeam === 'home' ? 'default' : 'outline'}
            className={cn(
              'h-16 flex-col justify-center items-center py-2 transition-all duration-200 font-semibold',
              selectedTeam === 'home' && 'ring-2 ring-primary ring-offset-2 shadow-md'
            )}
            onClick={() => onTeamSelect('home')}
          >
            <div className="text-xl leading-none">🏀</div>
            <div className="text-sm leading-tight mt-1 text-center truncate">{homeTeamName}</div>
            {selectedTeam === 'home' && (
              <div className="text-[9px] mt-1 opacity-75 font-semibold">● ACTIVE</div>
            )}
          </Button>

          <Button
            variant={selectedTeam === 'away' ? 'default' : 'outline'}
            className={cn(
              'h-16 flex-col justify-center items-center py-2 transition-all duration-200 font-semibold',
              selectedTeam === 'away' && 'ring-2 ring-primary ring-offset-2 shadow-md'
            )}
            onClick={() => onTeamSelect('away')}
          >
            <div className="text-xl leading-none">👥</div>
            <div className="text-sm leading-tight mt-1 text-center truncate">{awayTeamName}</div>
            {selectedTeam === 'away' && (
              <div className="text-[9px] mt-1 opacity-75 font-semibold">● ACTIVE</div>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
