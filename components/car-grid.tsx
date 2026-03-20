'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { CarCard } from './car-card'
import type { Car } from '@/lib/types'

const INITIAL_COUNT = 12
const LOAD_MORE_COUNT = 12

interface CarGridProps {
  cars: Car[]
  title?: string
  subtitle?: string
}

export function CarGrid({ cars, title, subtitle }: CarGridProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)
  const shouldReduceMotion = useReducedMotion()

  // Reset visible count when the car list changes (e.g., switching category tabs)
  useEffect(() => {
    setVisibleCount(INITIAL_COUNT)
  }, [cars.length])

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + LOAD_MORE_COUNT, cars.length))
  }, [cars.length])

  const visibleCars = cars.slice(0, visibleCount)
  const hasMore = visibleCount < cars.length

  if (cars.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2">No cars found</h3>
        <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
      </motion.div>
    )
  }

  return (
    <section>
      {(title || subtitle) && (
        <div className="mb-8">
          {title && (
            <motion.h2
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-3xl font-bold text-gradient"
            >
              {title}
            </motion.h2>
          )}
          {subtitle && (
            <motion.p
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-2 text-muted-foreground"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {visibleCars.map((car, index) => (
          <CarCard key={car.id} car={car} index={index} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-10">
          <button
            onClick={handleLoadMore}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl glass text-sm font-semibold hover:bg-secondary transition-all group"
          >
            Load More ({cars.length - visibleCount} remaining)
            <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      )}
    </section>
  )
}
