import { searchCarsFullPage } from '@/lib/api-service'
import { SearchClient } from './search-client'
import type { Metadata } from 'next'

export const revalidate = 300 // ISR: revalidate every 5 minutes

interface Props {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `"${q}" — Search | VELOCITY` : 'Search | VELOCITY',
    description: q
      ? `Search results for "${q}" in the VELOCITY car showcase.`
      : 'Search the VELOCITY car collection.',
  }
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = '' } = await searchParams
  const query = q.trim()

  // Use the deduplicated search — no more year-variant flooding
  const cars = query.length > 0 ? await searchCarsFullPage(query) : []

  return <SearchClient cars={cars as any} query={query} />
}
