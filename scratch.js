const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const HIDDEN_TYPES = ['Motorcycle', 'Commercial']
  const HIDDEN_BRANDS = ['Polestar', 'Shelby', 'smart', 'Smart', 'Plymouth']

  const base = {
    isCanonical: true,
    image: { not: '' },
    isDemoted: false,
    type: { notIn: HIDDEN_TYPES },
    brand: { notIn: HIDDEN_BRANDS },
  };

  const count1 = await prisma.car.count({ where: base });
  console.log("Base count:", count1);

  const count2 = await prisma.car.count({ where: { ...base, horsepower: { gt: 100 } } });
  console.log("With horsepower > 100:", count2);

  const count3 = await prisma.car.count({ where: { ...base, horsepower: { gt: 100 }, acceleration: { gt: 0 } } });
  console.log("With acceleration > 0:", count3);

  const count4 = await prisma.car.count({ where: { ...base, horsepower: { gt: 100 }, topSpeed: { gt: 0 } } });
  console.log("With topSpeed > 0:", count4);
  
  const count5 = await prisma.car.count({ where: { ...base, horsepower: { gt: 100 }, acceleration: { gt: 0 }, topSpeed: { gt: 0 } } });
  console.log("With all three:", count5);
}
main().then(() => process.exit(0)).catch(console.error);
