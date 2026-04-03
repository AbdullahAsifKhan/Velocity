import { fetchCarsList } from '@/lib/api-service'
import { GarageClient } from './garage-client'
import type { Car } from '@/lib/types'

export default async function GaragePage() {
  const cars = await fetchCarsList()
  return <GarageClient cars={cars as Car[]} />
}
