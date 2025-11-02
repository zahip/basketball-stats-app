'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserRole } from '@/lib/auth-context'

interface RoleSelectorProps {
  currentRole: UserRole | null
  onRoleSelect: (role: UserRole) => void
  userEmail: string
}

export function RoleSelector({ currentRole, onRoleSelect, userEmail }: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole || 'viewer')

  const roles = [
    {
      role: 'coach' as UserRole,
      title: '👨‍💼 Coach',
      description: 'Full access - manage players, games, and settings',
      color: 'bg-blue-600 hover:bg-blue-700',
      permissions: ['Create games', 'Manage players', 'Record events', 'View all data']
    },
    {
      role: 'scorer' as UserRole,
      title: '📝 Scorer',
      description: 'Record events, update scores, manage live games',
      color: 'bg-green-600 hover:bg-green-700',
      permissions: ['Record game events', 'Update scores', 'View live games']
    },
    {
      role: 'viewer' as UserRole,
      title: '👀 Viewer',
      description: 'Watch live updates, view statistics and reports',
      color: 'bg-gray-600 hover:bg-gray-700',
      permissions: ['View games', 'See live updates', 'Access reports']
    }
  ]

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    onRoleSelect(role)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle>🎯 Select Your Role</CardTitle>
        <CardDescription>
          Choose your access level for <strong>{userEmail}</strong>
        </CardDescription>
        {currentRole && (
          <Badge variant="outline" className="w-fit mx-auto">
            Current: {roles.find(r => r.role === currentRole)?.title}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {roles.map((roleInfo) => (
            <div
              key={roleInfo.role}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedRole === roleInfo.role
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-primary/50'
              }`}
              onClick={() => handleRoleSelect(roleInfo.role)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{roleInfo.title}</h3>
                    {selectedRole === roleInfo.role && (
                      <Badge className="bg-primary">Selected</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {roleInfo.description}
                  </p>
                  <div className="space-y-1">
                    {roleInfo.permissions.map((permission, index) => (
                      <div key={index} className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="text-green-500">✓</span>
                        {permission}
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  variant={selectedRole === roleInfo.role ? 'default' : 'outline'}
                  size="sm"
                  className={selectedRole === roleInfo.role ? '' : roleInfo.color}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRoleSelect(roleInfo.role)
                  }}
                >
                  {selectedRole === roleInfo.role ? 'Selected' : 'Select'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
          <strong>💡 Note:</strong> In a production app, roles would be assigned by administrators. 
          This selector is for testing purposes.
        </div>
      </CardContent>
    </Card>
  )
}