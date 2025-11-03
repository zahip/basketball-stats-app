'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePlayersStore } from '@/lib/stores/players-store'
import { useToast } from '@/hooks/use-toast'

export function QuickSetup() {
  const { addPlayer, players } = usePlayersStore()
  const { toast } = useToast()

  const samplePlayers = [
    // Your Team Roster
    { number: 1, name: 'John Smith', position: 'PG' as const, height: '6\'2"', weight: '185 lbs', isActive: true },
    { number: 5, name: 'Mike Johnson', position: 'SG' as const, height: '6\'4"', weight: '195 lbs', isActive: true },
    { number: 10, name: 'David Wilson', position: 'SF' as const, height: '6\'7"', weight: '210 lbs', isActive: true },
    { number: 15, name: 'Chris Brown', position: 'PF' as const, height: '6\'9"', weight: '235 lbs', isActive: true },
    { number: 20, name: 'Alex Davis', position: 'C' as const, height: '6\'11"', weight: '250 lbs', isActive: true },
    { number: 7, name: 'Ryan Taylor', position: 'PG' as const, height: '6\'1"', weight: '180 lbs', isActive: true },
    { number: 12, name: 'Kevin Martinez', position: 'SG' as const, height: '6\'3"', weight: '190 lbs', isActive: true },
    { number: 25, name: 'James Anderson', position: 'SF' as const, height: '6\'8"', weight: '220 lbs', isActive: true },
  ]

  const handleQuickSetup = () => {
    samplePlayers.forEach(player => {
      addPlayer(player)
    })
    
    toast({
      title: "Sample Players Added!",
      description: `Added ${samplePlayers.length} players to your team roster`,
    })
  }

  if (players.length > 0) {
    return null // Don't show if players already exist
  }

  return (
    <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
      <CardHeader className="text-center">
        <CardTitle className="text-lg">🚀 Quick Setup</CardTitle>
        <CardDescription>
          Get started quickly with sample players for your team
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button onClick={handleQuickSetup} size="lg">
          Add Sample Players
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          You can edit or delete these players after adding them
        </p>
      </CardContent>
    </Card>
  )
}