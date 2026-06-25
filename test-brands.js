const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check what brands exist in the DB
  const brands = await prisma.car.findMany({
    select: { brand: true },
    distinct: ['brand'],
    orderBy: { brand: 'asc' },
  });
  console.log('All brands in DB:', brands.map(b => b.brand));
  
  // Check Tesla specifically
  const teslaCount = await prisma.car.count({ where: { brand: 'Tesla' } });
  console.log('\nTesla exact match count:', teslaCount);
  
  const teslaInsensitive = await prisma.car.count({ where: { brand: { equals: 'Tesla', mode: 'insensitive' } } });
  console.log('Tesla case-insensitive count:', teslaInsensitive);

  // Check isDemoted filter impact
  const teslaDemoted = await prisma.car.count({ where: { brand: 'Tesla', isDemoted: true } });
  console.log('Tesla demoted count:', teslaDemoted);
  
  const teslaNotDemoted = await prisma.car.count({ where: { brand: 'Tesla', isDemoted: false } });
  console.log('Tesla NOT demoted count:', teslaNotDemoted);
  
  // Check what the actual _fetchBrandModelFamilies query returns
  const HIDDEN_TYPES = ['Motorcycle', 'Commercial'];
  const allCars = await prisma.car.findMany({
    where: {
      brand: 'Tesla',
      type: { notIn: HIDDEN_TYPES },
      isDemoted: false,
    },
    select: { id: true, name: true, modelFamily: true, type: true, isDemoted: true },
    take: 10,
  });
  console.log('\nTesla query results (first 10):', allCars.length);
  allCars.forEach(c => console.log(`  - ${c.name} | modelFamily=${c.modelFamily} | type=${c.type}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
