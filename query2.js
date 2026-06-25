const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const cars = await prisma.car.findMany({
    where: {
      OR: [
        { name: { contains: 'Sealion' } },
        { name: { contains: 'TL' } },
        { name: { contains: 'ARX-06' } },
        { name: { contains: 'Daytona SP3' } },
        { name: { contains: 'CCX' } },
        { name: { contains: 'Armada' } },
        { name: { contains: 'Mistral' } },
        { name: { contains: 'Utopia' } }
      ]
    },
    select: {
      name: true,
      image: true,
      images: {
        select: {
          url: true
        }
      }
    },
    take: 15
  });
  console.log(JSON.stringify(cars, null, 2));
}
main().finally(() => prisma.$disconnect());
