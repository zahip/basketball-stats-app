'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Game } from '@/types/game'
import type { PlayerStats } from '@/lib/stats-calculator'

interface ShareButtonProps {
  game: Game
  stats: { homeStats: PlayerStats[]; awayStats: PlayerStats[] } | null
}

export function ShareButton({ game, stats }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const shareText = useMemo(() => {
    const winner =
      game.scoreHome > game.scoreAway ? game.homeTeam.name : game.awayTeam.name
    const score = `${game.scoreHome}-${game.scoreAway}`

    // Get top 3 performers overall
    const allStats = [...(stats?.homeStats || []), ...(stats?.awayStats || [])]
      .sort((a, b) => b.points - a.points)
      .slice(0, 3)

    const topPerformers = allStats
      .map(
        (s) =>
          `${s.player.name}: ${s.points}pts, ${s.rebounds}reb, ${s.assists}ast`
      )
      .join('\n')

    // AI excerpt (first 100 chars of Hebrew summary)
    const excerpt = game.summary ? game.summary.substring(0, 100) + '...' : ''

    // Generate link (use current URL)
    const link =
      typeof window !== 'undefined' ? window.location.href : ''

    return `🏀 Game Final: ${winner} wins ${score}!

Top Performers:
${topPerformers}

${excerpt}

Full summary: ${link}`
  }, [game, stats])

  const handleShare = async () => {
    // Try Web Share API first (mobile-friendly)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${game.homeTeam.name} vs ${game.awayTeam.name}`,
          text: shareText,
        })
        return
      } catch (err) {
        // User cancelled or error - fall through to WhatsApp
        console.log('Share cancelled or failed:', err)
      }
    }

    // Fallback: WhatsApp Web link
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold mb-1">Share Game Summary</h3>
          <p className="text-sm text-muted-foreground">
            Share on WhatsApp or copy to clipboard
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" size="lg" onClick={handleCopy} className="flex-1 md:flex-none">
            {copied ? 'Copied!' : 'Copy'}
          </Button>

          <Button
            variant="default"
            size="lg"
            onClick={handleShare}
            className="flex-1 md:flex-none bg-success hover:bg-success/90"
          >
            Share to WhatsApp
          </Button>
        </div>
      </div>
    </Card>
  )
}
