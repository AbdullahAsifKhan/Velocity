'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LayoutGrid, X, Plus, ArrowRight, Zap, Activity, Clock, Gauge, Fuel, DollarSign, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import type { Car } from '@/lib/types'
import { useCarStore } from '@/lib/store'
import { cn, estimatePerformance, estimatePrice } from '@/lib/utils'

const comparisonSpecs = [
  { key: 'price', label: 'Price', icon: DollarSign, format: (v: number) => `$${v.toLocaleString('en-US')}` },
  { key: 'horsepower', label: 'Horsepower', icon: Zap, format: (v: number) => `${v} hp` },
  { key: 'torque', label: 'Torque', icon: Activity, format: (v: number) => `${v} Nm` },
  { key: 'acceleration', label: '0-100 km/h', icon: Clock, format: (v: number) => `${v}s`, reverse: true },
  { key: 'topSpeed', label: 'Top Speed', icon: Gauge, format: (v: number) => `${v} km/h` },
  { key: 'fuelType', label: 'Fuel Type', icon: Fuel, format: (v: string) => v },
  { key: 'engine', label: 'Engine', icon: Activity, format: (v: string) => v },
] as const

export function CompareClient() {
  const { compareList, removeFromCompare, clearCompare } = useCarStore()
  const [selectedCars, setSelectedCars] = useState<Car[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (compareList.length === 0) {
      setSelectedCars([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const controller = new AbortController()
    
    fetch(`/api/cars?ids=${compareList.join(',')}`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then(data => {
        if (Array.isArray(data)) {
          // Keep cars in the order they were added to compareList
          const fetchedCarsMap = new Map(data.map(c => [c.id, c]))
          const orderedCars = compareList
            .map(id => fetchedCarsMap.get(id))
            .filter((car): car is Car => car !== undefined)
          
          setSelectedCars(orderedCars)
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error(err)
          toast.error('Failed to load comparison data')
        }
      })
      .finally(() => {
        setIsLoading(false)
      })

    return () => controller.abort()
  }, [compareList])

  /** Determine which car "wins" for a given spec (higher is better, unless reverse). */
  const getWinner = (key: string, reverse = false): number | null => {
    if (selectedCars.length < 2) return null

    const numericValues: number[] = []

    for (const car of selectedCars) {
      let value: any = car[key as keyof Car]
      if (key === 'price') value = estimatePrice(car)
      else if (key === 'horsepower') value = estimatePerformance(car).hp
      else if (key === 'torque') value = estimatePerformance(car).torque
      else if (key === 'acceleration') value = estimatePerformance(car).accel
      else if (key === 'topSpeed') value = estimatePerformance(car).topSpeed

      if (typeof value === 'number') {
        numericValues.push(value)
      } else {
        return null // Non-numeric spec — no winner
      }
    }

    if (numericValues.length < 2) return null

    const bestValue = reverse ? Math.min(...numericValues) : Math.max(...numericValues)
    return numericValues.indexOf(bestValue)
  }

  return (
    <main className="min-h-screen bg-background">

      <div className="pt-24 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <LayoutGrid className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gradient">Compare</h1>
                <p className="text-muted-foreground flex items-center gap-2">
                  {selectedCars.length} of 4 cars selected
                  {isLoading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                </p>
              </div>
            </motion.div>

            {selectedCars.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={clearCompare}
                className="px-5 py-2.5 rounded-xl glass text-sm font-medium hover:bg-secondary transition-colors"
              >
                Clear All
              </motion.button>
            )}
          </div>

          {/* Comparison Grid */}
          {selectedCars.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Car Headers */}
                <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: `200px repeat(${Math.max(selectedCars.length, 2)}, 1fr)` }}>
                  <div /> {/* Empty cell for spec labels */}
                  {selectedCars.map((car, index) => (
                    <motion.div
                      key={car.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (index % 8) * 0.05 }}
                      className="relative rounded-2xl bg-card border border-border p-4"
                    >
                      <button
                        onClick={() => removeFromCompare(car.id)}
                        className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-secondary transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <Link href={`/car/${car.id}`} className="block">
                        <div className="aspect-[3/2] rounded-xl overflow-hidden mb-4">
                          <Image
                            src={car.image || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=400&q=80"}
                            alt={car.name}
                            width={400}
                            height={250}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs text-primary font-medium uppercase tracking-wider mb-1">
                          {car.brand}
                        </p>
                        <h3 className="font-semibold line-clamp-1 hover:text-primary transition-colors">
                          {car.name}
                        </h3>
                      </Link>
                    </motion.div>
                  ))}

                  {/* Add More Slots */}
                  {Array.from({ length: Math.max(0, 2 - selectedCars.length) }).map((_, i) => (
                    <Link
                      key={`add-${i}`}
                      href="/"
                      className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-colors p-8"
                    >
                      <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Add Car</span>
                    </Link>
                  ))}
                </div>

                {/* Specs Comparison */}
                <div className="space-y-2">
                  {comparisonSpecs.map((spec, specIndex) => {
                    const winner = getWinner(spec.key, 'reverse' in spec ? spec.reverse : false)

                    return (
                      <motion.div
                        key={spec.key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: specIndex * 0.05 }}
                        className="grid gap-4 items-center"
                        style={{ gridTemplateColumns: `200px repeat(${Math.max(selectedCars.length, 2)}, 1fr)` }}
                      >
                        <div className="flex items-center gap-3 py-4">
                          <spec.icon className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm font-medium">{spec.label}</span>
                        </div>

                        {selectedCars.map((car, index) => {
                          let value: any = car[spec.key as keyof Car]
                          if (spec.key === 'price') value = estimatePrice(car)
                          else if (spec.key === 'horsepower') value = estimatePerformance(car).hp
                          else if (spec.key === 'torque') value = estimatePerformance(car).torque
                          else if (spec.key === 'acceleration') value = estimatePerformance(car).accel
                          else if (spec.key === 'topSpeed') value = estimatePerformance(car).topSpeed
                          else if (!value) value = '—'

                          const isWinner = winner === index

                          return (
                            <div
                              key={car.id}
                              className={cn(
                                "py-4 px-4 rounded-xl text-center font-medium transition-colors",
                                isWinner
                                  ? "bg-primary/10 text-primary"
                                  : "bg-card/50"
                              )}
                            >
                              {spec.format(value as never)}
                            </div>
                          )
                        })}

                        {Array.from({ length: Math.max(0, 2 - selectedCars.length) }).map((_, i) => (
                          <div key={`empty-${i}`} className="py-4 px-4 text-center text-muted-foreground">
                            -
                          </div>
                        ))}
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-6">
                <LayoutGrid className="w-12 h-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold mb-3">No cars to compare</h2>
              <p className="text-muted-foreground max-w-md mb-8">
                Add cars to your comparison list by clicking the + button on any car card.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:glow transition-all"
              >
                Browse Cars
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  )
}
