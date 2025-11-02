'use client'

import { useRequireAuth, UserRole } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
  fallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallback 
}: ProtectedRouteProps) {
  const { user, role, loading, hasAccess, isAuthenticated } = useRequireAuth(requiredRole)
  
  console.log('ProtectedRoute Debug:', { 
    user: user?.email, 
    role, 
    loading, 
    hasAccess, 
    isAuthenticated, 
    requiredRole 
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>🔒 Authentication Required</CardTitle>
            <CardDescription>
              You need to sign in to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!hasAccess) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>⛔ Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Your role: <strong>{role}</strong>
              {requiredRole && (
                <>
                  <br />
                  Required: <strong>{requiredRole}</strong>
                </>
              )}
            </p>
            <Button asChild variant="outline">
              <Link href="/games">Go to Games</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}

// Role-specific route protection components
export function CoachOnlyRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="coach">
      {children}
    </ProtectedRoute>
  )
}

export function ScorerRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="scorer">
      {children}
    </ProtectedRoute>
  )
}

export function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  )
}