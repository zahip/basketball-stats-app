'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { gamesApi, teamsApi, CreateGameData } from '@/lib/api-client'

export default function NewGamePage() {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<CreateGameData>({
    teamId: '',
    opponent: '',
    date: '',
    venue: '',
  })

  // Fetch teams for the dropdown
  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.getAll(),
  })

  const teams = teamsData?.teams || []

  // Create game mutation
  const createGameMutation = useMutation({
    mutationFn: (data: CreateGameData) => gamesApi.create(data),
    onSuccess: (response) => {
      toast({
        title: 'Success',
        description: 'Game created successfully',
      })
      queryClient.invalidateQueries({ queryKey: ['games'] })
      router.push('/games')
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.teamId || !formData.opponent || !formData.date) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    // Convert date to ISO format
    const isoDate = new Date(formData.date).toISOString()

    createGameMutation.mutate({
      ...formData,
      date: isoDate,
      venue: formData.venue || undefined,
    })
  }

  const handleChange = (field: keyof CreateGameData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="mb-6">
        <Link href="/games">
          <Button variant="ghost" size="sm">
            ← Back to Games
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Game</CardTitle>
          <CardDescription>Schedule a new basketball game</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="teamId">
                Your Team <span className="text-red-500">*</span>
              </Label>
              <select
                id="teamId"
                value={formData.teamId}
                onChange={(e) => handleChange('teamId', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={teamsLoading}
                required
              >
                <option value="">
                  {teamsLoading ? 'Loading teams...' : 'Select a team'}
                </option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.season})
                  </option>
                ))}
              </select>
              {teams.length === 0 && !teamsLoading && (
                <p className="text-sm text-muted-foreground">
                  No teams found. Create a team first.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="opponent">
                Opponent <span className="text-red-500">*</span>
              </Label>
              <Input
                id="opponent"
                type="text"
                value={formData.opponent}
                onChange={(e) => handleChange('opponent', e.target.value)}
                placeholder="Enter opponent team name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">
                Date & Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date"
                type="datetime-local"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue">Venue (Optional)</Label>
              <Input
                id="venue"
                type="text"
                value={formData.venue}
                onChange={(e) => handleChange('venue', e.target.value)}
                placeholder="Enter venue location"
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={createGameMutation.isPending}
                className="flex-1"
              >
                {createGameMutation.isPending ? 'Creating...' : 'Create Game'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/games')}
                disabled={createGameMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
