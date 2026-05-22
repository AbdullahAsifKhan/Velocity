import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, ChevronDown, CalendarDays, RefreshCw, LayoutList } from 'lucide-react'
import { CarGrid } from '@/components/car-grid'
import { VariantComparisonTable } from '@/components/variant-comparison-table'
import { CompareBar } from '@/components/compare-bar'
import { BrandLogo } from '@/components/brand-logo'
import { fetchModelHierarchy } from '@/lib/api-service'
import type { Car } from '@/lib/types'

export const revalidate = 3600

// Number of variants to show as cards before switching to comparison table
const CARD_DISPLAY_LIMIT = 4

export default async function ModelPage({
  params,
}: {
  params: Promise<{ brand: string, model: string }>
}) {
  const { brand, model } = await params
  const brandName = decodeURIComponent(brand)
  const modelName = decodeURIComponent(model)
  
  const hierarchy = await fetchModelHierarchy(brandName, modelName)

  if (hierarchy.length === 0) notFound()

  // Calculate totals
  const totalVariants = hierarchy.reduce((acc, g) => acc + g.totalVariants, 0)

  return (
    <main className="min-h-screen bg-background pb-32">
      {/* Hero Section */}
      <div className="relative pt-24 pb-12 overflow-hidden border-b border-border/40">
         <div className="absolute inset-0 bg-secondary/30" />
         <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
         
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
           <Link
             href={`/brands/${encodeURIComponent(brandName)}`}
             className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 text-sm"
           >
             <ChevronRight className="w-4 h-4 rotate-180" />
             Back to {brandName} Models
           </Link>

           <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center drop-shadow-xl">
                <BrandLogo 
                  brand={brandName} 
                  className="w-full h-full object-contain" 
                  fallbackClassName="w-full h-full opacity-50"
                />
              </div>
              
              <div className="flex-1">
                 <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-2">
                   {brandName} <span className="text-primary">{modelName}</span>
                 </h1>
                 <p className="text-lg text-muted-foreground">
                   {hierarchy.length} {hierarchy.length === 1 ? 'Generation' : 'Generations'} 
                   <span className="mx-3 opacity-30">|</span> 
                   {totalVariants} Total Variants
                 </p>
              </div>
           </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="space-y-6">
          {hierarchy.map((group, idx) => {
            // Option C: Show cards for first 4, comparison table for the rest
            const allVariants = group.categories.flatMap(cat => cat.variants) as Car[]
            const cardVariants = allVariants.slice(0, CARD_DISPLAY_LIMIT)
            const tableVariants = allVariants.length > CARD_DISPLAY_LIMIT ? allVariants : null

            return (
             <details 
               key={group.name} 
               className="group bg-card rounded-2xl border border-border/60 overflow-hidden [&_summary::-webkit-details-marker]:hidden shadow-sm"
               open={idx === 0}
             >
                <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-secondary/20 transition-colors select-none">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                       <CalendarDays className="w-5 h-5" />
                     </div>
                     <div>
                       <h2 className="text-2xl font-bold flex items-center gap-3 flex-wrap">
                         {group.name}
                         {group.yearRange && (
                           <span className="text-base font-normal text-muted-foreground">
                             ({group.yearRange})
                           </span>
                         )}
                       </h2>
                       <p className="text-sm text-muted-foreground mt-0.5">
                         {group.totalVariants} {group.totalVariants === 1 ? 'Trim' : 'Trims'} available
                       </p>
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-3">
                     {/* Facelift badge — council rule: facelift = badge, never a separate card */}
                     {group.faceliftYear && (
                       <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold 
                                        bg-amber-500/10 text-amber-600 dark:text-amber-400 
                                        rounded-full border border-amber-500/20">
                         <RefreshCw className="w-3 h-3" />
                         Refreshed {group.faceliftYear}
                       </span>
                     )}
                     
                     <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                       <ChevronDown className="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform duration-300" />
                     </div>
                   </div>
                </summary>
                
                <div className="p-6 pt-4 border-t border-border/40 bg-background/50 space-y-8">
                   {/* Facelift badge for mobile (shown inside expanded content) */}
                   {group.faceliftYear && (
                     <div className="sm:hidden">
                       <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold 
                                        bg-amber-500/10 text-amber-600 dark:text-amber-400 
                                        rounded-full border border-amber-500/20">
                         <RefreshCw className="w-3 h-3" />
                         Mid-cycle refresh in {group.faceliftYear}
                       </span>
                     </div>
                   )}

                   {/* Option C: Card grid for first 4 variants */}
                   {group.categories.length > 0 && (
                     <div className="space-y-6">
                       {group.categories.map((cat) => {
                         const showCards = cat.variants.slice(0, CARD_DISPLAY_LIMIT) as Car[]
                         return (
                           <div key={cat.name}>
                             <h3 className="text-lg font-semibold mb-4 text-foreground/80 flex items-center gap-2">
                               <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                               {cat.name}
                               <span className="text-sm font-normal text-muted-foreground ml-2">({cat.variants.length})</span>
                             </h3>
                             <CarGrid cars={showCards} />
                           </div>
                         )
                       })}
                     </div>
                   )}

                   {/* Option C: Comparison table when > 4 variants exist */}
                   {tableVariants && tableVariants.length > 0 && (
                     <div className="mt-6 pt-6 border-t border-border/30">
                       <div className="flex items-center gap-2 mb-4">
                         <LayoutList className="w-4 h-4 text-primary" />
                         <h4 className="text-sm font-semibold text-foreground">
                           All {allVariants.length} Trims — Comparison
                         </h4>
                       </div>
                       <VariantComparisonTable variants={tableVariants} />
                     </div>
                   )}
                </div>
             </details>
            )
          })}
        </div>
      </div>

      <CompareBar />
    </main>
  )
}
