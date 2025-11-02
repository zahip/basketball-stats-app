'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth, useRoleAccess } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Navigation() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { isCoach, isScorer, canEdit, canManage } = useRoleAccess()

  const handleSignOut = async () => {
    await signOut()
  }

  const navigation = [
    { name: 'Games', href: '/games', icon: '🏀' },
    { name: 'Players', href: '/players', icon: '👥', requiresAuth: true },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                🏀 Basketball Stats
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                if (item.requiresAuth && !user) return null
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                      isActive(item.href)
                        ? 'border-primary text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    )}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* User info */}
                <div className="text-sm text-gray-700">
                  <span className="font-medium">{user.email}</span>
                  {(isCoach || isScorer) && (
                    <span className="ml-2 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                      {isCoach ? 'Coach' : 'Scorer'}
                    </span>
                  )}
                </div>

                {/* Sign out */}
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <Button asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu (simplified) */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          {navigation.map((item) => {
            if (item.requiresAuth && !user) return null
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'block pl-3 pr-4 py-2 border-l-4 text-base font-medium',
                  isActive(item.href)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300'
                )}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}