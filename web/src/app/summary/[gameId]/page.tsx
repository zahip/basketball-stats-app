import { GameSummary } from '@/components/summary/game-summary'

interface SummaryPageProps {
  params: Promise<{
    gameId: string
  }>
}

export default async function SummaryPage({ params }: SummaryPageProps) {
  const { gameId } = await params
  return <GameSummary gameId={gameId} />
}
