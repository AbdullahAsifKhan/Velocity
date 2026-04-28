import { NextRequest, NextResponse } from 'next/server'
import { searchCarsDeduped } from '@/lib/api-service'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''

  if (q.length === 0) {
    return NextResponse.json([])
  }

  try {
    // Deduplicated search — returns unique models only
    const cars = await searchCarsDeduped(q, 8)

    return NextResponse.json(cars, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    logger.error('Search API failed', {
      path: '/api/search',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      statusCode: 500,
      meta: { query: q },
    })
    return NextResponse.json(
      { error: 'Search temporarily unavailable. Please try again.' },
      { status: 500 }
    )
  }
}
