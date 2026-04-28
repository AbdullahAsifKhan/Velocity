'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Car } from './types'

/** Union of car types used for category filtering. */
type SelectedType = 'All' | Car['type']

/** A named collection of saved car IDs (used by the Garage feature). */
interface GarageCollection {
  id: string
  name: string
  carIds: string[]
}

// ── Brand → Segment mapping (for session context biasing) ────────────────────
const SESSION_BRAND_SEGMENTS: Record<string, string[]> = {
  hypercar:    ['Bugatti', 'Pagani', 'Koenigsegg', 'Rimac', 'SSC'],
  supercar:    ['Ferrari', 'Lamborghini', 'McLaren', 'Aston Martin', 'Lotus'],
  luxury:      ['Rolls-Royce', 'Bentley', 'Maserati', 'Maybach'],
  premium:     ['Porsche', 'BMW', 'Mercedes-Benz', 'Audi', 'Lexus', 'Jaguar', 'Genesis', 'Cadillac', 'Lincoln', 'Volvo', 'Alfa Romeo', 'Infiniti', 'Acura'],
  performance: ['Dodge', 'Chevrolet', 'Ford', 'Nissan', 'Subaru', 'Mazda'],
  ev:          ['Tesla', 'Rivian', 'Lucid', 'Polestar', 'NIO'],
  mainstream:  ['Toyota', 'Honda', 'Hyundai', 'Kia', 'Volkswagen'],
  offroad:     ['Jeep', 'Land Rover'],
}

function getSegmentsForBrand(brand: string): string[] {
  const segments: string[] = []
  for (const [segment, brands] of Object.entries(SESSION_BRAND_SEGMENTS)) {
    if (brands.some(b => b.toLowerCase() === brand.toLowerCase())) {
      segments.push(segment)
    }
  }
  return segments
}

interface CarStore {
  favorites: string[]
  compareList: string[]
  garage: GarageCollection[]
  searchQuery: string
  selectedType: SelectedType

  // ── Session tracking (ephemeral — not persisted) ──────────────────────────
  sessionId: string
  viewedCarIds: string[]
  viewedTypes: string[]
  viewedSegments: string[]

  // Favorite actions
  toggleFavorite: (carId: string) => void

  // Compare actions
  addToCompare: (carId: string) => void
  removeFromCompare: (carId: string) => void
  clearCompare: () => void

  // Garage actions
  createCollection: (name: string) => void
  deleteCollection: (id: string) => void
  addToCollection: (collectionId: string, carId: string) => void
  removeFromCollection: (collectionId: string, carId: string) => void

  // Filter actions
  setSearchQuery: (query: string) => void
  setSelectedType: (type: SelectedType) => void

  // Session tracking actions
  addViewedCar: (carId: string, type: string, brand: string) => void
}

// Generate a stable session ID per tab (survives re-renders but not tab close)
let _sessionId: string | null = null
function getSessionId(): string {
  if (_sessionId) return _sessionId
  if (typeof window !== 'undefined') {
    // Try to reuse one from sessionStorage (persists within same tab)
    const stored = sessionStorage.getItem('velocity-session-id')
    if (stored) {
      _sessionId = stored
    } else {
      _sessionId = crypto.randomUUID()
      sessionStorage.setItem('velocity-session-id', _sessionId)
    }
  } else {
    _sessionId = 'ssr-' + Math.random().toString(36).slice(2, 10)
  }
  return _sessionId
}

export const useCarStore = create<CarStore>()(
  persist(
    (set) => ({
      favorites: [],
      compareList: [],
      garage: [
        { id: 'dream-cars', name: 'Dream Cars', carIds: [] },
        { id: 'future-buy', name: 'Future Buy', carIds: [] },
      ],
      searchQuery: '',
      selectedType: 'All',

      // Session-scoped state (not included in persist partialize)
      sessionId: typeof window !== 'undefined' ? getSessionId() : '',
      viewedCarIds: [],
      viewedTypes: [],
      viewedSegments: [],

      toggleFavorite: (carId) => {
        set((state) => ({
          favorites: state.favorites.includes(carId)
            ? state.favorites.filter((id) => id !== carId)
            : [...state.favorites, carId],
        }))
      },

      addToCompare: (carId) => {
        set((state) => {
          if (state.compareList.length >= 4 || state.compareList.includes(carId)) {
            return state // no-op: already at max or already added
          }
          return { compareList: [...state.compareList, carId] }
        })
      },

      removeFromCompare: (carId) => {
        set((state) => ({
          compareList: state.compareList.filter((id) => id !== carId),
        }))
      },

      clearCompare: () => set({ compareList: [] }),

      createCollection: (name) => {
        const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
        set((state) => ({
          garage: [...state.garage, { id, name, carIds: [] }],
        }))
      },

      deleteCollection: (id) => {
        set((state) => ({
          garage: state.garage.filter((c) => c.id !== id),
        }))
      },

      addToCollection: (collectionId, carId) => {
        set((state) => ({
          garage: state.garage.map((c) =>
            c.id === collectionId && !c.carIds.includes(carId)
              ? { ...c, carIds: [...c.carIds, carId] }
              : c
          ),
        }))
      },

      removeFromCollection: (collectionId, carId) => {
        set((state) => ({
          garage: state.garage.map((c) =>
            c.id === collectionId
              ? { ...c, carIds: c.carIds.filter((id) => id !== carId) }
              : c
          ),
        }))
      },

      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedType: (type) => set({ selectedType: type }),

      addViewedCar: (carId, type, brand) => {
        set((state) => {
          // Ensure sessionId is initialized on client
          const sid = state.sessionId || getSessionId()

          // Deduplicate and cap at 50
          const newViewedIds = state.viewedCarIds.includes(carId)
            ? state.viewedCarIds
            : [...state.viewedCarIds, carId].slice(-50)

          // Accumulate types (deduplicated)
          const newTypes = state.viewedTypes.includes(type)
            ? state.viewedTypes
            : [...state.viewedTypes, type]

          // Accumulate segments (deduplicated)
          const brandSegments = getSegmentsForBrand(brand)
          const newSegments = [...new Set([...state.viewedSegments, ...brandSegments])]

          return {
            sessionId: sid,
            viewedCarIds: newViewedIds,
            viewedTypes: newTypes,
            viewedSegments: newSegments,
          }
        })
      },
    }),
    {
      name: 'velocity-car-store',
      // Only persist favorites, compare, garage — NOT session tracking data
      partialize: (state) => ({
        favorites: state.favorites,
        compareList: state.compareList,
        garage: state.garage,
      }),
    }
  )
)

/**
 * Filter cars by search query and selected type.
 * Pre-lowercases the query once for efficient comparison.
 */
export function filterCars(
  cars: Car[],
  searchQuery: string,
  selectedType: SelectedType,
): Car[] {
  const query = searchQuery.toLowerCase()

  return cars.filter((car) => {
    const matchesSearch =
      query === '' ||
      car.name?.toLowerCase().includes(query) ||
      car.brand?.toLowerCase().includes(query) ||
      car.type?.toLowerCase().includes(query) ||
      car.fuelType?.toLowerCase().includes(query)

    const matchesType =
      selectedType === 'All' || car.type === selectedType

    return matchesSearch && matchesType
  })
}
