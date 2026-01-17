'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  Target,
  Circle,
  Hand,
  RefreshCw,
  Users,
  Shield,
  XCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react'
import type { ActionType } from '@/types/game'

interface ActionPadContextValue {
  onAction: (type: ActionType | 'UNDO') => void
  disabled: boolean
}

const ActionPadContext = React.createContext<ActionPadContextValue | undefined>(undefined)

function useActionPad() {
  const context = React.useContext(ActionPadContext)
  if (!context) {
    throw new Error('ActionPad components must be used within ActionPad.Root')
  }
  return context
}

interface ActionPadRootProps {
  onAction: (type: ActionType | 'UNDO') => void
  disabled?: boolean
  children: React.ReactNode
  className?: string
}

function ActionPadRoot({ onAction, disabled = false, children, className }: ActionPadRootProps) {
  // Wrap onAction with haptic feedback
  const handleAction = React.useCallback(
    (type: ActionType | 'UNDO') => {
      // Trigger haptic feedback on supported devices
      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10)
      }
      onAction(type)
    },
    [onAction]
  )

  const value = React.useMemo(
    () => ({ onAction: handleAction, disabled }),
    [handleAction, disabled]
  )

  return (
    <ActionPadContext.Provider value={value}>
      <div className={cn('grid grid-cols-4 grid-rows-4 gap-1', className)}>
        {children}
      </div>
    </ActionPadContext.Provider>
  )
}

type ActionButtonVariant = 'score' | 'miss' | 'stat' | 'foul' | 'turnover' | 'undo'

interface ActionButtonProps {
  type: ActionType | 'UNDO'
  label: string
  icon?: React.ReactNode
  variant?: ActionButtonVariant
  size?: 'md' | 'sm'
  className?: string
}

function ActionButton({
  type,
  label,
  icon,
  variant = 'stat',
  size = 'md',
  className,
}: ActionButtonProps) {
  const { onAction, disabled } = useActionPad()

  return (
    <button
      disabled={disabled}
      onClick={() => onAction(type)}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 rounded font-bold transition-all duration-100',
        'active:scale-95 touch-manipulation',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-inset',
        // Compact sizing for 50vh constraint
        size === 'md' && 'h-full text-xs',
        size === 'sm' && 'h-full text-[10px]',
        // Color variants with visual grouping - light theme semi-transparent
        variant === 'score' &&
          'bg-emerald-500/20 text-emerald-700 border border-emerald-500/30 hover:bg-emerald-500/30',
        variant === 'miss' && 'bg-rose-500/20 text-rose-700 border border-rose-500/30 hover:bg-rose-500/30',
        variant === 'stat' &&
          'bg-slate-500/20 text-slate-700 border border-slate-500/30 hover:bg-slate-500/30',
        variant === 'foul' &&
          'bg-orange-500/20 text-orange-700 border border-orange-500/30 hover:bg-orange-500/30',
        variant === 'turnover' &&
          'bg-red-500/20 text-red-700 border border-red-500/30 hover:bg-red-500/30',
        variant === 'undo' && 'bg-slate-200 text-slate-600 hover:bg-slate-300',
        // Disabled state
        disabled && 'opacity-20 cursor-not-allowed',
        className
      )}
    >
      {icon && <span className="text-current">{icon}</span>}
      <span className="leading-tight">{label}</span>
    </button>
  )
}

// Pre-configured action buttons with icons
const ActionButtons = {
  // Scoring - muted green
  TwoPtMake: (props: Partial<ActionButtonProps>) => (
    <ActionButton
      type="TWO_PT_MAKE"
      label="+2"
      icon={<Target size={18} />}
      variant="score"
      size="md"
      {...props}
    />
  ),
  ThreePtMake: (props: Partial<ActionButtonProps>) => (
    <ActionButton
      type="THREE_PT_MAKE"
      label="+3"
      icon={<Target size={18} />}
      variant="score"
      size="md"
      {...props}
    />
  ),
  FtMake: (props: Partial<ActionButtonProps>) => (
    <ActionButton
      type="FT_MAKE"
      label="FT"
      icon={<Circle size={16} />}
      variant="score"
      size="md"
      {...props}
    />
  ),
  FtMiss: (props: Partial<ActionButtonProps>) => (
    <ActionButton
      type="FT_MISS"
      label="Miss FT"
      icon={<XCircle size={16} />}
      variant="miss"
      size="md"
      {...props}
    />
  ),
  // Misses - subtle gray
  TwoPtMiss: (props: Partial<ActionButtonProps>) => (
    <ActionButton
      type="TWO_PT_MISS"
      label="Miss 2"
      icon={<Circle size={16} strokeDasharray="4 2" />}
      variant="miss"
      size="md"
      {...props}
    />
  ),
  ThreePtMiss: (props: Partial<ActionButtonProps>) => (
    <ActionButton
      type="THREE_PT_MISS"
      label="Miss 3"
      icon={<Circle size={16} strokeDasharray="4 2" />}
      variant="miss"
      size="md"
      {...props}
    />
  ),
  // Stats - neutral slate
  Rebound: (props: Partial<ActionButtonProps>) => (
    <ActionButton
      type="REB"
      label="REB"
      icon={<RefreshCw size={16} />}
      variant="stat"
      size="md"
      {...props}
    />
  ),
  Assist: (props: Partial<ActionButtonProps>) => (
    <ActionButton
      type="AST"
      label="AST"
      icon={<Users size={16} />}
      variant="stat"
      size="md"
      {...props}
    />
  ),
  Steal: (props: Partial<ActionButtonProps>) => (
    <ActionButton
      type="STL"
      label="STL"
      icon={<Shield size={16} />}
      variant="stat"
      size="md"
      {...props}
    />
  ),
  Block: (props: Partial<ActionButtonProps>) => (
    <ActionButton
      type="BLK"
      label="BLK"
      icon={<Hand size={16} />}
      variant="stat"
      size="md"
      {...props}
    />
  ),
  // Critical - muted orange/red
  Foul: (props: Partial<ActionButtonProps>) => (
    <ActionButton
      type="FOUL"
      label="FOUL"
      icon={<AlertTriangle size={16} />}
      variant="foul"
      size="md"
      {...props}
    />
  ),
  Turnover: (props: Partial<ActionButtonProps>) => (
    <ActionButton
      type="TO"
      label="TURNOVER"
      icon={<XCircle size={16} />}
      variant="turnover"
      size="md"
      {...props}
    />
  ),
  // Undo - very subtle
  Undo: (props: Partial<ActionButtonProps>) => (
    <ActionButton
      type="UNDO"
      label="Undo Last Action"
      icon={<RotateCcw size={16} />}
      variant="undo"
      size="sm"
      {...props}
    />
  ),
}

export const ActionPad = {
  Root: ActionPadRoot,
  Action: ActionButton,
  ...ActionButtons,
}
