import { NextResponse } from 'next/server'
import { prisma, mapPrismaCar } from '@/lib/api-service'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const idsParam = searchParams.get('ids')

  if (!idsParam) {
    return NextResponse.json(
      { error: 'Missing required parameter: ids' },
      { status: 400 }
    )
  }

  const ids = idsParam.split(',').map(id => id.trim()).filter(Boolean)

  if (ids.length === 0) {
    return NextResponse.json([])
  }

  if (ids.length > 10) {
    return NextResponse.json(
      { error: 'Maximum 10 car IDs allowed per request' },
      { status: 400 }
    )
  }

  try {
    const cars = await prisma.car.findMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    const mappedCars = cars.map(mapPrismaCar)

    return NextResponse.json(mappedCars, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    logger.error('Cars API failed', {
      path: '/api/cars',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      statusCode: 500,
      meta: { requestedIds: ids.length },
    })
    return NextResponse.json(
      { error: 'Failed to fetch cars. Please try again.' },
      { status: 500 }
    )
  }
}
