'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { MouseSensor, TouchSensor } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Player } from '@/lib/stores/players-store'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import CourtSlot from './court-slot'
import BenchPlayerCard from './bench-player-card'

interface PlayerManagementProps {
  courtPlayers: Player[]
  benchPlayers: Player[]
  playingTime: Record<string, number>
  onCourtPlayersChange: (players: Player[]) => void
}

export function PlayerManagement({
  courtPlayers,
  benchPlayers,
  playingTime,
  onCourtPlayersChange,
}: PlayerManagementProps) {
  const [benchExpanded, setBenchExpanded] = useState(true)
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
          // Don't need to add existing player to bench - they're automatically there
        } else if (newCourt.length < 5) {
          // Empty slot: add player
          newCourt.push(draggedPlayer)
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
    // Handle drop on bench
    else if (targetZoneId === 'bench-zone') {
      const draggedIndex = courtPlayers.findIndex((p) => p.id === draggedPlayerId)
      if (draggedIndex >= 0) {
        // Remove from court
        const newCourt = courtPlayers.filter((p) => p.id !== draggedPlayerId)
        onCourtPlayersChange(newCourt)
      }
    }
  }

  // Create slots for court (up to 5)
  const courtSlots = Array.from({ length: 5 }, (_, i) => i)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Compact Court Section */}
      <div className="flex items-center gap-2 flex-wrap">
        {courtSlots.map((slotIndex) => {
          const player = courtPlayers[slotIndex]
          return (
            <CourtSlot
              key={`court-slot-${slotIndex + 1}`}
              slotId={`court-slot-${slotIndex + 1}`}
              player={player}
              playingTime={player ? playingTime[player.id] || 0 : 0}
              formatTime={formatTime}
            />
          )
        })}

        {/* Bench Zone - Collapsible */}
        <div
          className={cn(
            'flex items-center gap-1 px-3 py-2 rounded-lg border-2 border-dashed transition-all cursor-pointer',
            benchExpanded
              ? 'bg-slate-50 dark:bg-slate-950/20 border-slate-300 dark:border-slate-700 flex-1'
              : 'border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-900/30'
          )}
          onClick={() => setBenchExpanded(!benchExpanded)}
        >
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
            Bench ({benchPlayers.length})
          </span>
          {benchExpanded ? (
            <ChevronUp className="h-3 w-3 text-muted-foreground ml-auto flex-shrink-0" />
          ) : (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Bench Players - Inline when expanded */}
      {benchExpanded && benchPlayers.length > 0 && (
        <div id="bench-zone" className="flex items-center gap-2 flex-wrap">
          {benchPlayers.map((player) => (
            <BenchPlayerCard
              key={player.id}
              player={player}
              playingTime={playingTime[player.id] || 0}
              formatTime={formatTime}
            />
          ))}
        </div>
      )}

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
