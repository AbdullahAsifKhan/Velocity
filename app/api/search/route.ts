import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/api-service'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''

  if (q.length === 0) {
    return NextResponse.json([])
  }

  const cars = await prisma.car.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { type: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      brand: true,
      type: true,
      price: true,
      image: true,
    },
    take: 8,
    orderBy: { views: 'desc' },
  })

  return NextResponse.json(cars, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
