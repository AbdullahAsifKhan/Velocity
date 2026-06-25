const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.car.count({
    where: {
      image: {
        contains: 'placehold.co'
      }
    }
  });
  console.log('Placehold.co count:', count);
}
main().finally(() => prisma.$disconnect());
