'use client'

import { useEffect, useState, memo, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Heart, Plus, Zap, Fuel, Gauge, Check, Car as CarIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCarStore } from '@/lib/store'
import type { Car } from '@/lib/types'
import { cn } from '@/lib/utils'
import { isUnoptimizedUrl } from '@/lib/image'

interface CarCardProps {
  car: Car
  index?: number
}

export const CarCard = memo(function CarCard({ car, index = 0 }: CarCardProps) {
  const favorites = useCarStore((s) => s.favorites)
  const compareList = useCarStore((s) => s.compareList)
  const toggleFavorite = useCarStore((s) => s.toggleFavorite)
  const addToCompare = useCarStore((s) => s.addToCompare)
  const removeFromCompare = useCarStore((s) => s.removeFromCompare)
  const shouldReduceMotion = useReducedMotion()

  const [mounted, setMounted] = useState(false)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleImageError = useCallback(() => {
    setImgError(true)
  }, [])

  // Derive favorite/compare status from state arrays for proper reactivity
  const favorite = mounted && favorites.includes(car.id)
  const inCompare = mounted && compareList.includes(car.id)

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.5, delay: shouldReduceMotion ? 0 : (index % 8) * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
    >
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border/60 hover-lift hover:border-primary/40">
        {/* Image Container */}
        <Link href={`/car/${car.id}`} className="block relative aspect-[3/2] overflow-hidden">
          {imgError ? (
            /* Graceful fallback when image fails to load */
            <div className="absolute inset-0 bg-gradient-to-br from-secondary via-card to-secondary/80 flex flex-col items-center justify-center gap-2">
              <CarIcon className="w-12 h-12 text-muted-foreground/40" />
              <span className="text-xs text-muted-foreground/60 font-medium">{car.brand}</span>
            </div>
          ) : (
            <Image
              src={car.image}
              alt={car.name}
              fill
              loading="lazy"
              unoptimized={isUnoptimizedUrl(car.image)}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={handleImageError}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />

          {/* Type Badge */}
          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full glass text-xs font-medium tracking-wide">
            {car.type}
          </div>
        </Link>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => toggleFavorite(car.id)}
            className={cn(
              "p-2.5 rounded-full backdrop-blur-xl transition-all",
              favorite ? "bg-red-500 text-white" : "glass hover:bg-secondary"
            )}
          >
            <Heart className={cn("w-4 h-4", favorite && "fill-current")} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => inCompare ? removeFromCompare(car.id) : addToCompare(car.id)}
            className={cn(
              "p-2.5 rounded-full backdrop-blur-xl transition-all",
              inCompare ? "bg-primary text-primary-foreground" : "glass hover:bg-secondary"
            )}
          >
            {inCompare ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </motion.button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                {car.brand}
              </p>
              <Link href={`/car/${car.id}`}>
                <h3 className="mt-1.5 text-lg font-semibold leading-tight hover:text-primary transition-colors duration-300 line-clamp-1">
                  {car.name}
                </h3>
              </Link>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-lg font-bold text-primary tabular-nums">
                ${car.price.toLocaleString('en-US')}
              </p>
            </div>
          </div>

          {/* Specs Grid */}
          <div className="mt-5 pt-4 border-t border-border/40 grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="w-3.5 h-3.5 text-accent" />
              <span className="text-sm tabular-nums">{car.horsepower} hp</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Gauge className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm tabular-nums">{car.acceleration}s</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Fuel className="w-3.5 h-3.5" />
              <span className="text-sm truncate">{car.fuelType}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
})
