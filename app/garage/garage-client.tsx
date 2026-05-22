'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Warehouse, Plus, Trash2, ChevronRight, X, FolderPlus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { CompareBar } from '@/components/compare-bar'
import type { Car } from '@/lib/types'
import { useCarStore } from '@/lib/store'
import { cn, optimizeImage, cleanCarName } from '@/lib/utils'
import { fetchCarsByIds } from '@/app/actions'

export function GarageClient() {
  const { garage, createCollection, deleteCollection, removeFromCollection } = useCarStore()
  const [isCreating, setIsCreating] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [expandedCollection, setExpandedCollection] = useState<string | null>(null)
  const [carMap, setCarMap] = useState<Map<string, Car>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadGarageCars = async () => {
      const allIds = new Set<string>()
      garage.forEach(col => col.carIds.forEach(id => allIds.add(id)))
      
      if (allIds.size === 0) {
        setLoading(false)
        return
      }

      try {
        const cars = await fetchCarsByIds(Array.from(allIds)) as Car[]
        const map = new Map(cars.map(c => [c.id, c]))
        setCarMap(map)
      } catch (err) {
        console.error('Failed to load garage cars', err)
      } finally {
        setLoading(false)
      }
    }
    loadGarageCars()
  }, [garage])

  const handleCreateCollection = () => {
    if (newCollectionName.trim()) {
      createCollection(newCollectionName.trim())
      setNewCollectionName('')
      setIsCreating(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">

      <div className="pt-24 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Warehouse className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gradient">My Garage</h1>
                <p className="text-muted-foreground">
                  {garage.length} {garage.length === 1 ? 'collection' : 'collections'}
                </p>
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:glow transition-all"
            >
              <Plus className="w-4 h-4" />
              New Collection
            </motion.button>
          </div>

          {/* Create Collection Modal */}
          <AnimatePresence>
            {isCreating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="w-full max-w-md p-6 rounded-2xl bg-card border border-border"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Create Collection</h2>
                    <button
                      onClick={() => setIsCreating(false)}
                      className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Collection name..."
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
                    className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:outline-none mb-6"
                    autoFocus
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsCreating(false)}
                      className="flex-1 px-4 py-3 rounded-xl font-medium text-muted-foreground hover:bg-secondary transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateCollection}
                      disabled={!newCollectionName.trim()}
                      className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:glow transition-all"
                    >
                      Create
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collections */}
          <div className="space-y-6">
            {garage.map((collection, index) => {
              // O(1) lookups via carMap with proper type narrowing
              const collectionCars = collection.carIds
                .map((id) => carMap.get(id))
                .filter((car): car is Car => car !== undefined)

              const isExpanded = expandedCollection === collection.id

              return (
                <motion.div
                  key={collection.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (index % 8) * 0.05 }}
                  className="rounded-2xl bg-card border border-border overflow-hidden"
                >
                  {/* Collection Header */}
                  <button
                    onClick={() => setExpandedCollection(isExpanded ? null : collection.id)}
                    className="w-full flex items-center justify-between p-6 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FolderPlus className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold">{collection.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {collectionCars.length} {collectionCars.length === 1 ? 'car' : 'cars'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Preview Images */}
                      <div className="hidden sm:flex -space-x-3">
                        {collectionCars.slice(0, 3).map((car) => (
                            <div
                            key={car.id}
                            className="w-10 h-10 relative rounded-lg overflow-hidden border-2 border-card"
                          >
                            <Image
                              src={car.image || '/fallback.png'}
                              alt={cleanCarName(car.name, car.brand)}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>

                      <ChevronRight
                        className={cn(
                          "w-5 h-5 text-muted-foreground transition-transform",
                          isExpanded && "rotate-90"
                        )}
                      />
                    </div>
                  </button>

                  {/* Collection Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border overflow-hidden"
                      >
                        <div className="p-6">
                          {collectionCars.length > 0 ? (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {collectionCars.map((car) => (
                                <div
                                  key={car.id}
                                  className="group relative flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                                >
                                  <Link
                                    href={`/car/${car.id}`}
                                    className="flex items-center gap-4 flex-1"
                                  >
                                    <div className="w-16 h-12 relative rounded-lg overflow-hidden flex-shrink-0">
                                      <Image
                                        src={car.image || '/fallback.png'}
                                        alt={cleanCarName(car.name, car.brand)}
                                        fill
                                        sizes="64px"
                                        className="object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <h4 className="font-medium truncate">{cleanCarName(car.name, car.brand)}</h4>
                                      <p className="text-sm text-muted-foreground">{car.brand}</p>
                                    </div>
                                  </Link>

                                  <button
                                    onClick={() => removeFromCollection(collection.id, car.id)}
                                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-muted-foreground mb-4">
                                This collection is empty
                              </p>
                              <Link
                                href="/"
                                className="text-sm text-primary hover:underline"
                              >
                                Browse cars to add
                              </Link>
                            </div>
                          )}

                          {/* Delete Collection */}
                          <div className="mt-6 pt-6 border-t border-border flex justify-end">
                            <button
                              onClick={() => deleteCollection(collection.id)}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Collection
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}

            {garage.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-6">
                  <Warehouse className="w-12 h-12 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-semibold mb-3">Your garage is empty</h2>
                <p className="text-muted-foreground max-w-md mb-8">
                  Create collections to organize your dream cars, future purchases, and more.
                </p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:glow transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Collection
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <CompareBar />
    </main>
  )
}
