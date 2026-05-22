import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const cars = await prisma.car.findMany({
    select: { id: true, name: true, images: true, image: true }
  });
  
  const pdfs = cars.filter(c => 
    (c.image && c.image.toLowerCase().includes('.pdf')) || 
    (c.images && c.images.some(url => url.toLowerCase().includes('.pdf')))
  );
  
  console.log(`Cars with PDF in image or images: ${pdfs.length}`);
  if (pdfs.length > 0) {
      console.log(pdfs.slice(0, 5).map(c => c.name));
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
