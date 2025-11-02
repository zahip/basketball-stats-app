'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { GameHeader } from '@/components/game/game-header'
import { ActionGrid } from '@/components/game/action-grid'
import { PlayersGrid } from '@/components/game/players-grid'
import { eventQueueManager } from '@/lib/offline-queue'
import { useToast } from '@/hooks/use-toast'
import { useRealtimeGame } from '@/hooks/use-realtime-game'

interface LiveGamePageProps {
  params: Promise<{ id: string }>
}

// Mock game data - would come from API
const mockGameData = {
  id: '2',
  homeTeam: 'Celtics',
  awayTeam: 'Heat',
  homeScore: 78,
  awayScore: 71,
  status: 'active' as const,
  period: 3,
  clock: '08:42'
}

function LiveGameContent({ gameId }: { gameId: string }) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away' | null>(null)
  const [gameData, setGameData] = useState(mockGameData)
  const [pendingEventsCount, setPendingEventsCount] = useState(0)
  const { toast } = useToast()
  const { gameState, recentEvents, connectionStatus, isConnected } = useRealtimeGame(gameId)

  useEffect(() => {
    // Setup offline queue network listeners
    eventQueueManager.setupNetworkListeners()
    
    // Check for pending events on load
    updatePendingEventsCount()
    
    // Set up interval to check pending events
    const interval = setInterval(updatePendingEventsCount, 5000)
    return () => clearInterval(interval)
  }, [gameId])

  const updatePendingEventsCount = async () => {
    const pendingEvents = await eventQueueManager.getPendingEvents(gameId)
    setPendingEventsCount(pendingEvents.length)
  }

  const handlePlayerSelect = (playerId: string, team: 'home' | 'away') => {
    if (playerId === '') {
      setSelectedPlayer(null)
      setSelectedTeam(null)
    } else {
      setSelectedPlayer(playerId)
      setSelectedTeam(team)
    }
  }

  const handleAction = async (eventType: string, data: any) => {
    if (!selectedPlayer || !selectedTeam) {
      toast({
        title: "Selection Required",
        description: "Please select a player and team first",
        variant: "destructive"
      })
      return
    }

    try {
      // Add event to offline queue
      await eventQueueManager.addEvent(
        gameId,
        eventType,
        selectedPlayer,
        selectedTeam,
        data
      )

      // Optimistic UI update
      if (eventType.includes('made') || eventType.includes('field_goal_made') || eventType.includes('three_point_made')) {
        const points = eventType.includes('three_point') ? 3 : eventType.includes('free_throw') ? 1 : 2
        setGameData(prev => ({
          ...prev,
          [selectedTeam === 'home' ? 'homeScore' : 'awayScore']: 
            prev[selectedTeam === 'home' ? 'homeScore' : 'awayScore'] + points
        }))
      }

      // Update pending events count
      updatePendingEventsCount()

      toast({
        title: "Event Recorded",
        description: `${eventType.replace(/_/g, ' ')} recorded for player #${selectedPlayer}`,
      })

      // Auto-clear selection for certain events
      if (eventType.includes('made') || eventType.includes('missed')) {
        // Keep selection for rapid fire events
      } else {
        setSelectedPlayer(null)
        setSelectedTeam(null)
      }

    } catch (error) {
      console.error('Failed to record event:', error)
      toast({
        title: "Recording Failed",
        description: "Event will be retried when connection is restored",
        variant: "destructive"
      })
    }
  }

  const handleUndoLastEvent = async () => {
    const success = await eventQueueManager.removeLastPendingEvent(gameId)
    if (success) {
      toast({
        title: "Event Undone",
        description: "Last pending event has been removed",
      })
      updatePendingEventsCount()
    } else {
      toast({
        title: "Nothing to Undo",
        description: "No pending events found",
        variant: "destructive"
      })
    }
  }

  const handleSyncNow = async () => {
    if (!navigator.onLine) {
      toast({
        title: "Offline",
        description: "Cannot sync while offline",
        variant: "destructive"
      })
      return
    }

    try {
      await eventQueueManager.syncPendingEvents()
      updatePendingEventsCount()
      toast({
        title: "Sync Complete",
        description: "All pending events have been synced",
      })
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Some events could not be synced",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Game Header */}
      <GameHeader
        gameId={gameId}
        homeTeam={gameData.homeTeam}
        awayTeam={gameData.awayTeam}
        homeScore={gameData.homeScore}
        awayScore={gameData.awayScore}
        period={gameData.period}
        clock={gameData.clock}
        status={gameData.status}
      />

      {/* Offline Status & Controls */}
      <Card className="mb-4">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div className={`flex items-center gap-2 ${navigator.onLine ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`w-2 h-2 rounded-full ${navigator.onLine ? 'bg-green-500' : 'bg-red-500'}`} />
                {navigator.onLine ? 'Online' : 'Offline'}
              </div>
              <div className={`flex items-center gap-2 ${isConnected ? 'text-green-600' : 'text-yellow-600'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
                Realtime: {connectionStatus}
              </div>
              {pendingEventsCount > 0 && (
                <div className="text-yellow-600">
                  📋 {pendingEventsCount} events pending sync
                </div>
              )}
              {recentEvents.length > 0 && (
                <div className="text-blue-600">
                  📡 {recentEvents.length} recent events
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleUndoLastEvent}
                variant="outline"
                size="sm"
                disabled={pendingEventsCount === 0}
              >
                ↶ Undo Last
              </Button>
              <Button
                onClick={handleSyncNow}
                variant="outline"
                size="sm"
                disabled={!navigator.onLine || pendingEventsCount === 0}
              >
                🔄 Sync Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Game Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Action Grid */}
        <div className="lg:col-span-2">
          <ActionGrid
            selectedPlayer={selectedPlayer}
            selectedTeam={selectedTeam}
            onAction={handleAction}
            disabled={gameData.status !== 'active'}
          />
        </div>

        {/* Right Column: Players Grid */}
        <div>
          <PlayersGrid
            homePlayers={[]}
            awayPlayers={[]}
            selectedPlayer={selectedPlayer}
            selectedTeam={selectedTeam}
            onPlayerSelect={handlePlayerSelect}
          />
        </div>
      </div>
    </div>
  )
}

export default function LiveGamePage({ params }: LiveGamePageProps) {
  const { id } = use(params)

  return (
    <ProtectedRoute requiredRole="scorer">
      <LiveGameContent gameId={id} />
    </ProtectedRoute>
  )
}