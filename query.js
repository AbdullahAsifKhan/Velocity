const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const cars = await prisma.car.findMany({ select: { name: true, image: true }, take: 10 });
    console.log(cars);
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
