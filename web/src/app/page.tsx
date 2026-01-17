import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Activity, Trophy, TrendingUp } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center" href="#">
          <Activity className="h-6 w-6 mr-2" />
          <span className="font-bold text-xl">BallerStats</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/games">
            Games
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#">
            Players
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#">
            Teams
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-black text-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Track Your Basketball Stats Like a Pro
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
                  Record games, analyze performance, and improve your skills with our comprehensive basketball statistics tracker.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/games">
                  <Button className="bg-white text-black hover:bg-gray-200" size="lg">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-black">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 bg-white rounded-full shadow-lg dark:bg-gray-900">
                  <Activity className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Real-time Tracking</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Track shots, rebounds, assists, and more in real-time during your games.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 bg-white rounded-full shadow-lg dark:bg-gray-900">
                  <TrendingUp className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Advanced Analytics</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Visualize your progress with detailed charts and performance metrics.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 bg-white rounded-full shadow-lg dark:bg-gray-900">
                  <Trophy className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Team Management</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Manage your team, schedule games, and track team performance over the season.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2024 BallerStats. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
