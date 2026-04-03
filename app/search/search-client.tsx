'use client'

import { motion } from 'framer-motion'
import { Search, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { CarGrid } from '@/components/car-grid'
import { CompareBar } from '@/components/compare-bar'
import type { Car } from '@/lib/types'

interface SearchClientProps {
  cars: Car[]
  query: string
}

export function SearchClient({ cars, query }: SearchClientProps) {
  return (
    <main className="min-h-screen bg-background pt-28 pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Search className="w-6 h-6 text-primary" />
              <h1 className="text-3xl sm:text-4xl font-bold text-gradient">
                Search Results
              </h1>
            </div>
            {query ? (
              <p className="text-muted-foreground text-lg mt-2">
                {cars.length} {cars.length === 1 ? 'result' : 'results'} for{' '}
                <span className="text-foreground font-semibold">&ldquo;{query}&rdquo;</span>
              </p>
            ) : (
              <p className="text-muted-foreground text-lg mt-2">
                Use the search bar above to find cars, brands, and more.
              </p>
            )}
          </motion.div>
        </div>

        {/* Results */}
        {query ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <CarGrid cars={cars} />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Start Searching</h3>
            <p className="text-muted-foreground max-w-md">
              Press <kbd className="px-2 py-0.5 rounded border border-border text-xs font-mono">Ctrl+K</kbd> to open the search palette,
              or type directly in the search bar.
            </p>
          </motion.div>
        )}
      </div>

      <CompareBar />
    </main>
  )
}
