'use client'

import { motion } from 'framer-motion'
import { useEffect, useId, useState } from 'react'

interface SpeedometerProps {
  value: number
  maxValue: number
  label: string
  unit: string
}

export function Speedometer({ value, maxValue, label, unit }: SpeedometerProps) {
  const [animatedValue, setAnimatedValue] = useState(0)
  // Unique ID per instance prevents SVG gradient collisions when multiple render
  const gradientId = useId()

  const hasData = value != null && value > 0

  useEffect(() => {
    if (hasData) {
      const timer = setTimeout(() => setAnimatedValue(value), 500)
      return () => clearTimeout(timer)
    }
  }, [value, hasData])

  const percentage = hasData ? (animatedValue / maxValue) * 100 : 0
  const strokeDasharray = 283 // Circumference of circle with r=45
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-40 h-40">
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-secondary"
          />
          {hasData && (
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              initial={{ strokeDashoffset: strokeDasharray }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          )}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {hasData ? (
            <>
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="text-3xl font-bold"
              >
                {animatedValue.toFixed(value < 10 ? 1 : 0)}
              </motion.span>
              <span className="text-sm text-muted-foreground">{unit}</span>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="flex flex-col items-center"
            >
              <span className="text-xl font-semibold text-muted-foreground/50">N/A</span>
              <span className="text-xs text-muted-foreground/40 mt-1">Awaiting data</span>
            </motion.div>
          )}
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
    </div>
  )
}
