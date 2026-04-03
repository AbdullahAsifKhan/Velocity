import { prisma } from '@/lib/api-service'
import { SearchClient } from './search-client'
import type { Metadata } from 'next'

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

  let cars: any[] = []
  if (query.length > 0) {
    cars = await prisma.car.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
          { type: { contains: query, mode: 'insensitive' } },
          { fuelType: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        brand: true,
        type: true,
        fuelType: true,
        price: true,
        year: true,
        image: true,
        horsepower: true,
        torque: true,
        acceleration: true,
        topSpeed: true,
        rating: true,
        views: true,
        favorites: true,
        featured: true,
        description: true,
        drivetrain: true,
        seats: true,
        weight: true,
        mileage: true,
        engine: true,
        transmission: true,
      },
      orderBy: { views: 'desc' },
    })
  }

  return <SearchClient cars={cars} query={query} />
}
