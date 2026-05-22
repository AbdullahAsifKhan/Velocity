'use server'

import { fetchCarsList, prisma, mapPrismaCar } from '@/lib/api-service'
import type { Car } from '@/lib/types'

export async function loadMoreCars(
  page: number,
  query: string = '',
  type: string = 'All',
  sessionContext?: { types?: string[]; segments?: string[] }
) {
  const { cars } = await fetchCarsList({ page, query, type, limit: 20, sessionContext })
  return cars
}

export async function fetchCarsByIds(ids: string[]) {
  if (!ids || ids.length === 0) return []
  const limitedIds = ids.slice(0, 50)
  const cars = await prisma.car.findMany({
    where: { id: { in: limitedIds } },
  })
  return cars.map(mapPrismaCar) as Partial<Car>[]
}
