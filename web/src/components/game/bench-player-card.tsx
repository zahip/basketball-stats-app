'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { cn } from '@/lib/utils'
import { Player } from '@/lib/stores/players-store'

interface BenchPlayerCardProps {
  player: Player
  playingTime: number
  formatTime: (seconds: number) => string
}

export default function BenchPlayerCard({
  player,
  playingTime,
  formatTime,
}: BenchPlayerCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: player.id,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex flex-col items-center gap-1 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all duration-200 cursor-grab active:cursor-grabbing hover:shadow-sm',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-primary'
      )}
      {...attributes}
      {...listeners}
    >
      <PlayerAvatar
        firstName={player.name.split(' ')[0]}
        lastName={player.name.split(' ')[1] || ''}
        src={player.avatar}
        jerseyNumber={player.number}
        className="h-7 w-7 rounded-full"
      />
      <div className="text-center min-w-0">
        <div className="text-[10px] font-bold leading-tight">#{player.number}</div>
        <div className="text-[7px] text-muted-foreground font-medium truncate max-w-[50px]">{player.name.split(' ')[0]}</div>
      </div>
    </div>
  )
}
