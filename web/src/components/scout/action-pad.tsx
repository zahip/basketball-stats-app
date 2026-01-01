'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ActionType } from '@/types/game'

interface ActionPadContextValue {
  onAction: (type: ActionType) => void
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
  onAction: (type: ActionType) => void
  disabled?: boolean
  children: React.ReactNode
  className?: string
}

function ActionPadRoot({ onAction, disabled = false, children, className }: ActionPadRootProps) {
  const value = React.useMemo(
    () => ({ onAction, disabled }),
    [onAction, disabled]
  )

  return (
    <ActionPadContext.Provider value={value}>
      <div className={cn('grid grid-cols-3 gap-3', className)}>
        {children}
      </div>
    </ActionPadContext.Provider>
  )
}

interface ActionButtonProps {
  type: ActionType
  label: string
  variant?: 'success' | 'destructive' | 'secondary' | 'default'
  className?: string
}

function ActionButton({ type, label, variant = 'default', className }: ActionButtonProps) {
  const { onAction, disabled } = useActionPad()

  return (
    <Button
      variant={variant}
      size="touch"
      disabled={disabled}
      onClick={() => onAction(type)}
      className={cn('h-16 text-base font-bold', className)}
    >
      {label}
    </Button>
  )
}

export const ActionPad = {
  Root: ActionPadRoot,
  Action: ActionButton,
}
