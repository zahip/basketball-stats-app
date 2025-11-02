export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Basketball Stats</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Live game statistics tracking - Coming Soon
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-md">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold">Games</h3>
            <p className="text-sm text-muted-foreground">Manage games</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold">Live</h3>
            <p className="text-sm text-muted-foreground">Track live games</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold">Reports</h3>
            <p className="text-sm text-muted-foreground">View statistics</p>
          </div>
        </div>
      </div>
    </main>
  )
}