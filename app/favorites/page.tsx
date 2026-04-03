import { fetchCarsList } from '@/lib/api-service'
import { FavoritesClient } from './favorites-client'
import type { Car } from '@/lib/types'

export default async function FavoritesPage() {
  const cars = await fetchCarsList()
  return <FavoritesClient cars={cars as Car[]} />
}
