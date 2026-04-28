'use client'

import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { Heart, Plus, Zap, Fuel, Gauge, Check, Car as CarIcon } from 'lucide-react'
import Link from 'next/link'
import { useCarStore } from '@/lib/store'
import { cn, estimatePerformance, estimatePrice, optimizeImage, cleanCarName } from '@/lib/utils'
import type { Car } from '@/lib/types'

// ── Batched impression tracker (module-level singleton) ──────────────────────
let _impressionBatch: string[] = []
let _impressionTimer: ReturnType<typeof setTimeout> | null = null

function queueImpression(carId: string, sessionId: string) {
  if (_impressionBatch.includes(carId)) return
  _impressionBatch.push(carId)

  if (_impressionTimer) clearTimeout(_impressionTimer)
  _impressionTimer = setTimeout(() => {
    const batch = [..._impressionBatch]
    _impressionBatch = []
    if (batch.length === 0) return

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'impression', carIds: batch, sessionId }),
    }).catch(() => {})
  }, 500) // flush every 500ms
}

function trackClick(carId: string, sessionId: string) {
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'click', carId, sessionId }),
  }).catch(() => {})
}

interface CarCardProps {
  car: Car
  index?: number
  disableHoverLift?: boolean
}

export const CarCard = memo(function CarCard({ car, index = 0, disableHoverLift = false }: CarCardProps) {
  const favorites = useCarStore((s) => s.favorites)
  const compareList = useCarStore((s) => s.compareList)
  const toggleFavorite = useCarStore((s) => s.toggleFavorite)
  const addToCompare = useCarStore((s) => s.addToCompare)
  const removeFromCompare = useCarStore((s) => s.removeFromCompare)
  const sessionId = useCarStore((s) => s.sessionId)

  const [imgError, setImgError] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleImageError = useCallback(() => {
    setImgError(true)
  }, [])

  // ── Impression tracking via IntersectionObserver ───────────────────────────
  useEffect(() => {
    if (!car?.id || !sessionId) return
    const el = cardRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          queueImpression(car.id, sessionId)
          observer.disconnect() // only count once per mount
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [car?.id, sessionId])

  const handleCardClick = useCallback(() => {
    if (car?.id && sessionId) trackClick(car.id, sessionId)
  }, [car?.id, sessionId])

  const favorite = favorites.includes(car.id)
  const inCompare = compareList.includes(car.id)

  const perf = estimatePerformance(car)
  const hasRealHp = car.horsepower != null && car.horsepower > 0
  const hasRealAccel = car.acceleration != null && car.acceleration > 0
  
  const displayImage = car.image || null

  return (
    <div
      ref={cardRef}
      className="group relative animate-fade-in-up"
      style={{ animationDelay: `${(index % 8) * 50}ms` }}
    >
      <div className={cn("relative overflow-hidden rounded-2xl bg-card border border-border/60 hover:border-primary/40", !disableHoverLift && "hover-lift")}>
        {/* Image Container */}
        <Link 
          href={`/car/${car.id}`}
          prefetch={true}
          onClick={handleCardClick}
          className="relative aspect-[4/3] overflow-hidden bg-secondary block"
        >
          {displayImage && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayImage}
              alt={car.name || 'Car'}
              loading={index < 4 ? 'eager' : 'lazy'}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-secondary via-card to-secondary/80">
              <CarIcon className="w-12 h-12 text-muted-foreground/30" />
              <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider font-medium">{car.brand}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />

          {/* Type Badge */}
          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full glass text-xs font-medium tracking-wide">
            {car.type}
          </div>
        </Link>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => toggleFavorite(car.id)}
            className={cn(
              "p-2.5 rounded-full backdrop-blur-xl transition-all active:scale-90",
              favorite ? "bg-red-500 text-white" : "glass hover:bg-secondary"
            )}
          >
            <Heart className={cn("w-4 h-4", favorite && "fill-current")} />
          </button>
          <button
            onClick={() => inCompare ? removeFromCompare(car.id) : addToCompare(car.id)}
            className={cn(
              "p-2.5 rounded-full backdrop-blur-xl transition-all active:scale-90",
              inCompare ? "bg-primary text-primary-foreground" : "glass hover:bg-secondary"
            )}
          >
            {inCompare ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest flex items-center gap-1.5">
                <span>{car.brand}</span>
                {car.year && (
                  <>
                    <span className="opacity-40">•</span>
                    <span>{car.year}</span>
                  </>
                )}
              </p>
              <Link href={`/car/${car.id}`} prefetch={true} onClick={handleCardClick}>
                <h3 className="mt-1.5 text-lg font-semibold leading-tight hover:text-primary transition-colors duration-300 line-clamp-1">
                  {cleanCarName(car.name, car.brand)}
                </h3>
              </Link>
            </div>
            <div className="text-right flex-shrink-0 flex flex-col items-end">
              <p className="text-lg font-bold text-primary tabular-nums leading-none">
                {car.price > 0 ? `$${car.price.toLocaleString('en-US')}` : `$${estimatePrice(car).toLocaleString('en-US')}`}
              </p>
              {car.priceNote && (
                <span className="text-[9px] text-muted-foreground/60 uppercase tracking-widest mt-1">
                  {car.priceNote}
                </span>
              )}
            </div>
          </div>

          {/* Specs Grid */}
          <div className="mt-5 pt-4 border-t border-border/40 grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="w-3.5 h-3.5 text-accent" />
              <span className={cn("text-sm tabular-nums", !hasRealHp && "opacity-50")}>
                {hasRealHp ? `${perf.hp} hp` : '—'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Gauge className="w-3.5 h-3.5 text-primary" />
              <span className={cn("text-sm tabular-nums", !hasRealAccel && "opacity-50")}>
                {hasRealAccel ? `${perf.accel}s` : '—'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Fuel className="w-3.5 h-3.5" />
              <span className="text-sm truncate">{car.fuelType || '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
