'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, ArrowRight, Zap, Tag, Loader2, Car as CarIcon } from 'lucide-react'
import { BRAND_SEGMENTS } from '@/lib/constants'
import { estimatePrice, cleanCarName, optimizeThumb } from '@/lib/utils'
import { Command } from 'cmdk'
import * as Dialog from '@radix-ui/react-dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import useSWR from 'swr'
import { motion, AnimatePresence } from 'framer-motion'

const POPULAR_BRANDS = ['Porsche', 'Ferrari', 'BMW', 'Mercedes-Benz', 'Lamborghini', 'Tesla', 'Audi', 'McLaren']
const QUICK_SEARCHES = [
  { label: 'Sports cars', query: 'Sports' },
  { label: 'Electric cars', query: 'Electric' },
  { label: 'SUVs', query: 'SUV' },
  { label: 'Luxury', query: 'Luxury' }
]

interface SearchResult {
  id: string
  name: string
  brand: string
  type: string
  price: number
  image: string
  horsepower?: number
  year?: number
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Fetch full lightweight search index when modal opens
  const { data: searchIndex, isLoading } = useSWR<SearchResult[]>(
    isOpen ? '/api/search/index' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000, // 1 hour
    }
  )

  // Reset query on open/close and focus input when opened
  useEffect(() => {
    if (!isOpen) {
      setQuery('')
    } else {
      // Slight delay to allow dialog animation to complete before focusing
      const t = setTimeout(() => inputRef.current?.focus(), 60)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  const navigateTo = useCallback((car: SearchResult) => {
    onClose()
    router.push(`/car/${car.id}`)
  }, [router, onClose])

  const showAllResults = useCallback((q: string) => {
    onClose()
    const qLower = q.trim().toLowerCase()
    
    // Flatten all canonical brand names from BRAND_SEGMENTS
    const canonicalBrands = Object.values(BRAND_SEGMENTS).flat()
    
    // Additional aliases
    let matchBrand = canonicalBrands.find(b => b.toLowerCase() === qLower)
    
    // Handle common aliases manually
    if (!matchBrand && qLower === 'mercedes') {
      matchBrand = 'Mercedes-Benz'
    }
    
    if (matchBrand) {
      router.push(`/brands/${matchBrand}`)
    } else {
      router.push(`/search?q=${encodeURIComponent(q)}`)
    }
  }, [router, onClose])

  // Limit results to prevent rendering 5000+ DOM nodes and freezing the browser
  const filteredCars = useMemo(() => {
    if (!query.trim() || !searchIndex) return []
    const s = query.toLowerCase()
    return searchIndex
      .filter(car => `${car.name} ${car.brand} ${car.type}`.toLowerCase().includes(s))
      .slice(0, 50)
  }, [query, searchIndex])

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <Dialog.Overlay asChild forceMount>
                <motion.div
                  key="search-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-md"
                />
              </Dialog.Overlay>

              {/* Panel */}
              <Dialog.Content asChild forceMount aria-describedby={undefined}>
                <motion.div
                  key="search-panel"
                  initial={{ opacity: 0, scale: 0.96, y: -12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -12 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed inset-0 z-[71] flex items-start justify-center pt-[12vh] px-4 pointer-events-none"
                >
                  <VisuallyHidden asChild>
                    <Dialog.Title>Search cars</Dialog.Title>
                  </VisuallyHidden>

                  <Command
                    shouldFilter={false}
                    className="w-full max-w-2xl bg-card rounded-2xl border border-border/60 shadow-2xl shadow-black/40 overflow-hidden pointer-events-auto"
                  >
                    {/* Input row */}
                    <div className="flex items-center gap-3 px-4 py-4 border-b border-border/40" cmdk-input-wrapper="">
                      {isLoading && !searchIndex ? (
                        <Loader2 className="w-5 h-5 text-primary flex-shrink-0 animate-spin" />
                      ) : (
                        <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <Command.Input
                        ref={inputRef}
                        value={query}
                        onValueChange={setQuery}
                        placeholder="Search cars, brands, types..."
                        className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground outline-none border-none focus:ring-0 caret-primary"
                      />
                      {query && (
                        <button
                          onClick={() => setQuery('')}
                          className="p-1.5 mr-1 rounded-full hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground"
                          title="Clear search"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={onClose}
                        className="flex items-center justify-center p-2 rounded-full hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all sm:hidden"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <button
                        onClick={onClose}
                        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-border rounded-lg transition-all"
                      >
                        Close
                        <kbd className="font-sans opacity-60">Esc</kbd>
                      </button>
                    </div>

                    <Command.List className="max-h-[60vh] overflow-y-auto overflow-x-hidden p-2 cmdk-list">
                      {/* Custom Empty State */}
                      {query.trim() && !isLoading && filteredCars.length === 0 && (
                        <div className="py-12 text-center text-muted-foreground text-sm">
                          No cars found for &ldquo;{query}&rdquo;
                        </div>
                      )}

                      {/* Default state: brand pills + quick searches */}
                      {!query.trim() && (
                        <div className="p-2 space-y-6">
                          {/* Popular Brands */}
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3 flex items-center gap-1.5">
                              <Tag className="w-3 h-3" /> Popular Brands
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {POPULAR_BRANDS.map(brand => (
                                <button
                                  key={brand}
                                  onClick={() => showAllResults(brand)}
                                  className="text-sm px-4 py-2 rounded-xl bg-secondary/80 hover:bg-primary hover:text-primary-foreground transition-all duration-200 font-medium"
                                >
                                  {brand}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Quick Filters */}
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3 flex items-center gap-1.5">
                              <Zap className="w-3 h-3" /> Quick Filters
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {QUICK_SEARCHES.map(q => (
                                <button
                                  key={q.label}
                                  onClick={() => showAllResults(q.query)}
                                  className="text-sm text-left px-4 py-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-all duration-200 font-medium"
                                >
                                  {q.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Live Search Results */}
                      {filteredCars.length > 0 && (
                        <Command.Group heading="Cars">
                          {filteredCars.map((car) => (
                            <Command.Item
                              key={car.id}
                              value={car.id}
                              onSelect={() => navigateTo(car)}
                              className="cmdk-item flex items-center gap-4 px-3 py-3 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary transition-colors group"
                            >
                              {/* Thumbnail */}
                              <div className="w-16 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-secondary relative">
                                {car.image ? (
                                  <>
                                    <div className="absolute inset-0 shimmer" />
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={optimizeThumb(car.image, 128) || ''}
                                      alt={cleanCarName(car.name, car.brand)}
                                      className="absolute inset-0 w-full h-full object-cover img-reveal"
                                      loading="lazy"
                                      decoding="async"
                                      referrerPolicy="no-referrer"
                                      onLoad={e => e.currentTarget.classList.add('loaded')}
                                      onError={e => (e.currentTarget.style.display = 'none')}
                                    />
                                  </>
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                                    <CarIcon className="w-5 h-5" />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold truncate text-foreground">{cleanCarName(car.name, car.brand)}</div>
                                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                  <span className="font-medium text-foreground/70">{car.brand}</span>
                                  <span>&middot;</span>
                                  <span>{car.type}</span>
                                  <span>&middot;</span>
                                  <span>${car.price > 0 ? car.price.toLocaleString() : estimatePrice(car as any).toLocaleString()}</span>
                                </div>
                              </div>

                              <ArrowRight className="w-4 h-4 text-primary opacity-0 group-aria-selected:opacity-100 transition-opacity flex-shrink-0" />
                            </Command.Item>
                          ))}
                        </Command.Group>
                      )}
                      
                      {/* Show all results action */}
                      {query.trim() && (
                        <Command.Item
                          value="show-all"
                          onSelect={() => showAllResults(query.trim())}
                          className="cmdk-item flex items-center gap-3 px-3 py-3 mt-2 border-t border-border/40 rounded-xl cursor-pointer aria-selected:bg-secondary transition-colors text-sm font-medium text-primary"
                        >
                          <Search className="w-4 h-4" />
                          Show all results for &ldquo;{query}&rdquo;
                        </Command.Item>
                      )}
                    </Command.List>

                    {/* Footer hint */}
                    <div className="px-4 py-3 border-t border-border/40 flex items-center gap-5 text-[11px] text-muted-foreground bg-secondary/20">
                      <span className="flex items-center gap-1.5"><kbd className="bg-background border border-border shadow-sm rounded px-1.5 py-0.5 font-sans">↑↓</kbd> navigate</span>
                      <span className="flex items-center gap-1.5"><kbd className="bg-background border border-border shadow-sm rounded px-1.5 py-0.5 font-sans">↵</kbd> open</span>
                      <span className="flex items-center gap-1.5"><kbd className="bg-background border border-border shadow-sm rounded px-1.5 py-0.5 font-sans">Esc</kbd> close</span>
                    </div>
                  </Command>
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
