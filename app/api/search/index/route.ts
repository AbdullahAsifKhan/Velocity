import { NextResponse } from 'next/server'
import { prisma, mapPrismaCar, normalizeImageUrl } from '@/lib/api-service'
import { logger } from '@/lib/logger'
import { unstable_cache } from 'next/cache'

async function _getSearchIndex() {
  try {
    const pool = await prisma.car.findMany({
      where: {
        isDemoted: false,
        image: { not: '' },
      },
      select: {
        id: true,
        name: true,
        brand: true,
        type: true,
        price: true,
        image: true,
        cdnImage: true,
        year: true,
        popularityScore: true,
        horsepower: true,
      },
      orderBy: [{ popularityScore: 'desc' }, { horsepower: 'desc' }],
    })

    // Deduplicate by model name
    const uniqueModels = new Map<string, typeof pool[0]>()
    for (const car of pool) {
      const existing = uniqueModels.get(car.name)
      if (!existing) {
        uniqueModels.set(car.name, car)
      } else {
        const existingScore = existing.popularityScore || 0
        const candidateScore = car.popularityScore || 0
        if (candidateScore > existingScore) {
          uniqueModels.set(car.name, car)
        }
      }
    }

    const deduped = Array.from(uniqueModels.values())
    
    // Map directly to the frontend type to get formatted data without heavy relations
    return deduped.map(car => ({
      id: car.id,
      name: car.name,
      brand: car.brand,
      type: car.type,
      price: car.price,
      image: car.cdnImage || car.image || '',
      year: car.year,
      horsepower: car.horsepower,
    }))
  } catch (error) {
    logger.error('search index generation failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return []
  }
}

const getCachedSearchIndex = unstable_cache(
  _getSearchIndex,
  ['search-index-full'],
  { revalidate: 3600, tags: ['search-index'] }
)

export async function GET() {
  try {
    const cars = await getCachedSearchIndex()
    return NextResponse.json(cars, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Search index temporarily unavailable.' },
      { status: 500 }
    )
  }
}
