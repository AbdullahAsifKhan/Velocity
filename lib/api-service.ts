import { PrismaClient } from '@prisma/client'
import type { Car } from './types'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Map a Prisma Car row (+ relations) to our frontend Car type
function mapPrismaCar(raw: any): Car {
  return {
    ...raw,
    // flatten gallery images relation to the url-string array the old UI used
    gallery: raw.images?.map((img: any) => img.url) ?? [],
    // rename sources relation fields to match the UI's expectations
    sources: raw.sources?.map((s: any) => ({
      id: s.id,
      sourceId: s.sourceId,
      sourceName: s.sourceName,
      url: s.url,
      retrievedAt: s.retrievedAt,
      carId: s.carId,
      name: s.sourceName,   // alias used by the UI
    })) ?? [],
  }
}

export async function fetchCarsList(): Promise<Partial<Car>[]> {
  const cars = await prisma.car.findMany({
    orderBy: { name: 'asc' },
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
  })
  return cars as Partial<Car>[]
}

export async function fetchCarById(id: string): Promise<Car | null> {
  const car = await prisma.car.findUnique({
    where: { id },
    include: {
      sources: true,
      images: true,
    },
  })
  if (!car) return null
  return mapPrismaCar(car)
}

export async function fetchBrands(): Promise<string[]> {
  const rows = await prisma.car.findMany({
    select: { brand: true },
    distinct: ['brand'],
    orderBy: { brand: 'asc' },
  })
  return rows.map((r) => r.brand)
}
