import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function PlayersPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Players</h1>
        <Button>Add Player</Button>
      </div>
      
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Team Roster</CardTitle>
            <CardDescription>
              Manage your team's players - add, edit, and view player information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No players yet. Add your first player to get started.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}