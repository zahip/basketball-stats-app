'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  icon?: LucideIcon
  value: string | number
  subtitle?: string
  trend?: {
    value: string
    positive: boolean
  }
  variant?: 'default' | 'home' | 'away' | 'success' | 'warning'
  className?: string
}

export function StatCard({
  title,
  icon: Icon,
  value,
  subtitle,
  trend,
  variant = 'default',
  className,
}: StatCardProps) {
  const gradientClasses = {
    default: 'from-muted/30 to-background',
    home: 'from-home-team/10 to-home-team/5 border-l-4 border-l-home-team',
    away: 'from-away-team/10 to-away-team/5 border-l-4 border-l-away-team',
    success: 'from-success/10 to-success/5 border-l-4 border-l-success',
    warning: 'from-warning/10 to-warning/5 border-l-4 border-l-warning',
  }

  const textColor = {
    default: 'text-foreground',
    home: 'text-home-team',
    away: 'text-away-team',
    success: 'text-success',
    warning: 'text-warning',
  }

  return (
    <Card className={cn('bg-gradient-to-br', gradientClasses[variant], className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex items-baseline justify-between">
          <p className={cn('text-3xl font-bold tracking-tight', textColor[variant])}>
            {value}
          </p>
          {trend && (
            <Badge
              variant={trend.positive ? 'success' : 'destructive'}
              size="sm"
            >
              {trend.value}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

interface StatComparisonProps {
  label: string
  homeValue: number | string
  awayValue: number | string
  homeLabel?: string
  awayLabel?: string
  className?: string
}

export function StatComparison({
  label,
  homeValue,
  awayValue,
  homeLabel = 'Your Team',
  awayLabel = 'Opponent',
  className,
}: StatComparisonProps) {
  const homeNumeric = typeof homeValue === 'string' ? parseFloat(homeValue) : homeValue
  const awayNumeric = typeof awayValue === 'string' ? parseFloat(awayValue) : awayValue
  const isHomeLeading = homeNumeric > awayNumeric

  return (
    <div className={cn('flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors', className)}>
      <div className="flex-1 text-right">
        <span className={cn(
          'text-lg font-bold',
          isHomeLeading ? 'text-home-team' : 'text-muted-foreground'
        )}>
          {homeValue}
        </span>
      </div>
      <div className="flex-1 text-center px-4">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="flex-1 text-left">
        <span className={cn(
          'text-lg font-bold',
          !isHomeLeading && homeNumeric !== awayNumeric ? 'text-away-team' : 'text-muted-foreground'
        )}>
          {awayValue}
        </span>
      </div>
    </div>
  )
}

interface StatProgressProps {
  label: string
  current: number
  max: number
  variant?: 'home' | 'away' | 'success' | 'warning'
  className?: string
}

export function StatProgress({
  label,
  current,
  max,
  variant = 'home',
  className,
}: StatProgressProps) {
  const percentage = Math.min((current / max) * 100, 100)

  const colorClasses = {
    home: 'bg-home-team',
    away: 'bg-away-team',
    success: 'bg-success',
    warning: 'bg-warning',
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {current} / {max}
        </span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('absolute left-0 top-0 h-full transition-all duration-500', colorClasses[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
