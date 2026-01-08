interface LivePageProps {
  params: Promise<{ gameId: string }>
}

export default async function LivePage({ params }: LivePageProps) {
  const { gameId } = await params

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-4">Live Game View</h1>
      <p className="text-muted-foreground">Game ID: {gameId}</p>
      {/* TODO: Implement read-only live view with realtime updates */}
    </div>
  )
}
