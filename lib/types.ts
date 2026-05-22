// This file mirrors the Prisma Car model and related types for use across the frontend.
// The Prisma-generated type from @prisma/client is the source of truth for DB queries,
// but this re-exports a clean interface for the UI layer.

export interface CarSource {
  id: string
  sourceId: string
  sourceName: string
  url?: string | null
  retrievedAt: Date | string
  carId: string
}

export interface CarGalleryImage {
  id: string
  url: string
  source: string   // "wiki_original", "wiki_commons", "unsplash", "press"
  priority: number  // lower = higher priority (10=press, 30=wiki_original, 50=wiki_thumb)
  perceptualHash?: string | null  // 64-bit pHash hex for image dedup
  isHeroImage?: boolean           // true = canonical generation hero image
  isSharedImage?: boolean         // true = near-duplicate fallback photo shared across variants
  carId: string
}

export type RelationshipType = 'rebadge' | 'platform_sibling' | 'ev_sister' | 'regional_variant'

export interface CarRelationship {
  id: string
  sourceCarId: string
  targetCarId: string
  relationshipType: RelationshipType
  note?: string | null
  // Populated when fetched with includes
  targetCar?: Partial<Car>
  sourceCar?: Partial<Car>
}

export type VariantType = 'trim' | 'powertrain' | 'special_edition' | 'regional' | 'rebadge' | 'concept'

export interface Car {
  id: string
  name: string
  cleanName?: string | null
  brand: string
  type: 'Sports' | 'Electric' | 'SUV' | 'Sedan' | 'Luxury' | 'Hatchback' | 'Pickup' | string
  fuelType: 'Petrol' | 'Electric' | 'Hybrid' | string
  
  // Performance
  horsepower: number
  torque: number
  acceleration: number
  topSpeed: number
  
  // Economy / Powertrain
  mileage?: string | null
  engine?: string | null
  transmission?: string | null
  drivetrain?: string | null
  fuelTankCapacity?: string | null
  emissions?: string | null
  
  // Pricing & Provenance
  price: number
  priceNote?: string | null
  year: number
  country?: string | null
  launchDate?: string | null
  
  // Dimensions & Chassis
  seats?: number | null
  doors?: number | null
  weight?: number | null
  length?: number | null   // mm
  width?: number | null    // mm
  height?: number | null   // mm
  wheelbase?: number | null // mm
  groundClearance?: number | null // mm
  
  // Handling
  aerodynamics?: string | null
  suspension?: string | null
  brakes?: string | null
  tires?: string | null
  driveModes?: string | null
  
  // Tech & Safety
  infotainment?: string | null
  safetyFeatures?: string | null
  
  // Media
  image: string
  images?: CarGalleryImage[]
  gallery?: string[]

  // Metadata
  rating?: number | null
  views?: number
  favorites?: number
  featured?: boolean
  description: string
  specSheetUrl?: string | null
  officialPageUrl?: string | null
  sources?: CarSource[]

  // ── Council Taxonomy: 5-level hierarchy ──
  modelFamily?: string | null
  generation?: string | null          // e.g. "8th Gen (XV70)"
  generationStart?: number | null     // production start year
  generationEnd?: number | null       // production end year
  bodyStyle?: string | null           // "Sedan", "Coupe", "Wagon", etc.
  faceliftYear?: number | null        // e.g. 2021
  variantType?: VariantType | null    // "trim", "powertrain", "special_edition", etc.
  classifyConfidence?: number | null  // 0–1 from classifier

  // ── Cross-linking ──
  relationships?: CarRelationship[]
}
