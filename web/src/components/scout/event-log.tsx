'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import type { Action, ActionType } from '@/types/game'

interface EventLogProps {
  actions: Action[]
  className?: string
}

const ACTION_LABELS: Record<ActionType, { label: string; color: string }> = {
  TWO_PT_MAKE: { label: '+2', color: 'text-success' },
  TWO_PT_MISS: { label: 'Miss 2PT', color: 'text-muted-foreground' },
  THREE_PT_MAKE: { label: '+3', color: 'text-success' },
  THREE_PT_MISS: { label: 'Miss 3PT', color: 'text-muted-foreground' },
  REB: { label: 'Rebound', color: 'text-secondary-foreground' },
  AST: { label: 'Assist', color: 'text-secondary-foreground' },
  STL: { label: 'Steal', color: 'text-secondary-foreground' },
  BLK: { label: 'Block', color: 'text-secondary-foreground' },
  FOUL: { label: 'Foul', color: 'text-destructive' },
  TO: { label: 'Turnover', color: 'text-destructive' },
}

export function EventLog({ actions, className }: EventLogProps) {
  // Get the last 5 actions, most recent first
  const recentActions = React.useMemo(() => {
    return [...actions].reverse().slice(0, 5)
  }, [actions])

  return (
    <Card className={cn('p-4', className)}>
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Recent Actions</h3>
      <div className="space-y-2">
        {recentActions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No actions recorded yet
          </p>
        ) : (
          recentActions.map((action, index) => {
            const config = ACTION_LABELS[action.type]
            return (
              <div
                key={action.id}
                className={cn(
                  'flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 animate-slide-up',
                  index === 0 && 'ring-2 ring-primary/20'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground">Q{action.quarter}</span>
                  <span className="text-sm font-medium">{action.player.name}</span>
                </div>
                <span className={cn('text-sm font-semibold', config.color)}>
                  {config.label}
                </span>
              </div>
            )
          })
        )}
      </div>
    </Card>
  )
}
