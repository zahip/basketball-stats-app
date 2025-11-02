'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center max-w-4xl">
        <h1 className="text-5xl font-bold mb-4">🏀 Basketball Stats</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Professional live game statistics tracking and analysis
        </p>

        {user ? (
          <div className="mb-8">
            <p className="text-lg mb-4">Welcome back, <strong>{user.email}</strong>!</p>
            <Button asChild size="lg">
              <Link href="/games">Go to Games</Link>
            </Button>
          </div>
        ) : (
          <div className="mb-8 space-x-4">
            <Button asChild size="lg">
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/games">View Public Games</Link>
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                🏀 Live Tracking
              </CardTitle>
              <CardDescription>
                Record game events in real-time with offline support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1 text-left">
                <li>• Shots, rebounds, assists</li>
                <li>• Real-time box scores</li>
                <li>• Offline-first design</li>
                <li>• Touch-optimized interface</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                📊 Analytics
              </CardTitle>
              <CardDescription>
                Advanced statistics and four factors analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1 text-left">
                <li>• Effective FG% & True Shooting%</li>
                <li>• Four Factors breakdown</li>
                <li>• Shot charts with locations</li>
                <li>• Player efficiency metrics</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                📱 Multi-Device
              </CardTitle>
              <CardDescription>
                Real-time sync across devices with role-based access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1 text-left">
                <li>• Coach, Scorer, Viewer roles</li>
                <li>• Live updates via Supabase</li>
                <li>• PWA installation</li>
                <li>• Works offline in gym</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <h3 className="text-lg font-semibold mb-4">Role-Based Access</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <strong>👨‍💼 Coach</strong>
              <p>Full access - manage players, games, and settings</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <strong>📝 Scorer</strong>
              <p>Record events, update scores, manage live games</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <strong>👀 Viewer</strong>
              <p>Watch live updates, view statistics and reports</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}