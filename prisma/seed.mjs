import { promises as fs, existsSync } from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const shardsDir = path.join(process.cwd(), 'data', 'shards')
  
  if (!existsSync(shardsDir)) {
    console.log("No data/shards directory found. Skipping migration.")
    return
  }

  // Wipe existing data so we get a clean re-seed with enriched fields
  console.log("Clearing existing data...")
  await prisma.carSource.deleteMany()
  await prisma.carGalleryImage.deleteMany()
  await prisma.car.deleteMany()
  console.log("Cleared. Seeding fresh data...")

  
  const files = (await fs.readdir(shardsDir)).filter(f => f.startsWith('car_') && f.endsWith('.json'))

  console.log(`Found ${files.length} car shards. Migrating to SQLite...`)

  for (const file of files) {
    const filePath = path.join(shardsDir, file)
    const rawData = await fs.readFile(filePath, 'utf-8')
    const carData = JSON.parse(rawData)
    
    // Calculate weight safely
    let weightVal = null
    if (typeof carData.weight === 'number') {
      weightVal = carData.weight
    } else if (carData.weight_raw) {
      const parsed = parseInt(carData.weight_raw.replace(/,/g, ''))
      if (!isNaN(parsed)) weightVal = parsed
    }

    try {
      const existing = await prisma.car.findUnique({ where: { id: String(carData.id) } })
      let createdCar = existing;
      
      if (!existing) {
        // helper: parse int fields safely
        const intOrNull = (v) => { const n = parseInt(v); return isNaN(n) ? null : n }

        createdCar = await prisma.car.create({
          data: {
            // ── required ───────────────────────────────────
            id: String(carData.id),
            name: carData.name || 'Unknown',
            brand: carData.brand || 'Unknown',
            type: carData.type || 'Sedan',
            fuelType: carData.fuelType || 'Petrol',
            horsepower: Number(carData.horsepower) || 0,
            torque: Number(carData.torque) || 0,
            acceleration: Number(carData.acceleration) || 0,
            topSpeed: Number(carData.topSpeed) || 0,
            price: Number(carData.price) || 0,
            year: Number(carData.year) || new Date().getFullYear(),
            image: carData.image || '',
            description: carData.description || '',

            // ── powertrain ─────────────────────────────────
            mileage: carData.mileage || null,
            engine: carData.engine || null,
            drivetrain: carData.drivetrain || null,
            transmission: carData.transmission || null,
            fuelTankCapacity: carData.fuelTankCapacity || null,
            emissions: carData.emissions || null,

            // ── weight ─────────────────────────────────────
            weight: weightVal,

            // ── dimensions ────────────────────────────────
            seats: carData.seats != null ? intOrNull(String(carData.seats)) : null,
            doors: carData.doors != null ? intOrNull(String(carData.doors)) : null,
            wheelbase: carData.wheelbase != null ? intOrNull(String(carData.wheelbase)) : null,
            length: carData.length != null ? intOrNull(String(carData.length)) : null,
            width: carData.width != null ? intOrNull(String(carData.width)) : null,
            height: carData.height != null ? intOrNull(String(carData.height)) : null,
            groundClearance: carData.groundClearance != null ? intOrNull(String(carData.groundClearance)) : null,

            // ── handling ──────────────────────────────────
            aerodynamics: carData.aerodynamics || null,
            suspension: carData.suspension || null,
            brakes: carData.brakes || null,
            tires: carData.tires || null,
            driveModes: carData.driveModes || null,

            // ── tech & safety ─────────────────────────────
            infotainment: carData.infotainment || null,
            safetyFeatures: carData.safetyFeatures || null,

            // ── provenance ────────────────────────────────
            country: carData.country || null,
            launchDate: carData.launchDate || null,

            // ── links & meta ──────────────────────────────
            officialPageUrl: carData.officialPageUrl || null,
            specSheetUrl: carData.specSheetUrl || null,
            rating: carData.rating != null ? Number(carData.rating) : 0.0,
            views: Number(carData.views) || 0,
            favorites: Number(carData.favorites) || 0,
            featured: Boolean(carData.featured),
          }
        })
      }

      if (carData.sources && Array.isArray(carData.sources) && createdCar) {
        for (const src of carData.sources) {
          await prisma.carSource.create({
            data: {
              sourceId: String(src.sourceId || 'unknown'),
              sourceName: String(src.sourceName || src.name || 'Unknown'),
              url: src.url ? String(src.url) : null,
              carId: createdCar.id
            }
          })
        }
      }
      
    } catch (e) {
      console.error(`Error migrating car: ${carData.name} - ${e}`)
    }
  }

  console.log('Migration complete.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
