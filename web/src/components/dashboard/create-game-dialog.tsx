'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useTeams } from '@/lib/hooks/use-teams'
import { useCreateGame } from '@/lib/hooks/use-games'

interface CreateGameDialogProps {
  children: React.ReactNode
}

export function CreateGameDialog({ children }: CreateGameDialogProps) {
  const [open, setOpen] = useState(false)
  const [homeTeamId, setHomeTeamId] = useState('')
  const [awayTeamId, setAwayTeamId] = useState('')

  const { data: teamsData, isLoading: teamsLoading } = useTeams()
  const createGame = useCreateGame()

  const teams = teamsData?.teams ?? []

  const handleSubmit = async () => {
    if (!homeTeamId || !awayTeamId) return

    try {
      await createGame.mutateAsync({ homeTeamId, awayTeamId })
      setOpen(false)
      setHomeTeamId('')
      setAwayTeamId('')
    } catch {
      // Error handled by mutation
    }
  }

  const isValid = homeTeamId && awayTeamId && homeTeamId !== awayTeamId

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Game</DialogTitle>
          <DialogDescription>
            Select home and away teams to create a new game.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Home Team Select */}
          <div className="space-y-2">
            <Label htmlFor="home-team">Home Team</Label>
            <select
              id="home-team"
              value={homeTeamId}
              onChange={(e) => setHomeTeamId(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
              disabled={teamsLoading}
            >
              <option value="">Select home team...</option>
              {teams.map((team) => (
                <option
                  key={team.id}
                  value={team.id}
                  disabled={team.id === awayTeamId}
                >
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Away Team Select */}
          <div className="space-y-2">
            <Label htmlFor="away-team">Away Team</Label>
            <select
              id="away-team"
              value={awayTeamId}
              onChange={(e) => setAwayTeamId(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
              disabled={teamsLoading}
            >
              <option value="">Select away team...</option>
              {teams.map((team) => (
                <option
                  key={team.id}
                  value={team.id}
                  disabled={team.id === homeTeamId}
                >
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || createGame.isPending}>
            {createGame.isPending ? 'Creating...' : 'Create Game'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
