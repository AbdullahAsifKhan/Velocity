'use client'

import { motion } from 'framer-motion'
import { Heart, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { CarGrid } from '@/components/car-grid'
import { CompareBar } from '@/components/compare-bar'
import { carMap } from '@/lib/data'
import type { Car } from '@/lib/types'
import { useCarStore } from '@/lib/store'

export default function FavoritesPage() {
  const { favorites } = useCarStore()

  // O(1) lookups via carMap instead of nested .filter()
  const favoriteCars = favorites
    .map((id) => carMap.get(id))
    .filter((car): car is Car => car !== undefined)

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-24 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gradient">Favorites</h1>
                <p className="text-muted-foreground">
                  {favoriteCars.length} {favoriteCars.length === 1 ? 'car' : 'cars'} saved
                </p>
              </div>
            </motion.div>
          </div>

          {/* Content */}
          {favoriteCars.length > 0 ? (
            <CarGrid cars={favoriteCars} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-6">
                <Heart className="w-12 h-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold mb-3">No favorites yet</h2>
              <p className="text-muted-foreground max-w-md mb-8">
                Start exploring our collection and save the cars you love by clicking the heart icon.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:glow transition-all"
              >
                Explore Cars
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      <CompareBar />
    </main>
  )
}
