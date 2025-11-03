'use client'

import { useState } from 'react'
import { AuthenticatedRoute } from '@/components/auth/protected-route'
import { useRoleAccess } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { PlayerForm } from '@/components/players/player-form'
import { PlayerList } from '@/components/players/player-list'
import { QuickSetup } from '@/components/players/quick-setup'
import { Player, usePlayersStore } from '@/lib/stores/players-store'
import { useToast } from '@/hooks/use-toast'

function PlayersContent() {
  const { canEdit } = useRoleAccess()
  const [showAddForm, setShowAddForm] = useState(false)
  const { toast } = useToast()
  
  const { 
    players, 
    addPlayer, 
    deletePlayer 
  } = usePlayersStore()

  const handleAddPlayer = (playerData: Omit<Player, 'id'>) => {
    addPlayer(playerData)
    setShowAddForm(false)
    toast({
      title: "Player Added",
      description: `${playerData.name} has been added to your team`,
    })
  }

  const handleDeletePlayer = (playerId: string) => {
    const player = players.find(p => p.id === playerId)
    deletePlayer(playerId)
    toast({
      title: "Player Removed",
      description: `${player?.name} has been removed from the roster`,
    })
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Players</h1>
        {canEdit && (
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : 'Add Player'}
          </Button>
        )}
      </div>

      {/* Quick Setup */}
      {canEdit && (
        <div className="mb-6">
          <QuickSetup />
        </div>
      )}

      {/* Add Player Form */}
      {showAddForm && canEdit && (
        <div className="mb-6 flex justify-center">
          <PlayerForm
            onSubmit={handleAddPlayer}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Team Roster */}
      <div className="max-w-4xl mx-auto">
        <PlayerList
          players={players}
          onEdit={canEdit ? undefined : undefined} // TODO: Add edit functionality
          onDelete={canEdit ? handleDeletePlayer : undefined}
          title="🏀 Your Team Roster"
          emptyMessage="No players added yet"
        />
      </div>

      {/* Quick Actions */}
      {canEdit && players.length === 0 && (
        <div className="mt-8 text-center">
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">🚀 Get Started</h3>
            <p className="text-muted-foreground mb-4">
              Add your team's players to start tracking game statistics
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              Add Your First Player
            </Button>
          </div>
        </div>
      )}

      {/* Viewer Message */}
      {!canEdit && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
          👀 You have viewer access. Contact your coach to add or edit players.
        </div>
      )}
    </div>
  )
}

export default function PlayersPage() {
  return (
    <AuthenticatedRoute>
      <PlayersContent />
    </AuthenticatedRoute>
  )
}