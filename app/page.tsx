import { fetchCarsList, fetchCarOfTheDay, fetchFeaturedCars } from '@/lib/api-service'
import { HomeClient } from './home-client'
import { Suspense } from 'react'
import Loading from './loading'

export const revalidate = 3600 // ISR: revalidate every hour

/**
 * Async wrapper that fetches data and renders HomeClient.
 * By being a separate async component wrapped in Suspense,
 * Next.js can stream the page shell (nav, loading skeleton)
 * immediately while this component resolves its data.
 */
async function HomeContent({
  page,
  query,
  type,
}: {
  page: number
  query: string
  type: string
}) {
  // Fetch paginated cars, car of the day, and featured cars in parallel
  const [{ cars, total, totalPages }, carOfTheDay, featuredCars] = await Promise.all([
    fetchCarsList({ page, limit: 20, query, type }),
    fetchCarOfTheDay(),
    fetchFeaturedCars(8),
  ])

  return (
    <HomeClient 
      initialCars={cars as any} 
      totalPages={totalPages} 
      currentPage={page} 
      totalCars={total}
      carOfTheDay={carOfTheDay as any}
      featuredCars={featuredCars as any}
    />
  )
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; type?: string }>
}) {
  const resolvedParams = await searchParams
  const page = parseInt(resolvedParams.page || '1')
  const query = resolvedParams.search || ''
  const type = resolvedParams.type || 'All'

  return (
    <Suspense fallback={<Loading />}>
      <HomeContent page={page} query={query} type={type} />
    </Suspense>
  )
}
