export const CATEGORY_TABS = [
  { label: 'All', filter: null },
  { label: 'SUV', filter: { OR: [{ bodyStyle: 'SUV' }, { type: 'SUV' }] } },
  { label: 'Sedan', filter: { OR: [{ bodyStyle: 'Sedan' }, { type: 'Sedan' }] } },
  { label: 'Sports', filter: { type: 'Sports' } },
  { label: 'Electric', filter: { fuelType: 'Electric' } },
  { label: 'Luxury', filter: { type: 'Luxury' } },
  { label: 'Hatchback', filter: { OR: [{ bodyStyle: 'Hatchback' }, { type: 'Hatchback' }] } },
  { label: 'Pickup', filter: { OR: [{ bodyStyle: 'Pickup' }, { type: 'Pickup' }] } },
  { label: 'Wagon', filter: { OR: [{ bodyStyle: 'Wagon' }, { type: 'Wagon' }] } },
] as const;

export const types = CATEGORY_TABS.map(t => t.label) as unknown as readonly string[]

export type CarType = typeof CATEGORY_TABS[number]['label']

export const BRAND_SEGMENTS: Record<string, string[]> = {
  hypercar:    ['Bugatti', 'Pagani', 'Koenigsegg', 'Rimac', 'SSC'],
  supercar:    ['Ferrari', 'Lamborghini', 'McLaren', 'Aston Martin', 'Lotus'],
  luxury:      ['Rolls-Royce', 'Bentley', 'Maserati', 'Maybach'],
  premium:     ['Porsche', 'BMW', 'Mercedes-Benz', 'Audi', 'Lexus', 'Jaguar', 'Genesis', 'Cadillac', 'Lincoln', 'Volvo', 'Alfa Romeo', 'Infiniti', 'Acura'],
  performance: ['Dodge', 'Chevrolet', 'Ford', 'Nissan', 'Subaru', 'Mazda', 'Polestar'],
  ev:          ['Tesla', 'Rivian', 'Lucid', 'Polestar', 'NIO'],
  mainstream:  ['Toyota', 'Honda', 'Hyundai', 'Kia', 'Volkswagen', 'Chevrolet', 'Ford', 'Nissan', 'Mazda', 'Subaru'],
  offroad:     ['Jeep', 'Land Rover', 'Toyota', 'Ford'],
}

export function getSegmentsForBrand(brand: string): string[] {
  const segments: string[] = []
  for (const [segment, brands] of Object.entries(BRAND_SEGMENTS)) {
    if (brands.some(b => b.toLowerCase() === brand.toLowerCase())) {
      segments.push(segment)
    }
  }
  return segments
}
