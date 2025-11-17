'use client'

import { useDroppable } from '@dnd-kit/core'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { cn } from '@/lib/utils'
import { Player } from '@/lib/stores/players-store'

interface CourtSlotProps {
  slotId: string
  player: Player | undefined
  playingTime: number
  formatTime: (seconds: number) => string
}

export default function CourtSlot({
  slotId,
  player,
  playingTime,
  formatTime,
}: CourtSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
  })

  const slotNumber = slotId.split('-')[2]

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col items-center gap-1 p-2 rounded-lg border-2 border-dashed transition-all duration-200 cursor-grab active:cursor-grabbing',
        isOver
          ? 'bg-green-100 dark:bg-green-950/30 border-green-400 scale-105 shadow-md'
          : player
            ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700 hover:shadow-sm'
            : 'bg-slate-100 dark:bg-slate-950/20 border-slate-300 dark:border-slate-600'
      )}
    >
      {player ? (
        <>
          <div className="relative">
            <PlayerAvatar
              firstName={player.name.split(' ')[0]}
              lastName={player.name.split(' ')[1] || ''}
              src={player.avatar}
              jerseyNumber={player.number}
              className="h-8 w-8 rounded-full"
            />
            <div className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[7px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
              {slotNumber}
            </div>
          </div>
          <div className="text-center min-w-0">
            <div className="text-[10px] font-bold leading-tight">#{player.number}</div>
            <div className="text-[7px] text-muted-foreground font-medium truncate max-w-[50px]">{player.name.split(' ')[0]}</div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400">
            {slotNumber}
          </div>
        </div>
      )}
    </div>
  )
}
