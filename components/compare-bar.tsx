'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { X, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useCarStore } from '@/lib/store'
import type { Car } from '@/lib/types'
import { optimizeImage } from '@/lib/utils'

const FETCH_TIMEOUT_MS = 15_000

export function CompareBar() {
  const [mounted, setMounted] = useState(false)
  const [selectedCars, setSelectedCars] = useState<Car[]>([])
  const [fetchError, setFetchError] = useState(false)
  const { compareList, removeFromCompare, clearCompare } = useCarStore()
  const shouldReduceMotion = useReducedMotion()
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (compareList.length > 0) {
      // Cancel any in-flight request
      abortRef.current?.abort()

      const controller = new AbortController()
      abortRef.current = controller

      // Timeout after FETCH_TIMEOUT_MS
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

      fetch(`/api/cars?ids=${compareList.join(',')}`, {
        signal: controller.signal,
      })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        })
        .then(data => {
          if (Array.isArray(data)) {
            setSelectedCars(data)
            setFetchError(false)
          } else {
            throw new Error('Unexpected response format')
          }
        })
        .catch(err => {
          if (err.name === 'AbortError') return
          console.error('CompareBar fetch failed:', err)
          setFetchError(true)
          toast.error('Failed to load compare cars. Please try again.')
        })
        .finally(() => {
          clearTimeout(timeoutId)
        })
    } else {
      setSelectedCars([])
      setFetchError(false)
    }
  }, [compareList])

  if (!mounted || compareList.length === 0) return null

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
              {fetchError ? (
                <p className="text-sm text-destructive px-2">
                  Could not load cars.{' '}
                  <button
                    onClick={() => {
                      setFetchError(false)
                      // Trigger re-fetch by toggling compareList effect
                      const ids = [...compareList]
                      clearCompare()
                      setTimeout(() => ids.forEach(id => useCarStore.getState().addToCompare(id)), 50)
                    }}
                    className="underline hover:text-foreground transition-colors"
                  >
                    Retry
                  </button>
                </p>
              ) : (
                <>
                  {selectedCars.map((car) => (
                    <motion.div
                      key={car.id}
                      initial={{ scale: shouldReduceMotion ? 1 : 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: shouldReduceMotion ? 1 : 0 }}
                      className="relative flex-shrink-0"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={car.image || ''}
                          alt={car.name}
                          referrerPolicy="no-referrer"
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
                </>
              )}
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
