'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ShotMapOverlayProps {
  open: boolean
  onClose: () => void
  onSelectLocation: (x: number, y: number) => void
  shotType: 'TWO_PT' | 'THREE_PT'
  className?: string
}

/**
 * ShotMapOverlay - Fullscreen overlay with basketball half-court diagram
 * User taps court location to record shot coordinates
 */
export function ShotMapOverlay({ open, onClose, onSelectLocation, shotType, className }: ShotMapOverlayProps) {
  const svgRef = React.useRef<SVGSVGElement>(null)

  const handleCourtClick = React.useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current) return

      const svg = svgRef.current
      const rect = svg.getBoundingClientRect()

      // Get click coordinates relative to SVG
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Convert to percentage (0-100)
      const xPercent = Math.round((x / rect.width) * 100)
      const yPercent = Math.round((y / rect.height) * 100)

      // Clamp to valid range
      const clampedX = Math.max(0, Math.min(100, xPercent))
      const clampedY = Math.max(0, Math.min(100, yPercent))

      onSelectLocation(clampedX, clampedY)
    },
    [onSelectLocation]
  )

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'fixed inset-0 z-50 bg-slate-950/98 flex flex-col items-center justify-center',
            className
          )}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-slate-200">
              Select Shot Location
              <span className="ml-2 text-sm text-slate-400">
                ({shotType === 'TWO_PT' ? '2PT' : '3PT'})
              </span>
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Court SVG */}
          <div className="flex-1 flex items-center justify-center p-4 pt-20">
            <svg
              ref={svgRef}
              viewBox="0 0 500 470"
              className="w-full h-full max-w-2xl cursor-crosshair"
              onClick={handleCourtClick}
            >
              {/* Court Background */}
              <rect x="0" y="0" width="500" height="470" fill="#1e293b" stroke="#334155" strokeWidth="3" />

              {/* Baseline */}
              <line x1="0" y1="470" x2="500" y2="470" stroke="#475569" strokeWidth="2" />

              {/* Sidelines */}
              <line x1="0" y1="0" x2="0" y2="470" stroke="#475569" strokeWidth="2" />
              <line x1="500" y1="0" x2="500" y2="470" stroke="#475569" strokeWidth="2" />

              {/* Free Throw Lane (Paint) */}
              <rect x="170" y="330" width="160" height="140" fill="none" stroke="#475569" strokeWidth="2" />

              {/* Free Throw Circle */}
              <circle cx="250" cy="330" r="60" fill="none" stroke="#475569" strokeWidth="2" />

              {/* Free Throw Line (top of key) */}
              <line x1="170" y1="330" x2="330" y2="330" stroke="#475569" strokeWidth="2" />

              {/* Three-Point Arc */}
              <path
                d="M 30 470 Q 30 200, 250 130 Q 470 200, 470 470"
                fill="none"
                stroke={shotType === 'THREE_PT' ? '#f59e0b' : '#475569'}
                strokeWidth={shotType === 'THREE_PT' ? '3' : '2'}
                strokeDasharray={shotType === 'THREE_PT' ? '0' : '5,5'}
              />

              {/* Three-Point Corner Lines */}
              <line
                x1="30"
                y1="330"
                x2="30"
                y2="470"
                stroke={shotType === 'THREE_PT' ? '#f59e0b' : '#475569'}
                strokeWidth={shotType === 'THREE_PT' ? '3' : '2'}
              />
              <line
                x1="470"
                y1="330"
                x2="470"
                y2="470"
                stroke={shotType === 'THREE_PT' ? '#f59e0b' : '#475569'}
                strokeWidth={shotType === 'THREE_PT' ? '3' : '2'}
              />

              {/* Rim/Basket */}
              <circle cx="250" cy="470" r="15" fill="none" stroke="#f97316" strokeWidth="3" />

              {/* Backboard */}
              <line x1="190" y1="470" x2="310" y2="470" stroke="#475569" strokeWidth="4" />

              {/* Center Hash Mark (top of key) */}
              <circle cx="250" cy="330" r="3" fill="#475569" />

              {/* Grid Overlay for visual guidance (subtle) */}
              <line x1="250" y1="0" x2="250" y2="470" stroke="#334155" strokeWidth="1" strokeDasharray="5,10" opacity="0.3" />
              <line x1="0" y1="235" x2="500" y2="235" stroke="#334155" strokeWidth="1" strokeDasharray="5,10" opacity="0.3" />

              {/* Instruction Text */}
              <text
                x="250"
                y="30"
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="16"
                fontWeight="600"
                className="pointer-events-none"
              >
                Tap anywhere on the court
              </text>
            </svg>
          </div>

          {/* Footer Help Text */}
          <div className="absolute bottom-0 left-0 right-0 h-16 flex items-center justify-center border-t border-slate-800">
            <p className="text-sm text-slate-400">
              Tap the court to record shot location, or press close to cancel
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
