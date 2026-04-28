import { fetchCarsList, fetchCarOfTheDay, fetchFeaturedCars } from '@/lib/api-service'
import { HomeClient } from './home-client'
import { Suspense } from 'react'

export const revalidate = 3600 // ISR: revalidate every hour

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; type?: string }>
}) {
  const resolvedParams = await searchParams
  const page = parseInt(resolvedParams.page || '1')
  const query = resolvedParams.search || ''
  const type = resolvedParams.type || 'All'

  // Fetch paginated cars, car of the day, and featured cars in parallel
  const [{ cars, total, totalPages }, carOfTheDay, featuredCars] = await Promise.all([
    fetchCarsList({ page, limit: 20, query, type }),
    fetchCarOfTheDay(),
    fetchFeaturedCars(8),
  ])

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HomeClient 
        initialCars={cars as any} 
        totalPages={totalPages} 
        currentPage={page} 
        totalCars={total}
        carOfTheDay={carOfTheDay as any}
        featuredCars={featuredCars as any}
      />
    </Suspense>
  )
}
