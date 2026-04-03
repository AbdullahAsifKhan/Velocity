import { fetchCarsList } from '@/lib/api-service'
import { CompareClient } from './compare-client'
import type { Car } from '@/lib/types'

export default async function ComparePage() {
  const cars = await fetchCarsList()
  return <CompareClient cars={cars as Car[]} />
}
