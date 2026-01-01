import { Scouter } from '@/components/scout/scouter'

interface ScoutPageProps {
  params: Promise<{
    gameId: string
  }>
}

export default async function ScoutPage({ params }: ScoutPageProps) {
  const { gameId } = await params
  return <Scouter gameId={gameId} />
}
