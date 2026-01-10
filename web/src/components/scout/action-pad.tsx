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
      <div className={cn('grid grid-cols-4 gap-1.5', className)}>
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
        'flex flex-col items-center justify-center gap-0.5 rounded-lg font-bold transition-all duration-100',
        'active:scale-95 touch-manipulation',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-inset',
        // Size variants - refined, not oversized
        size === 'md' && 'min-h-[48px] text-sm',
        size === 'sm' && 'min-h-[44px] text-xs',
        // Color variants - muted, professional
        variant === 'score' && 'bg-emerald-600/80 hover:bg-emerald-600 text-white',
        variant === 'miss' && 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700',
        variant === 'stat' && 'bg-slate-800 hover:bg-slate-700 text-slate-300',
        variant === 'foul' && 'bg-orange-600/80 hover:bg-orange-600 text-white',
        variant === 'turnover' && 'bg-red-700/80 hover:bg-red-700 text-white',
        variant === 'undo' && 'bg-slate-900 hover:bg-slate-800 text-slate-500 border border-slate-800',
        // Disabled state
        disabled && 'opacity-20 cursor-not-allowed',
        className
      )}
    >
      {icon && <span className="text-current">{icon}</span>}
      <span>{label}</span>
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
