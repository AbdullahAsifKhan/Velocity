import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Building2, ChevronRight } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { CarGrid } from '@/components/car-grid'
import { CompareBar } from '@/components/compare-bar'
import { cars } from '@/lib/data'

export default async function BrandPage({
  params,
}: {
  params: Promise<{ brand: string }>
}) {
  const { brand } = await params
  const brandName = decodeURIComponent(brand)
  const brandCars = cars.filter((car) => car.brand === brandName)

  if (brandCars.length === 0) notFound()

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-24 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gradient">{brandName}</h1>
                <p className="text-muted-foreground">
                  {brandCars.length} {brandCars.length === 1 ? 'model' : 'models'} available
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/brands"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to All Brands
          </Link>

          <CarGrid cars={brandCars} />
        </div>
      </div>

      <CompareBar />
    </main>
  )
}
