'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useCarStore } from '@/lib/store'
import { types } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Car, Truck, Zap, Crown, Gauge } from 'lucide-react'

const typeIcons: Record<string, typeof Gauge> = {
  All: Gauge,
  SUV: Truck,
  Sedan: Car,
  Sports: Gauge,
  Electric: Zap,
  Luxury: Crown,
  Hatchback: Car,
  Pickup: Truck,
}

export function CategoryTabs() {
  const [mounted, setMounted] = useState(false)
  const { selectedType, setSelectedType } = useCarStore()
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="h-12 bg-secondary/50 rounded-xl" />

  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex items-center gap-2 p-1 min-w-max">
        {types.map((type) => {
          const Icon = typeIcons[type] || Gauge
          const isActive = selectedType === type

          return (
            <motion.button
              key={type}
              onClick={() => setSelectedType(type)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "relative flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all duration-300",
                isActive
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary rounded-xl"
                  transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className={cn("relative z-10 w-4 h-4", isActive && "text-primary-foreground")} />
              <span className="relative z-10">{type}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
