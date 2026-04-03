'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ArrowRight, Zap, Tag, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const POPULAR_BRANDS = ['Porsche', 'Ferrari', 'BMW', 'Mercedes', 'Lamborghini', 'Tesla', 'Audi', 'McLaren']
const QUICK_SEARCHES = ['Sports cars', 'Electric cars', 'SUVs', 'Luxury']

interface SearchResult {
  id: string
  name: string
  brand: string
  type: string
  price: number
  image: string
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  // Debounced API search
  const search = useCallback((q: string) => {
    // Cancel any in-flight request
    abortRef.current?.abort()

    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = q.trim()
    if (trimmed.length === 0) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const controller = new AbortController()
        abortRef.current = controller
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        })
        if (res.ok) {
          const data = await res.json()
          setResults(data)
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') console.error('Search failed:', e)
      } finally {
        setLoading(false)
      }
    }, 250)
  }, [])

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setActiveIndex(-1)
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      abortRef.current?.abort()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [isOpen])

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const navigateTo = useCallback((car: SearchResult) => {
    onClose()
    router.push(`/car/${car.id}`)
  }, [router, onClose])

  const showAllResults = useCallback((q: string) => {
    onClose()
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }, [router, onClose])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    setActiveIndex(-1)
    search(val)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0 && e.key !== 'Enter') return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && results[activeIndex]) {
        navigateTo(results[activeIndex])
      } else if (query.trim()) {
        showAllResults(query.trim())
      }
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[12vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-2xl pointer-events-auto will-change-transform"
            >
              <div className="rounded-2xl bg-card border border-border/60 shadow-2xl shadow-black/40 overflow-hidden">

                {/* Input row */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-border/40">
                  {loading ? (
                    <Loader2 className="w-5 h-5 text-primary flex-shrink-0 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Search cars, brands, types..."
                    className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground outline-none"
                  />
                  {query && (
                    <button
                      onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}
                      className="p-1 rounded-md hover:bg-secondary transition-colors"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                  <kbd className="hidden sm:flex items-center gap-0.5 text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">
                    Esc
                  </kbd>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">

                  {/* Live results */}
                  {results.length > 0 && (
                    <div className="p-2">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-2 py-1.5 font-semibold">
                        Cars
                      </p>
                      <ul ref={listRef} className="space-y-0.5">
                        {results.map((car, i) => (
                          <li key={car.id}>
                            <button
                              onMouseEnter={() => setActiveIndex(i)}
                              onClick={() => navigateTo(car)}
                              className={cn(
                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors group',
                                activeIndex === i ? 'bg-primary/10' : 'hover:bg-secondary/60'
                              )}
                            >
                              {/* Thumbnail */}
                              <div className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-secondary">
                                {car.image && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={car.image}
                                    alt={car.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={e => (e.currentTarget.style.display = 'none')}
                                  />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold truncate">{car.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {car.brand} · {car.type} · ${car.price.toLocaleString()}
                                </div>
                              </div>

                              <ArrowRight className={cn(
                                'w-4 h-4 text-muted-foreground flex-shrink-0 transition-opacity',
                                activeIndex === i ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              )} />
                            </button>
                          </li>
                        ))}
                      </ul>

                      {/* "Show all results" */}
                      {query.trim() && (
                        <button
                          onClick={() => showAllResults(query.trim())}
                          className="w-full mt-1 flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-secondary/60 transition-colors text-sm text-primary font-medium"
                        >
                          <Search className="w-4 h-4" />
                          Show all results for &ldquo;{query}&rdquo;
                        </button>
                      )}
                    </div>
                  )}

                  {/* Empty state */}
                  {query.trim() && results.length === 0 && !loading && (
                    <div className="py-12 text-center text-muted-foreground text-sm">
                      No cars found for &ldquo;{query}&rdquo;
                    </div>
                  )}

                  {/* Default state: brand pills + quick searches */}
                  {!query.trim() && (
                    <div className="p-4 space-y-5">

                      {/* Popular Brands */}
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
                          <Tag className="w-3 h-3" /> Popular Brands
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {POPULAR_BRANDS.map(brand => (
                            <button
                              key={brand}
                              onClick={() => showAllResults(brand)}
                              className="text-sm px-3 py-1.5 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors font-medium"
                            >
                              {brand}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Quick Filters */}
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
                          <Zap className="w-3 h-3" /> Quick Filters
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {QUICK_SEARCHES.map(q => (
                            <button
                              key={q}
                              onClick={() => showAllResults(q)}
                              className="text-sm text-left px-3 py-2 rounded-lg bg-secondary/60 hover:bg-secondary transition-colors"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* Footer hint */}
                <div className="px-4 py-2.5 border-t border-border/40 flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><kbd className="border border-border rounded px-1">↑↓</kbd> navigate</span>
                  <span className="flex items-center gap-1"><kbd className="border border-border rounded px-1">↵</kbd> open</span>
                  <span className="flex items-center gap-1"><kbd className="border border-border rounded px-1">Esc</kbd> close</span>
                </div>

              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
