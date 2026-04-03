import Link from 'next/link'
import { Building2, ChevronRight } from 'lucide-react'
import { CompareBar } from '@/components/compare-bar'
import { fetchCarsList, fetchBrands } from '@/lib/api-service'

export default async function BrandsPage() {
  const cars = await fetchCarsList()
  const brands = await fetchBrands()

  const brandStats = brands.map((brand) => {
    const count = cars.filter((car) => car.brand === brand).length
    return { name: brand, count }
  })

  return (
    <main className="min-h-screen bg-background">

      <div className="pt-24 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gradient">Brands</h1>
                <p className="text-muted-foreground">
                  Explore {brands.length} premium automotive brands
                </p>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {brandStats.map((brand) => (
              <Link
                key={brand.name}
                href={`/brands/${encodeURIComponent(brand.name)}`}
                prefetch={false}
                className="group relative overflow-hidden rounded-2xl bg-card border border-border p-6 text-left transition-all duration-500 hover:border-primary/50 hover:glow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{brand.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {brand.count} {brand.count === 1 ? 'model' : 'models'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <CompareBar />
    </main>
  )
}
