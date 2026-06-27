import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function run() {
  const brandStats = await prisma.car.groupBy({
    by: ['brand', 'modelFamily'],
    where: { brand: { notIn: ['Polestar', 'Shelby', 'smart', 'Smart', 'Plymouth'] }, isDemoted: false },
  })

  const countByBrand: Record<string, number> = {}
  for (const b of brandStats) {
    if (b.modelFamily) {
      countByBrand[b.brand] = (countByBrand[b.brand] || 0) + 1
    }
  }
  
  console.log("Alfa Romeo models:", countByBrand['Alfa Romeo'])
  
  // What if we just group by name?
  const brandStatsByName = await prisma.car.groupBy({
    by: ['brand', 'name'],
    where: { brand: { notIn: ['Polestar', 'Shelby', 'smart', 'Smart', 'Plymouth'] }, isDemoted: false },
  })
  
  const countByBrandName: Record<string, number> = {}
  for (const b of brandStatsByName) {
    countByBrandName[b.brand] = (countByBrandName[b.brand] || 0) + 1
  }
  
  console.log("Alfa Romeo distinct names:", countByBrandName['Alfa Romeo'])
}
run()
