const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Canonical cars without modelFamily:', await prisma.car.count({ where: { isCanonical: true, modelFamily: null } }));
}

main().catch(console.error).finally(() => prisma.$disconnect());
