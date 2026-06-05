'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Heart, Plus, Check, Share2, AlertTriangle, Car as CarIcon, Flag, Star, Warehouse } from 'lucide-react'
import { useCarStore } from '@/lib/store'
import type { Car } from '@/lib/types'
import { cn, optimizeImage } from '@/lib/utils'
import { ReportErrorModal } from './report-error-modal'
import { ShareModal } from './share-modal'
import Image from 'next/image'

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

    // Get the updated list of viewed car IDs *after* the update
    const currentViewedCarIds = useCarStore.getState().viewedCarIds

    // Fire tracking event (fire-and-forget)
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'view',
        carId: car.id,
        sessionId,
        viewedCarIds: currentViewedCarIds.slice(-10),
      }),
    }).catch(() => {}) // silently ignore failures
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [car?.id, sessionId])

  const gallery = car.gallery && car.gallery.length > 0 ? car.gallery : (car.image ? [car.image] : [])
  const currentSrc = gallery[selectedImage] || null
  const hasError = imgErrors.has(selectedImage)

  const handleImageError = useCallback((index: number) => {
    setImgErrors(prev => {
      const nextErrors = new Set(prev)
      nextErrors.add(index)
      
      if (selectedImage === index && gallery.length > 1) {
        let nextIndex = (index + 1) % gallery.length
        let attempts = 0
        while (nextErrors.has(nextIndex) && attempts < gallery.length) {
          nextIndex = (nextIndex + 1) % gallery.length
          attempts++
        }
        if (attempts < gallery.length) {
          setSelectedImage(nextIndex)
        }
      }
      return nextErrors
    })
  }, [selectedImage, gallery.length])
  
  return (
    <div className="space-y-4">
      <div className="relative aspect-video w-full rounded-3xl overflow-hidden glass border border-border/40 hover-lift isolate shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedImage}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            {hasError || !currentSrc ? (
              <div className="absolute inset-0 bg-gradient-to-br from-secondary via-card to-secondary/80 flex flex-col items-center justify-center gap-3">
                <CarIcon className="w-16 h-16 text-muted-foreground/40" />
                <span className="text-sm text-muted-foreground/60 font-medium">{car.brand} {car.name}</span>
              </div>
            ) : (
              <>
                <Image
                  src={currentSrc as string}
                  alt={car.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  referrerPolicy="no-referrer"
                  className="object-cover"
                  onError={() => handleImageError(selectedImage)}
                />
                {/* Google API Badge */}
                {car.images?.find((img: any) => img.url === currentSrc && img.source === 'google_images') && (
                  <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-blue-500/20 backdrop-blur-xl border border-blue-500/30 text-xs text-blue-100 font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg z-10">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    Verified Photo
                  </div>
                )}
                {/* Shared Image Badge */}
                {car.images?.find((img: any) => img.url === currentSrc && img.isSharedImage) && (
                  <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-orange-500/20 backdrop-blur-xl border border-orange-500/30 text-xs text-orange-100 font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg z-10" title="This is a representative photo for this model generation, as no variant-specific photo was available.">
                    <span className="text-base leading-none">🖼️📎</span>
                    Generic Generation Photo
                  </div>
                )}
              </>
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
          {gallery.map((img, index) => {
            if (imgErrors.has(index)) return null;
            
            return (
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
                <Image
                  src={img as string}
                  alt={`${car.name} view ${index + 1}`}
                  fill
                  sizes="128px"
                  referrerPolicy="no-referrer"
                  className="object-cover"
                  onError={() => handleImageError(index)}
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function CarActions({ car }: { car: Car }) {
  const favorites = useCarStore((s) => s.favorites)
  const compareList = useCarStore((s) => s.compareList)
  const garage = useCarStore((s) => s.garage)
  const addToCollection = useCarStore((s) => s.addToCollection)
  const toggleFavorite = useCarStore((s) => s.toggleFavorite)
  const addToCompare = useCarStore((s) => s.addToCompare)
  const removeFromCompare = useCarStore((s) => s.removeFromCompare)
  
  const [mounted, setMounted] = useState(false)
  const [showGarageMenu, setShowGarageMenu] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

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
        
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowGarageMenu(!showGarageMenu)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold glass hover:bg-secondary transition-all"
          >
            <Warehouse className="w-5 h-5" />
            Add to Garage
          </motion.button>
          
          <AnimatePresence>
            {showGarageMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 mt-2 w-64 rounded-xl bg-card border border-border shadow-xl overflow-hidden z-20"
              >
                {garage.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto">
                    {garage.map(collection => (
                      <button
                        key={collection.id}
                        onClick={() => {
                          addToCollection(collection.id, car.id)
                          setShowGarageMenu(false)
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-secondary transition-colors border-b border-border/50 last:border-0 flex items-center justify-between"
                      >
                        <span className="truncate pr-2">{collection.name}</span>
                        {collection.carIds.includes(car.id) && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    No collections yet. Create one in your Garage.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsShareModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold glass hover:bg-secondary transition-all"
        >
          <Share2 className="w-5 h-5" />
          Share
        </motion.button>
      </div>

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        car={car} 
      />
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

export function CarRating({ carId, initialRating }: { carId: string, initialRating: number }) {
  const [rating, setRating] = useState(initialRating)
  const [hoverRating, setHoverRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRate = async (value: number) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    
    // Optimistic UI update so it works for the user immediately
    setRating(value)
    
    try {
      const res = await fetch(`/api/cars/${carId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: value }),
      })
      if (res.ok) {
        const data = await res.json()
        setRating(data.rating)
      }
    } catch (error) {
      console.error('Failed to rate:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-end">
      <span className="text-sm text-muted-foreground mb-1">User Rating</span>
      <div 
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 cursor-pointer transition-colors hover:bg-accent/20"
        onMouseLeave={() => setHoverRating(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "w-4 h-4 transition-colors duration-200",
              (hoverRating ? star <= hoverRating : star <= Math.round(rating)) 
                ? "fill-accent text-accent" 
                : "text-muted-foreground/30"
            )}
            onMouseEnter={() => setHoverRating(star)}
            onClick={() => handleRate(star)}
          />
        ))}
        <span className="font-semibold text-accent ml-1 min-w-[24px] text-center">
          {rating > 0 ? rating.toFixed(1) : '—'}
        </span>
      </div>
    </div>
  )
}
