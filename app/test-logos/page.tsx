import { BrandLogo } from '@/components/brand-logo'

const brands = [
  'Volvo', 'Cadillac', 'Acura', 'Polestar', 'Suzuki', 'Aston Martin', 'Mitsubishi', 'BYD', 'Ferrari', 'Chrysler', 'Isuzu', 'GMC', 'Maybach', 'Lincoln', 'Honda', 'Daewoo', 'Chevrolet', 'Shelby', 'Saturn', 'Porsche', 'Alfa Romeo', 'Rolls-Royce', 'Jaguar', 'Mini', 'Kia', 'Lotus', 'Pagani', 'Bugatti', 'Mercedes-Benz', 'Lamborghini', 'Oldsmobile', 'Fiat', 'Land Rover', 'Buick', 'Nissan', 'Genesis', 'Saab', 'Hyundai', 'Subaru', 'Mazda', 'BMW', 'Volkswagen', 'Mercury', 'Hummer', 'Toyota'
]

export default function TestLogos() {
  return (
    <div className="p-8 bg-background min-h-screen">
      <h1 className="text-2xl mb-4 text-foreground">Brand Logos Test</h1>
      <p className="text-muted-foreground mb-8">Showing all {brands.length} brand logos. Each card shows the logo on both light and dark backgrounds.</p>
      <div className="grid grid-cols-4 gap-6">
        {brands.map(brand => (
          <div key={brand} className="flex flex-col items-center gap-3 border border-border p-4 rounded-xl">
            <h2 className="text-sm font-semibold text-foreground">{brand}</h2>
            {/* Light background card */}
            <div className="w-full flex gap-2">
              <div className="flex-1 bg-white rounded-lg p-3 flex items-center justify-center h-24">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={`/logos/${brand.toLowerCase().replace(/ /g, '-').replace(/shelby/, 'saleen')}.png`}
                  alt={`${brand} logo`}
                  className="object-contain w-full h-full"
                />
              </div>
              <div className="flex-1 bg-[#0a0a0f] rounded-lg p-3 flex items-center justify-center h-24">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={`/logos/${brand.toLowerCase().replace(/ /g, '-').replace(/shelby/, 'saleen')}.png`}
                  alt={`${brand} logo`}
                  className="object-contain w-full h-full"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
