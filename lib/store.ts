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

interface CarStore {
  favorites: string[]
  compareList: string[]
  garage: GarageCollection[]
  searchQuery: string
  selectedType: SelectedType

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
    }),
    {
      name: 'velocity-car-store',
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
