'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface EndGameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameId: string
}

export function EndGameDialog({ open, onOpenChange, gameId }: EndGameDialogProps) {
  const router = useRouter()

  const handleEndGame = () => {
    // TODO: Call API to update game status to FINISHED
    // For now, navigate to home
    router.push('/')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-slate-100">End Game?</DialogTitle>
          <DialogDescription className="text-slate-400">
            This will mark the game as finished. Are you sure?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleEndGame}>
            End Game
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
