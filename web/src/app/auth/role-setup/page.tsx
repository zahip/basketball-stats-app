'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { RoleSelector } from '@/components/auth/role-selector'
import { useEffect } from 'react'
import { UserRole } from '@/lib/auth-context'

export default function RoleSetupPage() {
  const { user, role, setUserRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect if not authenticated
    if (!user) {
      router.push('/auth/login')
      return
    }
  }, [user, router])

  const handleRoleSelect = (selectedRole: UserRole) => {
    setUserRole(selectedRole)
    // Redirect to games page after role selection
    router.push('/games')
  }

  if (!user) {
    return <div>Redirecting...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <RoleSelector
        currentRole={role}
        onRoleSelect={handleRoleSelect}
        userEmail={user.email || ''}
      />
    </div>
  )
}