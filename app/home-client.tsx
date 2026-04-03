'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Shuffle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { HeroSection } from '@/components/hero-section'
import { CategoryTabs } from '@/components/category-tabs'
import { CarGrid } from '@/components/car-grid'
import { TrendingSection } from '@/components/trending-section'
import { CompareBar } from '@/components/compare-bar'
import type { Car } from '@/lib/types'
import { useCarStore, filterCars } from '@/lib/store'

export function HomeClient({ cars }: { cars: Car[] }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const { searchQuery, selectedType, setSearchQuery, setSelectedType } = useCarStore()

  useEffect(() => {
    // Clear persisted filters so the "All Cars" section always starts clean
    if (searchQuery !== '' || selectedType !== 'All') {
      setSearchQuery('')
      setSelectedType('All')
    }
    setMounted(true)
  }, [])

  const handleSurpriseMe = () => {
    const randomCar = cars[Math.floor(Math.random() * cars.length)]
    router.push(`/car/${randomCar.id}`)
  }

  // Memoize filtered + sorted lists to avoid recomputing on every render
  const filteredCars = useMemo(
    () => (mounted ? filterCars(cars, searchQuery, selectedType) : cars),
    [mounted, searchQuery, selectedType]
  )

  // Find the featured car to pass to hero
  const featuredCar = useMemo(
    () => cars.find((car) => car.featured) || cars[0],
    [cars]
  )

  return (
    <main className="min-h-screen bg-background">

      {/* Hero Section */}
      <HeroSection car={featuredCar} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        {/* Trending Section */}
        <TrendingSection cars={cars} />

        {/* Category Filter & All Cars */}
        <section className="py-24 border-t border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-2xl sm:text-3xl font-bold text-gradient"
              >
                All Cars
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="mt-2 text-muted-foreground"
              >
                Explore our complete collection of {cars.length} vehicles
              </motion.p>
            </div>

            {/* Random Car Button */}
            <button
              onClick={handleSurpriseMe}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass text-sm font-medium hover:bg-secondary transition-all group"
            >
              <Shuffle className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              Surprise Me
            </button>
          </div>

          <div className="mb-8">
            <CategoryTabs />
          </div>

          <CarGrid cars={filteredCars} />
        </section>
      </div>

      {/* Compare Bar */}
      <CompareBar />
    </main>
  )
}
