'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Player } from '@/lib/stores/players-store'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface QuickBenchProps {
  isOpen: boolean
  onClose: () => void
  courtPlayers: Player[]
  benchPlayers: Player[]
  playingTime: Record<string, number>
  onSubIn: (playerId: string, playerOutId: string) => void
  onSubOut: (playerId: string) => void
}

export function QuickBench({
  isOpen,
  onClose,
  courtPlayers,
  benchPlayers,
  playingTime,
  onSubIn,
  onSubOut,
}: QuickBenchProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-end">
      <Card className="w-full rounded-t-2xl shadow-2xl">
        <CardContent className="p-6">
          {/* Handle */}
          <div className="flex justify-center mb-4">
            <div className="h-1 w-12 bg-muted-foreground/20 rounded-full"></div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Substitutions</h2>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              ✕
            </Button>
          </div>

          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Court Players */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="default" className="text-xs">
                  ON COURT ({courtPlayers.length})
                </Badge>
              </div>

              <div className="space-y-2">
                {courtPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <PlayerAvatar
                        firstName={player.name.split(' ')[0]}
                        lastName={player.name.split(' ')[1] || ''}
                        src={player.avatar}
                        jerseyNumber={player.number}
                        className="h-8 w-8 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate">
                          #{player.number} {player.name.split(' ')[0]}
                        </div>
                        <div className="text-xs text-green-700 dark:text-green-300 font-medium">
                          Playing: {formatTime(playingTime[player.id] || 0)}
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => onSubOut(player.id)}
                      variant="destructive"
                      size="sm"
                      className="h-9 px-3 text-xs font-semibold flex-shrink-0"
                    >
                      Sub Out
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bench Players */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="text-xs">
                  BENCH ({benchPlayers.length})
                </Badge>
              </div>

              <div className="space-y-2">
                {benchPlayers.length > 0 ? (
                  benchPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <PlayerAvatar
                          firstName={player.name.split(' ')[0]}
                          lastName={player.name.split(' ')[1] || ''}
                          src={player.avatar}
                          jerseyNumber={player.number}
                          className="h-8 w-8 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold truncate">
                            #{player.number} {player.name.split(' ')[0]}
                          </div>
                          <div className="text-xs text-muted-foreground font-medium">
                            Time: {formatTime(playingTime[player.id] || 0)}
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => {
                          // Simple sub in - replaces first court player, or just add if court is empty
                          const playerOutId = courtPlayers.length > 0 ? courtPlayers[0] : ''
                          onSubIn(player.id, playerOutId)
                        }}
                        variant="default"
                        size="sm"
                        className="h-9 px-3 text-xs font-semibold flex-shrink-0"
                      >
                        Add / Sub
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    All players on court
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Close Button */}
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full mt-6 h-10 font-semibold"
          >
            Done
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
