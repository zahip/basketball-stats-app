'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

// RBAC roles
export type UserRole = 'coach' | 'scorer' | 'viewer'

interface AuthContextType {
  user: User | null
  session: Session | null
  role: UserRole | null
  loading: boolean
  signIn: (email: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Get user role from metadata or database
        const userRole = getUserRole(session.user)
        setRole(userRole)
      }
      
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const userRole = getUserRole(session.user)
          setRole(userRole)
        } else {
          setRole(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Determine user role based on email or metadata
  const getUserRole = (user: User): UserRole => {
    // For now, simple role assignment based on email
    // In production, this would come from user metadata or database
    const email = user.email?.toLowerCase() || ''
    
    if (email.includes('coach')) return 'coach'
    if (email.includes('scorer')) return 'scorer'
    return 'viewer'
  }

  const signIn = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const value = {
    user,
    session,
    role,
    loading,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Role-based access control hooks
export function useRequireAuth(requiredRole?: UserRole) {
  const { user, role, loading } = useAuth()
  
  const hasAccess = user && (!requiredRole || role === requiredRole || role === 'coach')
  
  return {
    user,
    role,
    loading,
    hasAccess,
    isAuthenticated: !!user,
  }
}

export function useRoleAccess() {
  const { role } = useAuth()
  
  return {
    isCoach: role === 'coach',
    isScorer: role === 'scorer' || role === 'coach',
    isViewer: !!role,
    canEdit: role === 'coach' || role === 'scorer',
    canManage: role === 'coach',
  }
}