'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Heart, Plus, Check, Share2, AlertTriangle, Car as CarIcon, Flag } from 'lucide-react'
import { useCarStore } from '@/lib/store'
import type { Car } from '@/lib/types'
import { cn, optimizeImage } from '@/lib/utils'
import { ReportErrorModal } from './report-error-modal'

export function CarGallery({ car }: { car: Car }) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set())

  // ── Behavioral tracking: record this car view ─────────────────────────────
  const addViewedCar = useCarStore((s) => s.addViewedCar)
  const sessionId = useCarStore((s) => s.sessionId)
  const viewedCarIds = useCarStore((s) => s.viewedCarIds)

  useEffect(() => {
    if (!car?.id || !sessionId) return

    // Record in local session state
    addViewedCar(car.id, car.type || 'Unknown', car.brand || 'Unknown')

    // Fire tracking event (fire-and-forget)
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'view',
        carId: car.id,
        sessionId,
        viewedCarIds: viewedCarIds.slice(-10),
      }),
    }).catch(() => {}) // silently ignore failures
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [car?.id])

  const gallery = car.gallery && car.gallery.length > 0 ? car.gallery : (car.image ? [car.image] : [])
  const currentSrc = gallery[selectedImage] || null
  const hasError = imgErrors.has(selectedImage)

  const handleImageError = useCallback((index: number) => {
    setImgErrors(prev => new Set(prev).add(index))
  }, [])
  
  return (
    <div className="space-y-4">
      <div className="relative aspect-video w-full rounded-3xl overflow-hidden glass border border-border/40 hover-lift isolate shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedImage}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute inset-0"
          >
            {hasError || !currentSrc ? (
              <div className="absolute inset-0 bg-gradient-to-br from-secondary via-card to-secondary/80 flex flex-col items-center justify-center gap-3">
                <CarIcon className="w-16 h-16 text-muted-foreground/40" />
                <span className="text-sm text-muted-foreground/60 font-medium">{car.brand} {car.name}</span>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentSrc || ''}
                alt={car.name}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover"
                onError={() => handleImageError(selectedImage)}
              />
            )}
          </motion.div>
        </AnimatePresence>
        
        {gallery.length > 1 && (
          <>
            <button
              onClick={() => setSelectedImage((prev) => (prev > 0 ? prev - 1 : gallery.length - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full glass hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedImage((prev) => (prev < gallery.length - 1 ? prev + 1 : 0))}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full glass hover:bg-secondary transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {gallery.length > 1 && (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x mask-fade-edges">
          {gallery.map((img, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={cn(
                "relative flex-shrink-0 w-32 aspect-video rounded-xl overflow-hidden border-2 transition-all",
                selectedImage === index
                  ? "border-primary glow-sm"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              {imgErrors.has(index) ? (
                <div className="absolute inset-0 bg-secondary flex items-center justify-center">
                  <CarIcon className="w-6 h-6 text-muted-foreground/40" />
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img || ''}
                  alt={`${car.name} view ${index + 1}`}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={() => handleImageError(index)}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function CarActions({ car }: { car: Car }) {
  const favorites = useCarStore((s) => s.favorites)
  const compareList = useCarStore((s) => s.compareList)
  const toggleFavorite = useCarStore((s) => s.toggleFavorite)
  const addToCompare = useCarStore((s) => s.addToCompare)
  const removeFromCompare = useCarStore((s) => s.removeFromCompare)
  
  const [mounted, setMounted] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const favorite = mounted && favorites.includes(car.id)
  const inCompare = mounted && compareList.includes(car.id)

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-8">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => toggleFavorite(car.id)}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all",
            favorite ? "bg-red-500 text-white" : "glass hover:bg-secondary"
          )}
        >
          <Heart className={cn("w-5 h-5", favorite && "fill-current")} />
          {favorite ? 'Saved' : 'Save'}
        </motion.button>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => inCompare ? removeFromCompare(car.id) : addToCompare(car.id)}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all",
            inCompare ? "bg-primary text-primary-foreground" : "glass hover:bg-secondary"
          )}
        >
          {inCompare ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {inCompare ? 'In Compare' : 'Compare'}
        </motion.button>
        
        <button className="p-3 rounded-xl glass hover:bg-secondary transition-colors">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </>
  )
}

export function ReportIssueButton({ car }: { car: Car }) {
  const [reportOpen, setReportOpen] = useState(false)

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setReportOpen(true)}
        className="flex flex-shrink-0 items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 hover:bg-orange-500/20 transition-all font-medium"
        title="Report incorrect data"
      >
        <Flag className="w-3.5 h-3.5" />
        <span className="text-sm">Report Issue</span>
      </motion.button>

      <ReportErrorModal
        carId={car.id}
        carName={car.name}
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </>
  )
}


