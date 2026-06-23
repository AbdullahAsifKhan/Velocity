const { fetchBrandModelFamilies, fetchCarById } = require('./lib/api-service.ts');

async function main() {
  console.log("Testing API Service outside of Next.js...");
  const models = await fetchBrandModelFamilies('Tesla');
  console.log('Tesla models:', models.length);
}

main().catch(console.error);
