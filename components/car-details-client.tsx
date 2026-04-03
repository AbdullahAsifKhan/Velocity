'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Heart, Plus, Check, Share2, Car as CarIcon } from 'lucide-react'
import { useCarStore } from '@/lib/store'
import type { Car } from '@/lib/types'
import { cn } from '@/lib/utils'
import { isUnoptimizedUrl } from '@/lib/image'

export function CarGallery({ car }: { car: Car }) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set())

  const handleImageError = useCallback((index: number) => {
    setImgErrors(prev => new Set(prev).add(index))
  }, [])

  const gallery = car.gallery ?? []
  const currentSrc = gallery[selectedImage] || car.image
  const hasError = imgErrors.has(selectedImage)
  
  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative aspect-video rounded-2xl overflow-hidden bg-card"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {hasError ? (
              <div className="absolute inset-0 bg-gradient-to-br from-secondary via-card to-secondary/80 flex flex-col items-center justify-center gap-3">
                <CarIcon className="w-16 h-16 text-muted-foreground/40" />
                <span className="text-sm text-muted-foreground/60 font-medium">{car.brand} {car.name}</span>
              </div>
            ) : (
              <Image
                src={currentSrc}
                alt={car.name}
                fill
                unoptimized={isUnoptimizedUrl(currentSrc)}
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
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
      </motion.div>

      {gallery.length > 1 && (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
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
                <Image
                  src={img}
                  alt={`${car.name} view ${index + 1}`}
                  fill
                  unoptimized={isUnoptimizedUrl(img)}
                  className="object-cover"
                  sizes="96px"
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
  useEffect(() => {
    setMounted(true)
  }, [])

  const favorite = mounted && favorites.includes(car.id)
  const inCompare = mounted && compareList.includes(car.id)

  return (
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
  )
}
