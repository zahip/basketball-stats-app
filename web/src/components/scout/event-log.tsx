'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Trash2 } from 'lucide-react'
import type { Action, ActionType } from '@/types/game'

interface EventLogProps {
  actions: Action[]
  className?: string
}

const ACTION_LABELS: Record<ActionType, { label: string; color: string }> = {
  TWO_PT_MAKE: { label: '+2', color: 'text-emerald-400' },
  TWO_PT_MISS: { label: 'Miss 2', color: 'text-slate-500' },
  THREE_PT_MAKE: { label: '+3', color: 'text-emerald-400' },
  THREE_PT_MISS: { label: 'Miss 3', color: 'text-slate-500' },
  FT_MAKE: { label: '+1', color: 'text-emerald-400' },
  FT_MISS: { label: 'Miss FT', color: 'text-slate-500' },
  REB: { label: 'REB', color: 'text-cyan-400' },
  AST: { label: 'AST', color: 'text-cyan-400' },
  STL: { label: 'STL', color: 'text-cyan-400' },
  BLK: { label: 'BLK', color: 'text-cyan-400' },
  FOUL: { label: 'FOUL', color: 'text-orange-400' },
  TO: { label: 'TO', color: 'text-red-400' },
}

// History Sheet component - slides from bottom (mobile) or right (desktop)
interface HistorySheetProps {
  actions: Action[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleteAction: (actionId: string) => void
}

export function HistorySheet({ actions, open, onOpenChange, onDeleteAction }: HistorySheetProps) {
  const sortedActions = React.useMemo(
    () => [...actions].reverse(),
    [actions]
  )

  return (
    <>
      {/* Mobile Sheet - bottom */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="bg-slate-950 border-slate-800 h-[80vh] md:hidden"
        >
          <SheetHeader>
            <SheetTitle className="text-slate-200">Play-by-Play</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-2 overflow-y-auto max-h-[calc(80vh-80px)]">
            {sortedActions.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                No actions recorded yet
              </p>
            ) : (
              sortedActions.map((action) => {
                const config = ACTION_LABELS[action.type]
                return (
                  <div
                    key={action.id}
                    className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-900/60 border border-slate-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-600 w-8">
                        Q{action.quarter}
                      </span>
                      <span className="text-sm font-medium text-slate-300">
                        {action.player.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn('text-sm font-bold', config.color)}>
                        {config.label}
                      </span>
                      <button
                        onClick={() => onDeleteAction(action.id)}
                        className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-red-400 transition-colors"
                        aria-label="Delete action"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sheet - right */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="bg-slate-950 border-slate-800 hidden md:flex md:flex-col"
        >
          <SheetHeader>
            <SheetTitle className="text-slate-200">Play-by-Play</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)]">
            {sortedActions.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                No actions recorded yet
              </p>
            ) : (
              sortedActions.map((action) => {
                const config = ACTION_LABELS[action.type]
                return (
                  <div
                    key={action.id}
                    className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-900/60 border border-slate-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-600 w-8">
                        Q{action.quarter}
                      </span>
                      <span className="text-sm font-medium text-slate-300">
                        {action.player.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn('text-sm font-bold', config.color)}>
                        {config.label}
                      </span>
                      <button
                        onClick={() => onDeleteAction(action.id)}
                        className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-red-400 transition-colors"
                        aria-label="Delete action"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

// Legacy EventLog component for tablet+ (kept for backward compatibility)
export function EventLog({ actions, className }: EventLogProps) {
  const recentActions = React.useMemo(() => {
    return [...actions].reverse().slice(0, 5)
  }, [actions])

  return (
    <div className={cn('p-4 hidden md:block bg-slate-900/50', className)}>
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Recent Actions
      </h3>
      <div className="space-y-2">
        {recentActions.length === 0 ? (
          <p className="text-xs text-slate-600 text-center py-4">No actions recorded yet</p>
        ) : (
          recentActions.map((action, index) => {
            const config = ACTION_LABELS[action.type]
            return (
              <div
                key={action.id}
                className={cn(
                  'flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/40',
                  index === 0 && 'ring-1 ring-cyan-500/30'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-medium text-slate-600">Q{action.quarter}</span>
                  <span className="text-sm font-medium text-slate-300">{action.player.name}</span>
                </div>
                <span className={cn('text-sm font-bold', config.color)}>{config.label}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
