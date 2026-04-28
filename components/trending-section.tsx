'use client'

import { useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Crown } from 'lucide-react'
import { CarCard } from './car-card'
import type { Car } from '@/lib/types'

interface TrendingSectionProps {
  cars: Car[]
}

export function TrendingSection({ cars }: TrendingSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()

  // Cars come pre-curated from the server (fetchFeaturedCars)
  // No client-side sorting needed

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  if (!cars || cars.length === 0) return null

  return (
    <section className="py-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-2 mb-2"
          >
            <Crown className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary uppercase tracking-wider">Featured</span>
          </motion.div>
          <motion.h2
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-3xl font-bold text-gradient"
          >
            Top Picks
          </motion.h2>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-3 rounded-xl glass hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-3 rounded-xl glass hover:bg-secondary transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory"
      >
        {cars.map((car, index) => (
          <div key={car.id} className="flex-shrink-0 w-[340px] snap-start">
            <CarCard car={car} index={index} disableHoverLift />
          </div>
        ))}
      </div>
    </section>
  )
}
