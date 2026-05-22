'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ChevronRight, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { getFallbackImage, optimizeImage, getLQIP, cn } from '@/lib/utils'
import { CarCard } from '@/components/car-card'
import type { Car } from '@/lib/types'

interface ModelFamily {
  modelName: string
  image: string
  totalVariants: number
  type: string
  singleVariantId?: string
  singleVariantRecord?: Partial<Car>
}

interface ModelGridProps {
  brand: string
  models: ModelFamily[]
}

export function ModelGrid({ brand, models }: ModelGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {models.map((model, i) => {
        const uniqueKey = `${model.modelName}-${i}`
        
        if (model.totalVariants === 1 && model.singleVariantRecord) {
          return <CarCard key={uniqueKey} car={model.singleVariantRecord as Car} />
        }

        const rawImageUrl = model.image || getFallbackImage({ name: model.modelName })
        const imageUrl = optimizeImage(rawImageUrl)
        
        return (
          <ModelCard key={uniqueKey} model={model} brand={brand} imageUrl={imageUrl} index={i} />
        )
      })}
    </div>
  )
}

function ModelCard({ model, brand, imageUrl, index }: { model: ModelFamily; brand: string; imageUrl: string | null; index: number }) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const lqip = getLQIP(imageUrl)
  const handleLoad = useCallback(() => setImgLoaded(true), [])
  const handleError = useCallback(() => setImgError(true), [])

  return (
    <Link
      href={
        model.totalVariants === 1 && model.singleVariantId
          ? `/car/${model.singleVariantId}`
          : `/brands/${encodeURIComponent(brand)}/${encodeURIComponent(model.modelName)}`
      }
      className="group relative flex flex-col bg-card rounded-2xl overflow-hidden border border-border/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 card-contain animate-fade-in-up"
      style={{ animationDelay: `${(index % 8) * 50}ms` }}
    >
      {/* Image Container */}
      <div className="aspect-[4/3] bg-secondary relative overflow-hidden">
        {imageUrl && !imgError ? (
          <>
            {lqip && !imgLoaded && (
              <div
                className={cn("absolute inset-0 lqip-bg z-[1]", imgLoaded && "hidden-lqip")}
                style={{ backgroundImage: `url(${lqip})` }}
              />
            )}
            {!lqip && !imgLoaded && (
              <div className="absolute inset-0 shimmer z-[1]" />
            )}
            <Image
              src={imageUrl as string}
              alt={model.modelName}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              unoptimized={true}
              referrerPolicy="no-referrer"
              className={cn(
                "object-cover transition-transform duration-700 group-hover:scale-105 z-[2] relative",
                "img-reveal",
                imgLoaded && "loaded"
              )}
              onLoad={handleLoad}
              onError={handleError}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <ImageIcon className="w-8 h-8 opacity-20" />
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity z-[3]" />
        
        {/* Type Badge */}
        <div className="absolute top-4 left-4 z-[4]">
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground bg-primary/90 backdrop-blur-md rounded-full shadow-lg">
            {model.type}
          </span>
        </div>
      </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col justify-end bg-gradient-to-br from-card to-secondary/20">
              <div className="flex items-end justify-between">
                <div>
                  <h3 className="text-xl font-bold tracking-tight mb-1 group-hover:text-primary transition-colors">
                    {model.modelName}
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium">
                    {model.totalVariants === 1 ? 'View Vehicle' : `${model.totalVariants} Variants`}
                  </p>
                </div>
                
                <div className="w-8 h-8 rounded-full bg-secondary/80 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-sm">
                  <ChevronRight className="w-4 h-4 ml-0.5" />
                </div>
              </div>
            </div>
          </Link>
  )
}
