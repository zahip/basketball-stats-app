'use client'

import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedScoreProps {
  value: number
  className?: string
}

/**
 * AnimatedScore component with spring physics and bounce effect
 * The score smoothly animates to new values with a subtle bounce
 */
export function AnimatedScore({ value, className }: AnimatedScoreProps) {
  // Create spring animation for smooth transitions
  const spring = useSpring(value, {
    stiffness: 300,
    damping: 30,
    mass: 1,
  })

  // Transform to rounded integer for display
  const display = useTransform(spring, (latest) => Math.round(latest))

  // Update spring when value changes
  useEffect(() => {
    spring.set(value)
  }, [value, spring])

  return (
    <motion.span
      key={value} // Force re-mount on change to trigger bounce
      initial={{ scale: 1 }}
      animate={{
        scale: [1, 1.2, 1], // Bounce effect: normal → big → normal
      }}
      transition={{
        duration: 0.4,
        times: [0, 0.5, 1],
        ease: 'easeInOut',
      }}
      className={cn('inline-block tabular-nums', className)}
    >
      <motion.span>{display}</motion.span>
    </motion.span>
  )
}
