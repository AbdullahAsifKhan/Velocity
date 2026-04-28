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
  carId: string
}

export interface Car {
  id: string
  name: string
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
}
