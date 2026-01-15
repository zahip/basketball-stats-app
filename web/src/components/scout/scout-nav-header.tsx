'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ScoutNavHeaderProps {
  onEndGame?: () => void
  className?: string
}

export function ScoutNavHeader({ onEndGame, className }: ScoutNavHeaderProps) {
  const router = useRouter()

  return (
    <header
      className={cn(
        'flex items-center justify-between h-[8vh] px-4 bg-slate-900/95 border-b border-slate-800/50',
        className
      )}
    >
      {/* Left: Back Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.push('/')}
        className="text-slate-100 hover:text-white hover:bg-slate-800/60"
        aria-label="Back to games"
      >
        <ChevronLeft className="w-6 h-6" />
      </Button>

      {/* Center: Optional Title */}
      <span className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
        Scout Mode
      </span>

      {/* Right: End Game Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onEndGame}
        className="text-slate-100 hover:text-white hover:bg-slate-800/60"
        aria-label="End game"
      >
        <Settings className="w-5 h-5" />
      </Button>
    </header>
  )
}
