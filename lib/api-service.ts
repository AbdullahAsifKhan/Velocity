import { PrismaClient } from '@prisma/client'
import { logger } from './logger'
import type { Car } from './types'
import { TAXONOMY_OVERRIDES, GENERATION_YEAR_OVERRIDES } from './taxonomy-overrides'


const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// ── Common select shape (lightweight for list views) ─────────────────────────
const CAR_LIST_SELECT = {
  id: true,
  name: true,
  brand: true,
  type: true,
  fuelType: true,
  price: true,
  year: true,
  image: true,
  cdnImage: true,
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
  modelFamily: true,
  isCanonical: true,
  popularityScore: true,
  blendedScore: true,
  isDemoted: true,
} as const

// Exploration rate: 10% of slots filled with random top-500 cars
const EXPLORATION_RATE = 0.1

// Types we hide from the main showcase UI
const HIDDEN_TYPES = ['Motorcycle', 'Commercial']
const HIDDEN_BRANDS = ['Polestar', 'Shelby', 'smart', 'Smart', 'Plymouth']

// ── Engine / non-car image detection ─────────────────────────────────────────
const ENGINE_IMAGE_KEYWORDS = [
  'engine', 'motor', 'powertrain', 'cylinder', 'valve', 'turbo',
  'intake', 'exhaust', 'cutaway', 'diagram', 'schematic', 'cross.?section',
  'logo', 'badge', 'emblem', 'crest', 'flag', 'coat.of.arms',
  'blueprint', 'patent', 'drawing', 'wireframe', 'render',
  'piston', 'crankshaft', 'camshaft', 'carburetor', 'throttle',
  'transmission', 'gearbox', 'differential', 'drivetrain',
  'suspension', 'brake', 'caliper', 'rotor',
  'dashboard', 'cockpit', 'interior', 'steering',
  'assembly.line', 'factory', 'plant',
]

const ENGINE_IMAGE_REGEX = new RegExp(
  ENGINE_IMAGE_KEYWORDS.join('|'),
  'i'
)

/**
 * Check whether an image URL likely points to an engine, mechanical part,
 * logo, or other non-exterior-car photo based on the filename in the URL.
 */
function isLikelyNonCarImage(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    // Extract the filename portion from the URL path
    const pathname = new URL(url).pathname
    const filename = decodeURIComponent(pathname.split('/').pop() || '')
    return ENGINE_IMAGE_REGEX.test(filename)
  } catch {
    // If URL parsing fails, check the raw string
    const lastSegment = url.split('/').pop() || ''
    return ENGINE_IMAGE_REGEX.test(decodeURIComponent(lastSegment))
  }
}

// Map a Prisma Car row (+ relations) to our frontend Car type
export function mapPrismaCar(raw: any): Car {
  // Determine best image: CDN first, then original, but reject engine/non-car images
  let resolvedImage = raw.cdnImage || raw.image || ''
  if (isLikelyNonCarImage(resolvedImage)) {
    // CDN image was bad — try original
    if (raw.cdnImage && isLikelyNonCarImage(raw.cdnImage) && raw.image && !isLikelyNonCarImage(raw.image)) {
      resolvedImage = raw.image
    } else {
      resolvedImage = '' // fall back to placeholder
    }
  }

  return {
    ...raw,
    image: resolvedImage,
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

// ── Brand-diversity interleaving ─────────────────────────────────────────────
/**
 * Deduplicate cars that share the exact same image within the same brand.
 * This prevents e.g. 5 'Porsche 718' variants with the identical Wikipedia photo showing.
 */
function deduplicateByImage<T extends { brand?: string; image?: string | null }>(cars: T[]): T[] {
  const result: T[] = []
  const seen = new Set<string>()

  for (const car of cars) {
    // If no real image, keep it
    if (!car.image || car.image.length < 5) {
      result.push(car)
      continue
    }

    // Unique key: Brand + Image URL (preferring CDN if available)
    const activeImage = (car as any).cdnImage || car.image;
    const key = `${car.brand || 'Unknown'}-${activeImage}`
    if (!seen.has(key)) {
      seen.add(key)
      result.push(car)
    }
  }

  return result
}

/**
 * Round-robin interleave cars from different brands so no single brand
 * dominates any page of results.
 */
function interleaveByBrand<T extends { brand: string; image?: string | null }>(cars: T[]): T[] {
  // First, remove visually identical cars within the same brand
  const visuallyUnique = deduplicateByImage(cars)

  // Group by brand
  const buckets = new Map<string, T[]>()
  for (const car of visuallyUnique) {
    if (!buckets.has(car.brand)) buckets.set(car.brand, [])
    buckets.get(car.brand)!.push(car)
  }

  // Sort brands by number of cars (largest first for balanced round-robin)
  const sortedBrands = Array.from(buckets.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(([, bCars]) => bCars)

  // Round-robin pick
  const result: T[] = []
  let idx = 0
  let exhausted = 0
  while (exhausted < sortedBrands.length) {
    exhausted = 0
    for (const bucket of sortedBrands) {
      if (idx < bucket.length) {
        result.push(bucket[idx])
      } else {
        exhausted++
      }
    }
    idx++
  }

  return result
}

// ═══════════════════════════════════════════════════════════════════════════════
// FETCH CARS LIST (Home page "All Cars" grid)
// ═══════════════════════════════════════════════════════════════════════════════

interface SessionContext {
  types?: string[]     // car types the user has been viewing
  segments?: string[]  // brand segments the user has been viewing
}

interface FetchCarsOptions {
  query?: string
  type?: string
  page?: number
  limit?: number
  includeHidden?: boolean   // show motorcycles/commercial (for search)
  enrichedOnly?: boolean    // only cars with HP > 0
  sessionContext?: SessionContext  // for personalized biasing
}

export async function fetchCarsList(options: FetchCarsOptions = {}) {
  const {
    query = '',
    type = 'All',
    page = 1,
    limit = 50,
    includeHidden = false,
    enrichedOnly = true,
    sessionContext,
  } = options

  try {
    const where: any = {
      isCanonical: true,
      modelFamily: { not: null },
    }

    // Hide motorcycles/commercial and specific brands from main UI
    if (!includeHidden) {
      where.type = { notIn: HIDDEN_TYPES }
      where.brand = { notIn: HIDDEN_BRANDS }
      where.isDemoted = false
    }

    // Only show enriched cars in the main showcase
    if (enrichedOnly) {
      where.horsepower = { gt: 0 }
    }

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { brand: { contains: query, mode: 'insensitive' } },
        { modelFamily: { contains: query, mode: 'insensitive' } },
        { type: { contains: query, mode: 'insensitive' } },
        { fuelType: { contains: query, mode: 'insensitive' } },
      ]
    }

    if (type && type !== 'All') {
      where.type = { ...(where.type || {}), equals: type }
    }

    const hasSession = sessionContext && (
      (sessionContext.types && sessionContext.types.length > 0) ||
      (sessionContext.segments && sessionContext.segments.length > 0)
    )

    // If session context exists, fetch extra cars for re-ranking
    const fetchLimit = hasSession ? Math.ceil(limit * 1.3) : limit

    const [total, cars] = await Promise.all([
      prisma.car.count({ where }),
      prisma.car.findMany({
        where,
        orderBy: [{ blendedScore: 'desc' }, { popularityScore: 'desc' }, { horsepower: 'desc' }],
        select: CAR_LIST_SELECT,
        skip: (page - 1) * limit,
        take: fetchLimit,
      }),
    ])

    let finalCars = cars

    // Session-based personalization: boost cars matching user's recent interests
    if (hasSession && cars.length > 0) {
      const sessionTypes = new Set(sessionContext!.types || [])
      const sessionSegments = new Set(sessionContext!.segments || [])

      const scored = cars.map(car => {
        let boost = 1.0
        if (sessionTypes.has(car.type)) boost *= 1.4
        const carSegs = getBrandSegment(car.brand)
        if (carSegs.some(s => sessionSegments.has(s))) boost *= 1.2
        return { car, sortScore: (car.blendedScore || car.popularityScore || 0) * boost }
      })

      scored.sort((a, b) => b.sortScore - a.sortScore)

      // Cap boosted cars at 40% of the page to prevent echo chambers
      const maxBoosted = Math.ceil(limit * 0.4)
      let boostedCount = 0
      const result: typeof cars = []
      const unboosted: typeof cars = []

      for (const s of scored) {
        const wasBoosted = sessionTypes.has(s.car.type) ||
          getBrandSegment(s.car.brand).some(seg => sessionSegments.has(seg))

        if (wasBoosted && boostedCount < maxBoosted) {
          result.push(s.car)
          boostedCount++
        } else {
          unboosted.push(s.car)
        }
      }

      finalCars = [...result, ...unboosted].slice(0, limit)
    }

    // Epsilon-greedy exploration: replace ~10% of slots with random top-500 picks
    const explorationSlots = Math.max(1, Math.floor(limit * EXPLORATION_RATE))
    if (!query && page <= 3 && finalCars.length >= limit) {
      try {
        const existingIds = new Set(finalCars.map(c => c.id))
        const exploreCars = await prisma.car.findMany({
          where: {
            ...where,
            id: { notIn: Array.from(existingIds) },
          },
          orderBy: [{ blendedScore: 'desc' }, { popularityScore: 'desc' }],
          select: CAR_LIST_SELECT,
          take: 500,
        })

        if (exploreCars.length > 0) {
          // Pick random cars from the pool
          const picks: typeof exploreCars = []
          const poolCopy = [...exploreCars]
          for (let i = 0; i < Math.min(explorationSlots, poolCopy.length); i++) {
            const randIdx = Math.floor(Math.random() * poolCopy.length)
            picks.push(poolCopy.splice(randIdx, 1)[0])
          }

          // Replace the last N slots with exploration picks
          finalCars = [
            ...finalCars.slice(0, limit - picks.length),
            ...picks,
          ]
        }
      } catch {
        // Exploration is best-effort — don't break the page
      }
    }

    return {
      cars: finalCars.slice(0, limit).map(mapPrismaCar) as Partial<Car>[],
      total,
      totalPages: Math.ceil(total / limit),
    }
  } catch (error) {
    logger.error('fetchCarsList failed', {
      path: 'lib/api-service.ts#fetchCarsList',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      meta: { query, type, page, limit },
    })
    return { cars: [] as Partial<Car>[], total: 0, totalPages: 0 }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAR OF THE DAY (Hero section)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Deterministic "Car of the Day" — picks a different car each day.
 * Only selects fully enriched cars with images, excludes motorcycles/commercial.
 */
export async function fetchCarOfTheDay(): Promise<Partial<Car> | null> {
  try {
    const queryWhere = {
      isCanonical: true,
      image: { not: '' },
      horsepower: { gt: 100 },
      acceleration: { gt: 0 },
      topSpeed: { gt: 0 },
      type: { notIn: HIDDEN_TYPES },
      brand: { notIn: HIDDEN_BRANDS },
      isDemoted: false,
    };

    const qualifiedCount = await prisma.car.count({
      where: queryWhere,
    })

    if (qualifiedCount === 0) return null

    const daysSinceEpoch = Math.floor(Date.now() / 86_400_000)
    const offset = daysSinceEpoch % qualifiedCount

    const car = await prisma.car.findMany({
      where: queryWhere,
      orderBy: { id: 'asc' },
      skip: offset,
      take: 1,
    })

    return car.length > 0 ? (mapPrismaCar(car[0]) as Partial<Car>) : null
  } catch (error) {
    logger.error('fetchCarOfTheDay failed', {
      path: 'lib/api-service.ts#fetchCarOfTheDay',
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURED CARS (Top Picks carousel)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch "featured" cars with enforced brand diversity.
 * Uses blendedScore (not raw HP) to pick the most relevant cars.
 * Editorial `featured: true` flags always get priority.
 */
export async function fetchFeaturedCars(limit = 8): Promise<Partial<Car>[]> {
  try {
    // Fetch a pool of high-quality candidates sorted by blendedScore
    const pool = await prisma.car.findMany({
      where: {
        isCanonical: true,
        image: { not: '' },
        horsepower: { gt: 50 },
        type: { notIn: HIDDEN_TYPES },
        brand: { notIn: HIDDEN_BRANDS },
        isDemoted: false,
      },
      orderBy: [{ blendedScore: 'desc' }, { popularityScore: 'desc' }, { horsepower: 'desc' }],
      select: CAR_LIST_SELECT,
      take: 200,
    })

    // Deduplicate by name (keep highest-scored variant)
    const uniqueByName = new Map<string, typeof pool[0]>()
    for (const car of pool) {
      if (!uniqueByName.has(car.name)) uniqueByName.set(car.name, car)
    }
    const candidates = Array.from(uniqueByName.values())

    // Editorial overrides first
    const editorial = candidates.filter(c => c.featured)
    const organic = candidates.filter(c => !c.featured)

    // Brand-diverse selection
    const brandPicked = new Map<string, number>()
    const selectedIds: string[] = []

    // Priority: editorial picks
    for (const c of editorial) {
      if (selectedIds.length >= limit) break
      selectedIds.push(c.id)
      brandPicked.set(c.brand, (brandPicked.get(c.brand) || 0) + 1)
    }

    // First pass: one per brand from organic
    for (const c of organic) {
      if (selectedIds.length >= limit) break
      const count = brandPicked.get(c.brand) || 0
      if (count === 0) {
        selectedIds.push(c.id)
        brandPicked.set(c.brand, 1)
      }
    }

    // Second pass: fill remaining slots
    for (const c of organic) {
      if (selectedIds.length >= limit) break
      if (!selectedIds.includes(c.id)) {
        selectedIds.push(c.id)
      }
    }

    const featured = await prisma.car.findMany({
      where: { id: { in: selectedIds } },
      select: CAR_LIST_SELECT,
    })

    const ordered = selectedIds
      .map(id => featured.find(c => c.id === id))
      .filter(Boolean) as typeof featured

    return ordered.map(mapPrismaCar) as Partial<Car>[]
  } catch (error) {
    logger.error('fetchFeaturedCars failed', {
      path: 'lib/api-service.ts#fetchFeaturedCars',
      error: error instanceof Error ? error.message : String(error),
    })
    return []
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BRAND CARS (Brand detail page — deduplicated)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch cars for a specific brand, deduplicated by model name.
 * Only shows unique models (newest year variant per model).
 * Excludes hidden types, enriched-first.
 */
export async function fetchBrandCars(brandName: string): Promise<{
  cars: Partial<Car>[],
  totalModels: number,
  totalVariants: number,
}> {
  try {
    // Count total variants for display
    const totalVariants = await prisma.car.count({
      where: { brand: brandName },
    })

    // Get one ID per unique model name, enforce canonical deduplication
    const grouped = await prisma.car.groupBy({
      by: ['name'],
      where: { brand: brandName, isCanonical: true, isDemoted: false },
      _max: { id: true, year: true, horsepower: true, popularityScore: true },
    })

    const totalModels = grouped.length

    // Sort: most popular first
    const sortedIds = grouped
      .sort((a, b) => {
        const popDiff = (b._max.popularityScore || 0) - (a._max.popularityScore || 0)
        if (popDiff !== 0) return popDiff
        const hpDiff = (b._max.horsepower || 0) - (a._max.horsepower || 0)
        if (hpDiff !== 0) return hpDiff
        return (b._max.year || 0) - (a._max.year || 0)
      })
      .map(g => g._max.id)
      .filter(Boolean) as string[]

    const cars = await prisma.car.findMany({
      where: { id: { in: sortedIds } },
      select: CAR_LIST_SELECT,
    })

    // Maintain sort order
    const ordered = sortedIds
      .map(id => cars.find(c => c.id === id))
      .filter(Boolean) as typeof cars

    return {
      cars: deduplicateByImage(ordered).map(mapPrismaCar) as Partial<Car>[],
      totalModels,
      totalVariants,
    }
  } catch (error) {
    logger.error('fetchBrandCars failed', {
      path: 'lib/api-service.ts#fetchBrandCars',
      error: error instanceof Error ? error.message : String(error),
    })
    return { cars: [], totalModels: 0, totalVariants: 0 }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEARCH (Deduplicated)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Search cars with deduplication — returns unique models, newest year per model.
 */
export async function searchCarsDeduped(query: string, limit = 8): Promise<Partial<Car>[]> {
  try {
    if (!query.trim()) return []

    // Fetch a broader pool to deduplicate from
    const pool = await prisma.car.findMany({
      where: {
        isDemoted: false,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
          { type: { contains: query, mode: 'insensitive' } },
        ],
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
        horsepower: true,
        popularityScore: true,
      },
      orderBy: [{ popularityScore: 'desc' }, { horsepower: 'desc' }],
      take: 100,
    })

    // Deduplicate: keep one per model name (prefer most popular)
    const uniqueModels = new Map<string, typeof pool[0]>()
    for (const car of pool) {
      const existing = uniqueModels.get(car.name)
      if (!existing) {
        uniqueModels.set(car.name, car)
      } else {
        const existingScore = existing.popularityScore
        const candidateScore = car.popularityScore
        if (candidateScore > existingScore) {
          uniqueModels.set(car.name, car)
        }
      }
    }

    // Brand-diverse result: interleave
    const deduped = Array.from(uniqueModels.values())
    const interleaved = interleaveByBrand(deduped)

    return interleaved.slice(0, limit).map(mapPrismaCar) as Partial<Car>[]
  } catch (error) {
    logger.error('searchCarsDeduped failed', {
      path: 'lib/api-service.ts#searchCarsDeduped',
      error: error instanceof Error ? error.message : String(error),
    })
    return []
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FULL SEARCH PAGE (Deduplicated for /search?q=...)
// ═══════════════════════════════════════════════════════════════════════════════

export async function searchCarsFullPage(query: string): Promise<Partial<Car>[]> {
  try {
    if (!query.trim()) return []

    const pool = await prisma.car.findMany({
      where: {
        isDemoted: false,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
          { type: { contains: query, mode: 'insensitive' } },
          { fuelType: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: CAR_LIST_SELECT,
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
    return interleaveByBrand(deduped).map(mapPrismaCar) as Partial<Car>[]
  } catch (error) {
    logger.error('searchCarsFullPage failed', {
      path: 'lib/api-service.ts#searchCarsFullPage',
      error: error instanceof Error ? error.message : String(error),
    })
    return []
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXISTING: fetchCarById, fetchBrands, fetchBrandStats, fetchModelVariants, fetchSimilarCars
// ═══════════════════════════════════════════════════════════════════════════════

export async function fetchCarById(id: string): Promise<Car | null> {
  try {
    const car = await prisma.car.findUnique({
      where: { id },
      include: {
        sources: true,
        images: true,
      },
    })
    if (!car) return null
    return mapPrismaCar(car)
  } catch (error) {
    logger.error('fetchCarById failed', {
      path: 'lib/api-service.ts#fetchCarById',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      meta: { carId: id },
    })
    return null
  }
}

export async function fetchBrands(): Promise<string[]> {
  try {
    const rows = await prisma.car.findMany({
      where: { brand: { notIn: HIDDEN_BRANDS } },
      select: { brand: true },
      distinct: ['brand'],
      orderBy: { brand: 'asc' },
    })
    return rows.map((r) => r.brand)
  } catch (error) {
    logger.error('fetchBrands failed', {
      path: 'lib/api-service.ts#fetchBrands',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return []
  }
}

export async function fetchBrandStats(): Promise<{ name: string; count: number }[]> {
  try {
    const rows = await prisma.car.findMany({
      where: { brand: { notIn: HIDDEN_BRANDS } },
      select: { brand: true, name: true },
    })

    const brandCounts = new Map<string, Set<string>>()
    for (const row of rows) {
      if (!brandCounts.has(row.brand)) {
        brandCounts.set(row.brand, new Set<string>())
      }
      brandCounts.get(row.brand)!.add(row.name)
    }

    return Array.from(brandCounts.entries())
      .map(([name, models]) => ({ name, count: models.size }))
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    logger.error('fetchBrandStats failed', {
      path: 'lib/api-service.ts#fetchBrandStats',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return []
  }
}

// ── Trim Identity Deduplicator ─────────────────────────────────────────────────
/**
 * Deduplicate variants by analyzing exclusively their 'Trim Identity'.
 * Strips brand, model family, years, generation prefixes, and chassis codes to safely merge identical trims.
 */
function deduplicateByTrimIdentity<T extends { name: string; year?: number; horsepower?: number | null }>(cars: T[], brand: string, modelFamily: string): T[] {
  const result: T[] = []
  const trimBuckets = new Map<string, T[]>()

  for (const car of cars) {
    let clean = car.name
      // Strip Brand and Model Family
      .replace(new RegExp(`\\b${brand}\\b`, 'ig'), '')
      .replace(new RegExp(`\\b${modelFamily}\\b`, 'ig'), '')
      // Strip Generations
      .replace(/\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|\d+(st|nd|rd|th))\b.*\bgeneration\b/ig, '')
      // Strip Chassis Codes (e.g., (992))
      .replace(/\(.*?\)/g, '')
      // Strip explicit years
      .replace(/\b(19|20)\d{2}\b/g, '')
      .trim()
      .replace(/\s+/g, ' ')

    const trimIdentity = clean || 'Base'
    
    if (!trimBuckets.has(trimIdentity)) {
      trimBuckets.set(trimIdentity, [])
    }
    trimBuckets.get(trimIdentity)!.push(car)
  }

  // Choose mathematical best
  for (const bucket of trimBuckets.values()) {
    bucket.sort((a, b) => {
      const hpDiff = (b.horsepower || 0) - (a.horsepower || 0)
      if (hpDiff !== 0) return hpDiff
      return ((b as any).year || 0) - ((a as any).year || 0)
    })
    result.push(bucket[0])
  }

  return result.sort((a, b) => (b.horsepower || 0) - (a.horsepower || 0))
}

// ── Brand Segment Map ─────────────────────────────────────────────────────────
const BRAND_SEGMENTS: Record<string, string[]> = {
  hypercar:    ['Bugatti', 'Pagani', 'Koenigsegg', 'Rimac', 'SSC'],
  supercar:    ['Ferrari', 'Lamborghini', 'McLaren', 'Aston Martin', 'Lotus'],
  luxury:      ['Rolls-Royce', 'Bentley', 'Maserati', 'Maybach'],
  premium:     ['Porsche', 'BMW', 'Mercedes-Benz', 'Audi', 'Lexus', 'Jaguar', 'Genesis', 'Cadillac', 'Lincoln', 'Volvo', 'Alfa Romeo', 'Infiniti', 'Acura'],
  performance: ['Dodge', 'Chevrolet', 'Ford', 'Nissan', 'Subaru', 'Mazda', 'Polestar'],
  ev:          ['Tesla', 'Rivian', 'Lucid', 'Polestar', 'NIO'],
  mainstream:  ['Toyota', 'Honda', 'Hyundai', 'Kia', 'Volkswagen', 'Chevrolet', 'Ford', 'Nissan', 'Mazda', 'Subaru'],
  offroad:     ['Jeep', 'Land Rover', 'Toyota', 'Ford'],
}

function getBrandSegment(brand: string): string[] {
  const segments: string[] = []
  for (const [segment, brands] of Object.entries(BRAND_SEGMENTS)) {
    if (brands.some(b => b.toLowerCase() === brand.toLowerCase())) {
      segments.push(segment)
    }
  }
  return segments.length > 0 ? segments : ['other']
}

function similarityScore(
  source: { type: string; brand: string; fuelType: string; year: number; price: number },
  candidate: { type: string; brand: string; fuelType: string; year: number; price: number },
): number {
  let score = 0

  if (candidate.type === source.type) score += 30

  const sourceSegs = getBrandSegment(source.brand)
  const candSegs = getBrandSegment(candidate.brand)
  const sharedSegs = sourceSegs.filter(s => candSegs.includes(s))
  if (sharedSegs.length > 0) score += 15 + Math.min(sharedSegs.length * 5, 10)
  if (candidate.brand === source.brand) score += 5

  if (candidate.fuelType === source.fuelType) score += 15

  const yearDiff = Math.abs(candidate.year - source.year)
  if (yearDiff <= 1) score += 15
  else if (yearDiff <= 3) score += 10
  else if (yearDiff <= 5) score += 5

  if (source.price > 0 && candidate.price > 0) {
    const ratio = Math.min(source.price, candidate.price) / Math.max(source.price, candidate.price)
    if (ratio > 0.7) score += 15
    else if (ratio > 0.4) score += 10
    else if (ratio > 0.2) score += 5
  }

  return score
}

export async function fetchSimilarCars(
  car: { id: string; brand: string; name: string; type: string; fuelType: string; year: number; price: number },
  limit = 4
): Promise<Partial<Car>[]> {
  try {
    const modelName = car.name.startsWith(car.brand + ' ')
      ? car.name.slice(car.brand.length + 1)
      : car.name
    const fullName = `${car.brand} ${modelName}`

    // Fetch content-based candidates AND co-view data in parallel
    const [candidates, coViewRows] = await Promise.all([
      prisma.car.findMany({
        where: {
          OR: [
            { type: car.type },
            { brand: car.brand },
          ],
          id: { not: car.id },
          NOT: { name: fullName },
          horsepower: { gt: 0 },
        },
        orderBy: { year: 'desc' },
        take: 200,
        select: {
          id: true, name: true, brand: true, type: true, fuelType: true,
          price: true, year: true, image: true, cdnImage: true,
          horsepower: true, acceleration: true, topSpeed: true,
          rating: true, description: true,
        },
      }),
      // Co-view collaborative filtering data
      prisma.carCoView.findMany({
        where: {
          OR: [
            { carAId: car.id },
            { carBId: car.id },
          ],
        },
        orderBy: { count: 'desc' },
        take: 50,
      }).catch(() => []),  // graceful degradation if table doesn't exist yet
    ])

    // Build co-view score map: carId -> coViewCount
    const coViewMap = new Map<string, number>()
    let maxCoView = 1
    for (const row of coViewRows) {
      const partnerId = row.carAId === car.id ? row.carBId : row.carAId
      coViewMap.set(partnerId, (coViewMap.get(partnerId) || 0) + row.count)
      maxCoView = Math.max(maxCoView, row.count)
    }

    const hasCoViewData = coViewMap.size > 0

    // Deduplicate by model name (keep newest year per model)
    const uniqueModels = new Map<string, typeof candidates[0]>()
    for (const c of candidates) {
      const existing = uniqueModels.get(c.name)
      if (!existing || c.year > existing.year) {
        uniqueModels.set(c.name, c)
      }
    }

    // Score & rank — blend content similarity with co-view signal
    const scored = Array.from(uniqueModels.values()).map(c => {
      const contentScore = similarityScore(
        { type: car.type, brand: car.brand, fuelType: car.fuelType, year: car.year, price: car.price },
        { type: c.type, brand: c.brand, fuelType: c.fuelType ?? 'Unknown', year: c.year, price: c.price },
      )

      // Normalize content score to 0-1 (max possible is ~100)
      const normalizedContent = contentScore / 100

      // Co-view score: 0-1 (normalized by max co-view count)
      const coViewScore = hasCoViewData
        ? (coViewMap.get(c.id) || 0) / maxCoView
        : 0

      // Blend: 50/50 when co-view data exists, 100% content otherwise
      const finalScore = hasCoViewData
        ? (0.5 * normalizedContent) + (0.5 * coViewScore)
        : normalizedContent

      return { car: c, score: finalScore }
    })

    scored.sort((a, b) => b.score - a.score || b.car.year - a.car.year)

    // Brand-diverse: avoid all 4 similar cars being same brand
    const result: typeof candidates = []
    const brandCount = new Map<string, number>()
    for (const s of scored) {
      if (result.length >= limit) break
      const bc = brandCount.get(s.car.brand) || 0
      if (bc < 2) {
        result.push(s.car)
        brandCount.set(s.car.brand, bc + 1)
      }
    }

    return result.map(mapPrismaCar) as Partial<Car>[]
  } catch (error) {
    logger.error('fetchSimilarCars failed', {
      path: 'lib/api-service.ts#fetchSimilarCars',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return []
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HIERARCHICAL TAXONOMY (Model & Generation Grouping)
// ═══════════════════════════════════════════════════════════════════════════════

export function extractModelFamily(carName: string, brandName: string): string {
  let raw = carName.substring(0, 100)
  if (raw.toLowerCase().startsWith(brandName.toLowerCase())) {
     raw = raw.substring(brandName.length).trim()
  }
  
  if (!raw) return "Unknown"
  
  const multiWordMatches = [
    "Range Rover", "Land Cruiser", "F-150", "F-250", "F-350",
    "Silver Shadow", "Silver Ghost", "Silver Cloud",
    "Grand Cherokee", "Model S", "Model 3", "Model X", "Model Y",
    "S-Class", "E-Class", "C-Class", "M-Class", "G-Class",
    "Aston Martin V8", "Aston Martin DB", "Gran Turismo"
  ]
  
  for (const mwm of multiWordMatches) {
     if (raw.toLowerCase().startsWith(mwm.toLowerCase())) return mwm
  }
  
  // Base token split
  return raw.split(' ')[0].replace(/,$/, '').trim()
}

export function normalizeModelFamilyName(raw: string): string {
  if (!raw) return 'Unknown'
  
  // Remove "First generation", "Second generation", etc.
  let cleaned = raw.replace(/\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\s+generation\b/ig, '')
  
  // Remove chassis codes in parentheses at the end e.g. "(9PA)"
  cleaned = cleaned.replace(/\s*\([^)]*\)\s*$/, '')
  
  // Remove "Mk1", "Mk2", etc.
  cleaned = cleaned.replace(/\bMk\d+\b/ig, '')
  
  // Remove trailing whitespace
  return cleaned.trim() || raw // Fallback to raw if we accidentally stripped everything
}

export async function fetchBrandModelFamilies(brandName: string) {
  try {
    if (HIDDEN_BRANDS.includes(brandName)) return []

    // Fetch ALL cars for the brand to do in-memory grouping
    const allCars = await prisma.car.findMany({
       where: {
         brand: brandName,
         type: { notIn: HIDDEN_TYPES },
         modelFamily: { not: null },
         isDemoted: false,
       },
       select: CAR_LIST_SELECT,
    })
    
    // Group them by normalized model family
    const normalizedGroups = new Map<string, typeof allCars>()
    
    for (const car of allCars) {
       const normName = normalizeModelFamilyName(car.modelFamily!)
       if (!normalizedGroups.has(normName)) {
           normalizedGroups.set(normName, [])
       }
       normalizedGroups.get(normName)!.push(car)
    }

    const result = Array.from(normalizedGroups.entries()).map(([modelName, carsInGroup]) => {
      const totalVariants = carsInGroup.length
      
      // Find the best canonical car to represent this model
      // Prefer cars that are explicitly marked isCanonical, then sort by highest horsepower
      const canonicals = carsInGroup.filter(c => c.isCanonical)
      const pool = canonicals.length > 0 ? canonicals : carsInGroup
      
      const bestCar = pool.sort((a, b) => (b.horsepower || 0) - (a.horsepower || 0))[0]

      // Determine the highest popularity score among all variants of this model
      const maxPopularity = Math.max(...carsInGroup.map(c => c.popularityScore || 0))

      return {
        modelName,
        image: bestCar.cdnImage || bestCar.image || '',
        totalVariants,
        type: bestCar.type || 'Unknown',
        popularityScore: maxPopularity,
        singleVariantId: totalVariants === 1 ? bestCar.id : undefined,
        singleVariantRecord: totalVariants === 1 ? mapPrismaCar(bestCar) : undefined,
      }
    }).sort((a, b) => {
      // 1. Sort by actual Wikipedia popularity score
      if (a.popularityScore !== b.popularityScore) {
        return b.popularityScore - a.popularityScore
      }
      // 2. Fallback to Total Variants
      return b.totalVariants - a.totalVariants
    })

    return result
  } catch (err) {
    logger.error('fetchBrandModelFamilies failed', { error: String(err) })
    return []
  }
}


export function extractVariantCategory(name: string, horsepower?: number | null): 'Standard Lineup' | 'Performance & Track' | 'Special Editions' | 'Other Variants' {
  const lowerName = name.toLowerCase()
  if (lowerName.includes('edition') || lowerName.includes('anniversary') || lowerName.includes('concept') || lowerName.includes('series')) {
    return 'Special Editions'
  }
  // Performance indicators (often M, AMG, RS, GT, SV, Performante, Competizione)
  const perfRegex = /\b(gt\d*|rs|amg|m|svj|performante|competizione|cs|csl|black series|trofeo|qv)\b/i
  if (perfRegex.test(name)) {
    return 'Performance & Track'
  }
  if (horsepower && horsepower > 500) { // Naive fallback for hyper-performance if name doesn't match
     return 'Performance & Track'
  }
  return 'Standard Lineup'
}

export async function fetchModelHierarchy(brandName: string, modelName: string) {
  try {
    // Fetch all cars for the brand to normalize and filter in-memory
    const allCars = await prisma.car.findMany({
        where: { brand: brandName, type: { notIn: HIDDEN_TYPES }, isDemoted: false },
        select: CAR_LIST_SELECT,
        orderBy: { year: 'asc' }
    })
    
    // Filter by normalized model family OR the old fallback logic
    const matchingCars = allCars.filter(c => {
       if (c.modelFamily) {
           const norm = normalizeModelFamilyName(c.modelFamily);
           if (norm.toLowerCase() === modelName.toLowerCase()) return true;
       }
       return extractModelFamily(c.name, brandName).toLowerCase() === modelName.toLowerCase();
    })
    
    // Grouping structure: Map<GenerationName, { categoryMap: Map<CategoryName, Car[]> }>
    const genBuckets = new Map<string, Map<string, typeof matchingCars>>()
    
    // Helper to add to bucket
    const addToBucket = (genName: string, category: string, car: typeof matchingCars[0]) => {
        if (!genBuckets.has(genName)) genBuckets.set(genName, new Map())
        const catMap = genBuckets.get(genName)!
        if (!catMap.has(category)) catMap.set(category, [])
        catMap.get(category)!.push(car)
    }

    const keywordGens = ['first generation', 'second generation', 'third generation', 'fourth generation', 'fifth generation', 'sixth generation', 'seventh generation', 'eighth generation', 'ninth generation', 'tenth generation', 'mk1', 'mk2', 'mk3', 'mk4', 'mk5', 'mk6', 'mk7', 'mk8', 'series i', 'series ii', 'series iii']
    
    for (const c of matchingCars) {
        // 1. Check explicit overrides first
        const override = TAXONOMY_OVERRIDES[brandName]?.[c.name]
        let assignedGen = override?.generation
        let assignedCat = override?.category
        
        // 2. Determine Category
        if (!assignedCat) {
           assignedCat = extractVariantCategory(c.name, c.horsepower)
        }
        
        // 3. Determine Generation
        if (!assignedGen) {
           const lowerName = c.name.toLowerCase()
           let foundGen = false
           // Try explicit string match in name
           for (const kw of keywordGens) {
               if (lowerName.includes(kw)) {
                   assignedGen = kw.replace(/\b\w/g, l => l.toUpperCase())
                   foundGen = true
                   break
               }
           }
           // Try Year overrides
           if (!foundGen && GENERATION_YEAR_OVERRIDES[brandName]?.[modelName]) {
              const yearRules = GENERATION_YEAR_OVERRIDES[brandName][modelName]
              for (const rule of yearRules) {
                 if (c.year >= rule.start && c.year <= rule.end) {
                    assignedGen = rule.name
                    foundGen = true
                    break
                 }
              }
           }
           // Fallback to Decades
           if (!foundGen) {
              const decade = Math.floor(c.year / 10) * 10
              assignedGen = c.year > 1900 ? `${decade}s Era` : 'Classic & Archives'
           }
        }
        
        addToBucket(assignedGen!, assignedCat, c)
    }
    
    const hierarchy = Array.from(genBuckets.entries()).map(([genName, catMap]) => {
        // Build categories
        const categories = Array.from(catMap.entries()).map(([catName, carsInCat]) => ({
            name: catName,
            variants: deduplicateByTrimIdentity(carsInCat, brandName, modelName)
        })).sort((a, b) => {
            // Order: Standard Lineup -> Performance -> Special Editions -> Other
            const order = ['Standard Lineup', 'Performance & Track', 'Special Editions', 'Other Variants']
            return order.indexOf(a.name) - order.indexOf(b.name)
        })
        
        // Calculate total variants in this generation
        const totalVariants = categories.reduce((acc, cat) => acc + cat.variants.length, 0)
        
        return {
           name: genName,
           categories,
           totalVariants,
           // For sorting: try to extract a year or use the earliest car's year
           sortYear: Array.from(catMap.values()).flat().reduce((min, car) => Math.min(min, car.year || 9999), 9999)
        }
    })
    
    hierarchy.sort((a,b) => {
        // Sort newest generation first based on the earliest car in that generation
        return b.sortYear - a.sortYear
    })
    
    return hierarchy
  } catch (err) {
    logger.error('fetchModelHierarchy failed', { error: String(err) })
    return []
  }
}
