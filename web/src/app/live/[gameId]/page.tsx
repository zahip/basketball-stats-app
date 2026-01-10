import { LiveViewer } from '@/components/live/live-viewer'

interface LivePageProps {
  params: Promise<{ gameId: string }>
}

export default async function LivePage({ params }: LivePageProps) {
  const { gameId } = await params

  return <LiveViewer gameId={gameId} />
}
