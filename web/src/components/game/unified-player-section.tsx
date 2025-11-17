'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCenter,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { MouseSensor, TouchSensor } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { Player } from '@/lib/stores/players-store'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { useToast } from '@/hooks/use-toast'
import BenchPlayerCardDrawer from './bench-player-card-drawer'

interface UnifiedPlayerSectionProps {
  courtPlayers: Player[]
  benchPlayers: Player[]
  playingTime: Record<string, number>
  onCourtPlayersChange: (players: Player[]) => void
  activePlayer: string | null
  onPlayerSelect: (playerId: string) => void
  onSubstitution?: (playerInId: string, playerOutId: string) => void
}

export function UnifiedPlayerSection({
  courtPlayers,
  benchPlayers,
  playingTime,
  onCourtPlayersChange,
  activePlayer,
  onPlayerSelect,
  onSubstitution,
}: UnifiedPlayerSectionProps) {
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null)
  const { toast } = useToast()

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  )

  const handleDragStart = (event: any) => {
    const { active } = event
    const player = [...courtPlayers, ...benchPlayers].find((p) => p.id === active.id)
    setDraggedPlayer(player || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedPlayer(null)

    if (!over) return

    const draggedPlayerId = active.id as string
    const draggedPlayer = [...courtPlayers, ...benchPlayers].find((p) => p.id === draggedPlayerId)
    if (!draggedPlayer) return

    const targetZoneId = over.id as string
    const draggedIsFromCourt = courtPlayers.some((p) => p.id === draggedPlayerId)

    // Handle drop on court slot
    if (targetZoneId.startsWith('court-slot-')) {
      const slotIndex = parseInt(targetZoneId.split('-')[2]) - 1

      // Check if court is full and trying to add a new player
      if (
        courtPlayers.length >= 5 &&
        !courtPlayers.find((p) => p.id === draggedPlayerId) &&
        slotIndex >= courtPlayers.length
      ) {
        toast({
          title: 'Court Full',
          description: 'Maximum 5 players allowed on court',
          variant: 'destructive',
        })
        return
      }

      const newCourt = [...courtPlayers]
      const draggedIndex = newCourt.findIndex((p) => p.id === draggedPlayerId)

      if (draggedIndex >= 0) {
        // Player already on court - reorder
        if (slotIndex !== draggedIndex) {
          const [player] = newCourt.splice(draggedIndex, 1)
          newCourt.splice(slotIndex, 0, player)
        }
      } else {
        // Player from bench
        if (slotIndex < newCourt.length) {
          // Swap: dragged player takes slot, existing player goes to bench
          const existingPlayer = newCourt[slotIndex]
          newCourt[slotIndex] = draggedPlayer
          // Record substitution: player in, player out
          if (onSubstitution) {
            onSubstitution(draggedPlayerId, existingPlayer.id)
          }
        } else if (newCourt.length < 5) {
          // Empty slot: add player
          newCourt.push(draggedPlayer)
          // Record substitution: player in (no one out)
          if (onSubstitution) {
            onSubstitution(draggedPlayerId, '')
          }
        } else {
          toast({
            title: 'Court Full',
            description: 'Cannot add more than 5 players',
            variant: 'destructive',
          })
          return
        }
      }

      onCourtPlayersChange(newCourt)
    }
    // Handle drop on bench zone or bench player
    else if (targetZoneId === 'bench-zone' || benchPlayers.some((p) => p.id === targetZoneId)) {
      // If dropping on another bench player, swap them
      const targetBenchPlayer = benchPlayers.find((p) => p.id === targetZoneId)

      if (targetBenchPlayer && draggedIsFromCourt) {
        // Dragging court player onto bench player - swap
        const newCourt = courtPlayers.filter((p) => p.id !== draggedPlayerId)
        // Record substitution: player out, new player in
        if (onSubstitution) {
          onSubstitution(targetBenchPlayer.id, draggedPlayerId)
        }
        onCourtPlayersChange(newCourt)
      } else if (draggedIsFromCourt) {
        // Dragging court player to bench zone (not on specific player)
        const newCourt = courtPlayers.filter((p) => p.id !== draggedPlayerId)
        // Record substitution: player out (no one in)
        if (onSubstitution) {
          onSubstitution('', draggedPlayerId)
        }
        onCourtPlayersChange(newCourt)
      }
    }
  }


  // Court slot component with drag and drop
  function DroppableCourtSlot({
    slotIndex,
    player,
  }: {
    slotIndex: number
    player: Player | undefined
  }) {
    const { setNodeRef: setDropRef, isOver } = useDroppable({
      id: `court-slot-${slotIndex + 1}`,
    })

    if (player) {
      // Court player with click to select and drag capability
      const { setNodeRef: setDragRef, transform, isDragging } = useDraggable({
        id: player.id,
      })

      // Merge both refs
      const mergedRef = (node: HTMLDivElement) => {
        setDragRef(node)
        setDropRef(node)
      }

      return (
        <div
          ref={mergedRef}
          style={{ transform: CSS.Translate.toString(transform) }}
          onClick={() => onPlayerSelect(player.id)}
          className={cn(
            'flex flex-col items-center gap-1 p-2 rounded-lg border-2 border-dashed transition-all duration-200 cursor-grab active:cursor-grabbing',
            isDragging && 'opacity-50',
            isOver && 'bg-green-100 dark:bg-green-950/30 border-green-400 scale-105 shadow-md',
            !isOver && (
              activePlayer === player.id
                ? 'bg-primary text-white border-primary ring-2 ring-primary ring-offset-2 scale-110 shadow-lg'
                : 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700 hover:shadow-sm'
            )
          )}
        >
          <div className="relative">
            <PlayerAvatar
              firstName={player.name.split(' ')[0]}
              lastName={player.name.split(' ')[1] || ''}
              src={player.avatar}
              jerseyNumber={player.number}
              className="h-8 w-8 rounded-full"
            />
            <div className="absolute -top-1.5 -right-1.5 bg-white dark:bg-slate-800 text-primary text-[7px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm border border-primary">
              {slotIndex + 1}
            </div>
          </div>
          <div className="text-center min-w-0">
            <div className="text-[10px] font-bold leading-tight">#{player.number}</div>
            <div className="text-[7px] text-muted-foreground font-medium truncate max-w-[50px]">{player.name.split(' ')[0]}</div>
          </div>
        </div>
      )
    }

    // Empty slot - droppable only
    return (
      <div
        ref={setDropRef}
        className={cn(
          'flex flex-col items-center gap-1 p-2 rounded-lg border-2 border-dashed transition-all duration-200',
          isOver
            ? 'bg-green-100 dark:bg-green-950/30 border-green-400 scale-105 shadow-md'
            : 'bg-slate-100 dark:bg-slate-950/20 border-slate-300 dark:border-slate-600'
        )}
      >
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400">
          {slotIndex + 1}
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Main Container - Court and Bench side by side */}
      <div className="flex gap-3">
        {/* Court Section */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* All 5 court slots */}
          {Array.from({ length: 5 }).map((_, slotIndex) => (
            <DroppableCourtSlot
              key={`court-slot-${slotIndex}`}
              slotIndex={slotIndex}
              player={courtPlayers[slotIndex]}
            />
          ))}
        </div>

        {/* Bench Section - Always visible */}
        {benchPlayers.length > 0 && (
          <div className="flex items-start gap-2 flex-wrap pl-3 border-l border-slate-200 dark:border-slate-700">
            {/* Bench label */}
            <div className="w-full text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Bench ({benchPlayers.length})
            </div>

            {/* Bench Players */}
            <div
              id="bench-zone"
              className="flex items-center gap-2 flex-wrap w-full"
            >
              {benchPlayers.map((player) => (
                <BenchPlayerCardDrawer
                  key={player.id}
                  player={player}
                  playingTime={playingTime[player.id] || 0}
                  formatTime={formatTime}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <DragOverlay>
        {draggedPlayer ? (
          <div className="flex flex-col items-center gap-1 opacity-90">
            <PlayerAvatar
              firstName={draggedPlayer.name.split(' ')[0]}
              lastName={draggedPlayer.name.split(' ')[1] || ''}
              src={draggedPlayer.avatar}
              jerseyNumber={draggedPlayer.number}
              className="h-12 w-12 rounded-full shadow-lg"
            />
            <span className="text-xs font-bold">#{draggedPlayer.number}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
