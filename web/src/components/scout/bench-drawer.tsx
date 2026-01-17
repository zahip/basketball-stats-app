'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { Player, Team } from '@/types/game'

interface BenchDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  benchPlayers: Player[]
  team: Team
  isHome: boolean
  onSelectBenchPlayer: (playerId: string) => void
}

export function BenchDrawer({
  open,
  onOpenChange,
  benchPlayers,
  team,
  isHome,
  onSelectBenchPlayer,
}: BenchDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="bg-white border-slate-200 h-[50vh]">
        <SheetHeader>
          <SheetTitle className="text-slate-900">Select Player to Enter</SheetTitle>
          <p className="text-xs text-slate-500 mt-1">Tap a bench player to substitute in</p>
        </SheetHeader>

        <div className="mt-6 grid grid-cols-3 gap-3 overflow-y-auto max-h-[calc(50vh-100px)]">
          {benchPlayers.length === 0 ? (
            <div className="col-span-3 text-center py-8">
              <p className="text-sm text-slate-500">No bench players available</p>
            </div>
          ) : (
            benchPlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => onSelectBenchPlayer(player.id)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-purple-300 active:scale-95 transition-all"
              >
                <div
                  className={cn(
                    'w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg shrink-0',
                    isHome ? 'bg-violet-100 text-violet-700' : 'bg-sky-100 text-sky-700'
                  )}
                >
                  {player.jerseyNumber}
                </div>
                <div className="text-center w-full">
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {player.name}
                  </div>
                  <div className="text-[10px] text-slate-500">{player.position}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
