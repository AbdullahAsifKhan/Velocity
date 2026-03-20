'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { X, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCarStore } from '@/lib/store'
import { carMap } from '@/lib/data'
import type { Car } from '@/lib/types'
import { isUnoptimizedUrl } from '@/lib/image'

export function CompareBar() {
  const [mounted, setMounted] = useState(false)
  const { compareList, removeFromCompare, clearCompare } = useCarStore()
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Use carMap for O(1) lookups and proper type narrowing (no non-null assertions)
  const selectedCars = compareList
    .map((id) => carMap.get(id))
    .filter((car): car is Car => car !== undefined)

  if (!mounted || selectedCars.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: shouldReduceMotion ? 0 : 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: shouldReduceMotion ? 0 : 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-40 p-4"
      >
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
              {selectedCars.map((car) => (
                <motion.div
                  key={car.id}
                  initial={{ scale: shouldReduceMotion ? 1 : 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: shouldReduceMotion ? 1 : 0 }}
                  className="relative flex-shrink-0"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-border">
                    <Image
                      src={car.image}
                      alt={car.name}
                      width={64}
                      height={64}
                      unoptimized={isUnoptimizedUrl(car.image)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => removeFromCompare(car.id)}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: 4 - selectedCars.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex-shrink-0"
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={clearCompare}
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Clear
              </button>
              <Link
                href="/compare"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:glow transition-all"
              >
                Compare
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
