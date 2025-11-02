'use client'

import { AuthenticatedRoute } from '@/components/auth/protected-route'
import { useRoleAccess } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function PlayersContent() {
  const { canEdit, isCoach } = useRoleAccess()

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Players</h1>
        {canEdit && (
          <Button>Add Player</Button>
        )}
      </div>
      
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Team Roster</CardTitle>
            <CardDescription>
              {canEdit 
                ? "Manage your team's players - add, edit, and view player information"
                : "View team roster and player information"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {canEdit 
                ? "No players yet. Add your first player to get started."
                : "Loading player roster..."
              }
            </p>
            
            {!canEdit && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                👀 You have viewer access. Contact your coach to add or edit players.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
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