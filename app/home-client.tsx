'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Shuffle } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { HeroSection } from '@/components/hero-section'
import { CategoryTabs } from '@/components/category-tabs'
import { CarGrid } from '@/components/car-grid'
import { CarGridSkeleton } from '@/components/loading-skeleton'
import type { Car } from '@/lib/types'
import { useCarStore } from '@/lib/store'
import { Loader2 } from 'lucide-react'
import { loadMoreCars } from './actions'

// Heavy components loaded after initial render
const TrendingSection = dynamic(() => import('@/components/trending-section').then(m => ({ default: m.TrendingSection })), { ssr: true })
const CompareBar = dynamic(() => import('@/components/compare-bar').then(m => ({ default: m.CompareBar })), { ssr: false })

export function HomeClient({ 
  initialCars, 
  totalPages, 
  currentPage, 
  totalCars,
  carOfTheDay,
  featuredCars,
}: { 
  initialCars: Car[], 
  totalPages: number, 
  currentPage: number, 
  totalCars: number,
  carOfTheDay: Car | null,
  featuredCars: Car[],
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const { searchQuery, setSearchQuery } = useCarStore()
  
  const [cars, setCars] = useState(initialCars)
  const [page, setPage] = useState(currentPage)
  const [loadingMore, setLoadingMore] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Reset accumulated cars when initialCars changes (e.g. category filter changes)
  useEffect(() => {
    setCars(initialCars)
    setPage(1)
  }, [initialCars])

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSurpriseMe = () => {
    const randomCar = cars[Math.floor(Math.random() * cars.length)]
    if (randomCar) router.push(`/car/${randomCar.id}`)
  }

  // Use server-provided car of the day, or fall back to first car with image
  const featuredCar = useMemo(
    () => carOfTheDay || cars.find((car) => car.image) || cars[0],
    [carOfTheDay, cars]
  )

  const viewedTypes = useCarStore((s) => s.viewedTypes)
  const viewedSegments = useCarStore((s) => s.viewedSegments)

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || page >= totalPages) return
    setLoadingMore(true)
    const nextPage = page + 1
    try {
      const type = searchParams.get('type') || 'All'
      // Pass session context for personalized ranking on subsequent pages
      const sessionCtx = (viewedTypes.length > 0 || viewedSegments.length > 0)
        ? { types: viewedTypes, segments: viewedSegments }
        : undefined
      const newCars = await loadMoreCars(nextPage, '', type, sessionCtx)
      setCars(prev => {
        // Prevent duplicates in case of race conditions
        const existingIds = new Set(prev.map(c => c.id))
        const uniqueNewCars = (newCars as Car[]).filter(c => !existingIds.has(c.id))
        return [...prev, ...uniqueNewCars]
      })
      setPage(nextPage)
    } catch (error) {
      console.error('Failed to load more cars', error)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, page, totalPages, searchParams, viewedTypes, viewedSegments])

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    if (loadingMore || page >= totalPages) return

    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const target = entries[0]
      if (target.isIntersecting) {
        handleLoadMore()
      }
    }

    // Set up observer with 600px margin so it starts fetching well before the user reaches bottom
    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '600px',
      threshold: 0
    })

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [handleLoadMore, loadingMore, page, totalPages])

  return (
    <main className="min-h-screen bg-background">

      {/* Hero Section */}
      {featuredCar && <HeroSection car={featuredCar} />}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Featured Section — server-curated best cars */}
        <TrendingSection cars={featuredCars} />

        <section className="section-gap border-t border-border/30">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-2xl sm:text-3xl font-bold text-gradient"
              >
                All Cars
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="mt-3 text-muted-foreground text-sm sm:text-base"
              >
                Explore our complete collection of {totalCars.toLocaleString()} vehicles
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

          <CarGrid cars={cars} />

          {/* Infinite Scroll Trigger & Skeleton Loading */}
          {page < totalPages && (
            <div ref={loadMoreRef} className="mt-12">
              {loadingMore ? (
                <CarGridSkeleton count={4} />
              ) : (
                <div className="flex justify-center py-8">
                  <button
                    onClick={handleLoadMore}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass hover:bg-secondary border border-border/40 font-medium transition-all"
                  >
                    Load More
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Compare Bar */}
      <CompareBar />
    </main>
  )
}
