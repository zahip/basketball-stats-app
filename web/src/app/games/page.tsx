import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function GamesPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Games</h1>
        <Button>New Game</Button>
      </div>
      
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Games List</CardTitle>
            <CardDescription>
              Manage your team's games - create, view, and track live games
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No games yet. Create your first game to get started.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}