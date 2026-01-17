'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Target,
  Circle,
  XCircle,
  RefreshCw,
  Users,
  Shield,
  Hand,
  AlertTriangle,
} from 'lucide-react'
import type { Action, ActionType } from '@/types/game'
import { cn } from '@/lib/utils'

interface LivePlayByPlayProps {
  actions: Action[]
  className?: string
}

// Action type to icon and label mapping
const ACTION_CONFIG: Record<
  ActionType,
  { icon: React.ReactNode; label: string; colorClass: string }
> = {
  TWO_PT_MAKE: {
    icon: <Target size={16} />,
    label: '+2',
    colorClass: 'text-emerald-400',
  },
  THREE_PT_MAKE: {
    icon: <Target size={16} />,
    label: '+3',
    colorClass: 'text-emerald-400',
  },
  FT_MAKE: {
    icon: <Circle size={16} />,
    label: '+1',
    colorClass: 'text-emerald-400',
  },
  TWO_PT_MISS: {
    icon: <XCircle size={16} />,
    label: 'Miss',
    colorClass: 'text-slate-500',
  },
  THREE_PT_MISS: {
    icon: <XCircle size={16} />,
    label: 'Miss',
    colorClass: 'text-slate-500',
  },
  FT_MISS: {
    icon: <XCircle size={16} />,
    label: 'Miss',
    colorClass: 'text-slate-500',
  },
  REB: {
    icon: <RefreshCw size={16} />,
    label: 'REB',
    colorClass: 'text-cyan-400',
  },
  AST: {
    icon: <Users size={16} />,
    label: 'AST',
    colorClass: 'text-cyan-400',
  },
  STL: {
    icon: <Shield size={16} />,
    label: 'STL',
    colorClass: 'text-cyan-400',
  },
  BLK: {
    icon: <Hand size={16} />,
    label: 'BLK',
    colorClass: 'text-cyan-400',
  },
  FOUL: {
    icon: <AlertTriangle size={16} />,
    label: 'FOUL',
    colorClass: 'text-orange-400',
  },
  TO: {
    icon: <XCircle size={16} />,
    label: 'TO',
    colorClass: 'text-red-400',
  },
  SUB_IN: {
    icon: <Users size={16} />,
    label: 'SUB IN',
    colorClass: 'text-amber-400',
  },
  SUB_OUT: {
    icon: <Users size={16} />,
    label: 'SUB OUT',
    colorClass: 'text-amber-400',
  },
}

/**
 * LivePlayByPlay - Displays the last 10 game actions with animations
 * Shows player name, action type, and quarter with color-coded icons
 */
export function LivePlayByPlay({ actions, className }: LivePlayByPlayProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/60">
          <h3 className="text-sm md:text-base font-bold text-slate-50 uppercase tracking-wider">
            Live Play-by-Play
          </h3>
        </div>

        {/* Actions list */}
        <div className="p-2 md:p-3 space-y-1 max-h-[400px] md:max-h-[500px] overflow-y-auto">
          {actions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-500">No plays yet</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {actions.map((action, index) => {
                const config = ACTION_CONFIG[action.type]

                return (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.03, // Stagger effect
                    }}
                    className="flex items-center gap-3 p-2.5 md:p-3 bg-slate-900/60 hover:bg-slate-900/80 rounded-lg transition-colors"
                  >
                    {/* Quarter badge */}
                    <div className="flex-shrink-0">
                      <span className="text-xs font-semibold text-slate-400 px-2 py-0.5 bg-slate-800/60 rounded">
                        Q{action.quarter}
                      </span>
                    </div>

                    {/* Action icon */}
                    <div
                      className={cn(
                        'flex-shrink-0',
                        config.colorClass
                      )}
                    >
                      {config.icon}
                    </div>

                    {/* Player name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {action.player.name}
                      </p>
                    </div>

                    {/* Action label */}
                    <div className="flex-shrink-0">
                      <span
                        className={cn(
                          'text-xs md:text-sm font-bold',
                          config.colorClass
                        )}
                      >
                        {config.label}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}
