import { fetchCarsList } from '@/lib/api-service'
import { HomeClient } from './home-client'

export default async function HomePage() {
  const cars = await fetchCarsList()
  return <HomeClient cars={cars as any} />
}
