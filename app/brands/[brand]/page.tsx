import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Building2, ChevronRight, Hash } from 'lucide-react'
import { ModelGrid } from '@/components/model-grid'
import { CompareBar } from '@/components/compare-bar'
import { BrandLogo } from '@/components/brand-logo'
import { fetchBrandModelFamilies } from '@/lib/api-service'
import { Metadata } from 'next'

export const revalidate = 3600 // ISR: revalidate every hour

export async function generateMetadata({ params }: { params: Promise<{ brand: string }> }): Promise<Metadata> {
  const { brand } = await params
  const brandName = decodeURIComponent(brand)
  
  const title = `${brandName} Models`
  const description = `Explore the complete lineup of ${brandName} vehicles. View model families, technical specifications, and historical generations.`
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    }
  }
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ brand: string }>
}) {
  const { brand } = await params
  const brandName = decodeURIComponent(brand)
  const models = await fetchBrandModelFamilies(brandName)

  if (models.length === 0) notFound()
  
  const totalVariants = models.reduce((acc, m) => acc + m.totalVariants, 0)

  return (
    <main className="min-h-screen bg-background">

      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center drop-shadow-lg">
                <BrandLogo 
                  brand={brandName} 
                  className="w-full h-full object-contain" 
                  fallbackClassName="w-full h-full opacity-50"
                />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gradient">{brandName}</h1>
                <p className="text-muted-foreground mt-1 text-sm font-medium">
                  {models.length} {models.length === 1 ? 'Model Family' : 'Model Families'} available
                  <span className="text-muted-foreground/50 ml-2 font-normal">
                    · {totalVariants} total variants
                  </span>
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

          <ModelGrid brand={brandName} models={models} />
        </div>
      </div>

      <CompareBar />
    </main>
  )
}
