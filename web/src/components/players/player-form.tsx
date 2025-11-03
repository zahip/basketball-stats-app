'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Player } from '@/lib/stores/players-store'

interface PlayerFormProps {
  onSubmit: (player: Omit<Player, 'id'>) => void
  onCancel?: () => void
  initialData?: Partial<Player>
  title?: string
}

export function PlayerForm({ onSubmit, onCancel, initialData, title = "Add New Player" }: PlayerFormProps) {
  const [formData, setFormData] = useState({
    number: initialData?.number || '',
    name: initialData?.name || '',
    position: initialData?.position || 'PG' as const,
    height: initialData?.height || '',
    weight: initialData?.weight || '',
    isActive: initialData?.isActive ?? true,
  })

  const positions = [
    { value: 'PG', label: 'Point Guard (PG)' },
    { value: 'SG', label: 'Shooting Guard (SG)' },
    { value: 'SF', label: 'Small Forward (SF)' },
    { value: 'PF', label: 'Power Forward (PF)' },
    { value: 'C', label: 'Center (C)' },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.number) {
      alert('Please fill in name and number')
      return
    }

    onSubmit({
      ...formData,
      number: Number(formData.number),
    })

    // Reset form
    setFormData({
      number: '',
      name: '',
      position: 'PG',
      height: '',
      weight: '',
      isActive: true,
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Enter player information for the roster
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Player Number */}
          <div>
            <Label htmlFor="number">Jersey Number *</Label>
            <Input
              id="number"
              type="number"
              min="0"
              max="99"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              placeholder="23"
              required
            />
          </div>

          {/* Player Name */}
          <div>
            <Label htmlFor="name">Player Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="LeBron James"
              required
            />
          </div>

          {/* Position */}
          <div>
            <Label htmlFor="position">Position</Label>
            <select
              id="position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value as Player['position'] })}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {positions.map((pos) => (
                <option key={pos.value} value={pos.value}>
                  {pos.label}
                </option>
              ))}
            </select>
          </div>


          {/* Optional Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                placeholder="6'8&quot;"
              />
            </div>
            <div>
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="250 lbs"
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="isActive">Active Player</Label>
            {formData.isActive ? (
              <Badge className="bg-green-500">Active</Badge>
            ) : (
              <Badge variant="secondary">Inactive</Badge>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">
              Add Player
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}