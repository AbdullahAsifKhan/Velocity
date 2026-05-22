import React from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Fuel,
  Activity,
  Car as CarIcon,
  Users,
  Weight,
  Calendar,
  Settings,
  Star,
  Gauge,
  Shield,
  Wifi,
  Layers,
  Wind,
  Globe,
  Disc,
  CircleOff,
  LayoutGrid,
  Ruler,
  Maximize2,
  MoveHorizontal,
  ArrowUpFromLine,
} from 'lucide-react'
import { Speedometer } from '@/components/speedometer'
import { CarCard } from '@/components/car-card'
import { CompareBar } from '@/components/compare-bar'
import { RelatedModels } from '@/components/related-models'
import { fetchCarById, fetchSimilarCars, fetchModelHierarchy, fetchCarRelationships, extractModelFamily } from '@/lib/api-service'
import { CarGallery, CarActions, ReportIssueButton, CarRating } from '@/components/car-details-client'
import { estimatePerformance, estimatePrice } from '@/lib/utils'

export const revalidate = 3600 // Cache page for 1 hour (ISR)

export default async function CarDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const car = await fetchCarById(id)

  if (!car) notFound()

  // Fetch similar cars, model hierarchy, and relationships in parallel
  const modelFamilyName = extractModelFamily(car.name, car.brand)
  const [similarCars, fullHierarchy, relationships] = await Promise.all([
    fetchSimilarCars(car, 4) as Promise<typeof car[]>,
    fetchModelHierarchy(car.brand, modelFamilyName),
    fetchCarRelationships(id),
  ])

  // ── Spec groups ───────────────────────────────────────────────────────────
  const taxonomy = [
    { label: 'Generation',    value: car.generation },
    { label: 'Years Active',  value: car.generationStart ? `${car.generationStart} – ${car.generationEnd || 'Present'}` : null },
    { label: 'Facelift Year', value: car.faceliftYear ? String(car.faceliftYear) : null },
    { label: 'Body Style',    value: car.bodyStyle },
    { label: 'Variant Type',  value: car.variantType ? car.variantType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : null },
  ].filter(s => s.value)

  const powertrain = [
    { label: 'Engine',        value: car.engine },
    { label: 'Transmission',  value: car.transmission },
    { label: 'Drivetrain',    value: car.drivetrain },
    { label: 'Fuel Type',     value: car.fuelType },
    { label: 'Tank Capacity', value: car.fuelTankCapacity },
    { label: 'Mileage',       value: car.mileage },
    { label: 'Emissions',     value: car.emissions },
  ].filter(s => s.value)

  const chassis = [
    { label: 'Seats',            value: car.seats != null ? String(car.seats) : null },
    { label: 'Doors',            value: car.doors != null ? String(car.doors) : null },
    { label: 'Curb Weight',      value: car.weight != null ? `${car.weight.toLocaleString()} kg` : null },
    { label: 'Length',           value: car.length != null ? `${car.length.toLocaleString()} mm` : null },
    { label: 'Width',            value: car.width != null ? `${car.width.toLocaleString()} mm` : null },
    { label: 'Height',           value: car.height != null ? `${car.height.toLocaleString()} mm` : null },
    { label: 'Wheelbase',        value: car.wheelbase != null ? `${car.wheelbase.toLocaleString()} mm` : null },
    { label: 'Ground Clearance', value: car.groundClearance != null ? `${car.groundClearance} mm` : null },
  ].filter(s => s.value)

  const handling = [
    { label: 'Aerodynamics', value: car.aerodynamics },
    { label: 'Suspension',   value: car.suspension },
    { label: 'Brakes',       value: car.brakes },
    { label: 'Tires',        value: car.tires },
    { label: 'Drive Modes',  value: car.driveModes },
  ].filter(s => s.value)

  const techSafety = [
    { label: 'Infotainment',    value: car.infotainment },
    { label: 'Safety Features', value: car.safetyFeatures },
  ].filter(s => s.value)

  const provenance = [
    { label: 'Country',      value: car.country },
    { label: 'Launch Date',  value: car.launchDate },
    { label: 'Model Year',   value: String(car.year) },
  ].filter(s => s.value)

  // ── Spec section component ─────────────────────────────────────────────────
  const SpecGrid = ({
    title,
    specs,
  }: {
    title: string
    specs: { label: string; value?: string | null }[]
  }) =>
    specs.length === 0 ? null : (
      <div className="mb-10">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 pb-2 border-b border-border/40">{title}</h3>
        <dl className="divide-y divide-border/30">
          {specs.map((spec) => (
            <div key={spec.label} className="grid grid-cols-[180px_1fr] py-2.5 gap-4">
              <dt className="text-sm text-muted-foreground flex-shrink-0">{spec.label}</dt>
              <dd className="text-sm font-medium text-foreground leading-relaxed">{spec.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    )

  return (
    <main className="min-h-screen bg-background">

      <div className="pt-20">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Collection
          </Link>
        </div>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid lg:grid-cols-2 gap-12">
            <CarGallery car={car} />

            <div className="flex flex-col">
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-primary uppercase tracking-wider">
                      {car.brand}
                    </span>
                    <span className="text-muted-foreground/40 text-sm">•</span>
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      {modelFamilyName}
                    </span>
                  </div>
                  <ReportIssueButton car={car} />
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gradient mb-4">
                  {car.cleanName || car.name}
                </h1>

                {/* Taxonomy Lineage */}
                {(car.generation || car.bodyStyle || car.variantType) && (
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest mb-6">
                    {car.generation && (
                      <div className="flex items-center gap-1.5 text-primary/80 bg-primary/10 px-2 py-1 rounded-md">
                        <Layers className="w-3.5 h-3.5" />
                        {car.generation}
                      </div>
                    )}
                    {car.faceliftYear && (
                      <>
                        {car.generation && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                        <span className="px-2 py-1 bg-secondary rounded-md">FL {car.faceliftYear}</span>
                      </>
                    )}
                    {car.bodyStyle && (
                      <>
                        {(car.generation || car.faceliftYear) && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                        <span className="px-2 py-1 bg-secondary rounded-md">{car.bodyStyle}</span>
                      </>
                    )}
                    {car.variantType && (
                      <>
                        {(car.generation || car.faceliftYear || car.bodyStyle) && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                        <span className="px-2 py-1 bg-secondary rounded-md">{car.variantType.replaceAll('_', ' ')}</span>
                      </>
                    )}
                  </div>
                )}

                <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  {car.description}
                </p>

                <div className="mb-6 flex items-end justify-between">
                  <div>
                    <span className="text-sm text-muted-foreground">Starting from</span>
                    <div className="text-4xl font-bold text-primary">
                      {car.price > 0 ? `$${car.price.toLocaleString('en-US')}` : `$${estimatePrice(car).toLocaleString('en-US')}`}
                    </div>
                    {car.priceNote && (
                      <p className="text-xs text-muted-foreground/80 mt-1 uppercase tracking-widest font-medium">
                        {car.priceNote}
                      </p>
                    )}
                  </div>
                  
                  {/* Rating moved here */}
                  <CarRating carId={car.id} initialRating={car.rating ?? 0} />
                </div>

                <CarActions car={car} />

                {/* Quick specs row */}
                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-border/40 pt-5">
                  {powertrain.slice(0, 6).map((spec) => (
                    <div key={spec.label} className="flex items-baseline gap-1.5">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{spec.label}</span>
                      <span className="text-sm font-semibold">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Performance Metrics */}
        <section className="section-gap bg-card/30 border-y border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gradient text-glow">
                Performance
              </h2>
              <p className="text-sm text-muted-foreground mt-3">Key performance metrics at a glance</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              <Speedometer value={estimatePerformance(car).hp} maxValue={1200} label="Horsepower" unit="hp" />
              <Speedometer value={estimatePerformance(car).torque} maxValue={1500} label="Torque" unit="Nm" />
              <Speedometer value={estimatePerformance(car).accel} maxValue={10} label="0–100 km/h" unit="sec" />
              <Speedometer value={estimatePerformance(car).topSpeed} maxValue={400} label="Top Speed" unit="km/h" />
            </div>
          </div>
        </section>

        {/* Full Technical Specifications */}
        <section className="section-gap max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gradient mb-8">Technical Specifications</h2>
          <SpecGrid title="Taxonomy & Lineage" specs={taxonomy} />
          <SpecGrid title="Powertrain & Economy" specs={powertrain} />
          <SpecGrid title="Dimensions & Chassis" specs={chassis} />
          <SpecGrid title="Handling" specs={handling} />
          <SpecGrid title="Technology & Safety" specs={techSafety} />
          <SpecGrid title="Provenance" specs={provenance} />
        </section>

        {/* Model Trim Grid — All generations of this model family */}
        {fullHierarchy.length > 0 && (
          <section className="section-gap max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-border/40">
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gradient">The {modelFamilyName} Family</h2>
                <p className="text-muted-foreground mt-2">Explore other generations and officially recognized trims in the {car.brand} {modelFamilyName} lineup.</p>
              </div>
              <Link 
                href={`/brands/${car.brand}/${modelFamilyName}`}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-semibold transition-all duration-300 backdrop-blur-md"
              >
                View Hub <ArrowUpFromLine className="w-4 h-4 rotate-90" />
              </Link>
            </div>

            <div className="space-y-16">
              {fullHierarchy.map((generation) => (
                <div key={generation.name} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-semibold text-foreground tracking-tight flex items-center gap-3">
                      <Layers className="w-5 h-5 text-primary" />
                      {generation.name}
                    </h3>
                    <div className="h-px bg-border/50 flex-1" />
                    <span className="text-xs font-medium px-3 py-1 bg-secondary rounded-full text-secondary-foreground">
                      {generation.totalVariants} Trim{generation.totalVariants !== 1 && 's'}
                    </span>
                  </div>
                  
                  <div className="space-y-8">
                    {generation.categories.map((category) => (
                      <div key={category.name} className="space-y-4">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">{category.name}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                          {category.variants.map((variant, i) => (
                            <CarCard key={variant.id} car={variant as any} index={i} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Models (Cross-links: rebadges, platform siblings, EV sisters) */}
        {relationships.length > 0 && (
          <section className="section-gap max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-border/40">
            <RelatedModels relationships={relationships} />
          </section>
        )}

        {/* Similar Cars */}
        {similarCars.length > 0 && (
          <section className="section-gap max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-border/40">
            <h2 className="text-2xl sm:text-3xl font-bold text-gradient mb-8">Similar Cars</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarCars.map((c, i) => (
                <CarCard key={c.id} car={c} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>

      <CompareBar />

      {/* Data Sources Footer */}
      {(car.officialPageUrl || (car.sources && car.sources.length > 0)) && (
        <footer className="border-t border-border/40 py-8 bg-card/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Data Specification Sources
            </h3>
            <div className="flex flex-wrap gap-3">
              {/* If sources relation is empty, safely fallback to OfficialPageUrl (Usually wikipedia) */}
              {(!car.sources || car.sources.length === 0) && car.officialPageUrl && (
                <a
                  href={car.officialPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors bg-accent/30 px-3 py-1.5 rounded-md border border-border/50 backdrop-blur-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-primary/80" />
                  Wikipedia (Wikimedia Commons)
                </a>
              )}

              {/* Native sources list */}
              {car.sources && car.sources.length > 0 && Array.from(
                new Map(car.sources.map(s => [s.url ?? s.sourceName, s])).values()
              ).map((source, idx) =>
                source.url ? (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors bg-accent/30 px-3 py-1.5 rounded-md border border-border/50 backdrop-blur-sm"
                  >
                    <span className="w-2 h-2 rounded-full bg-primary/80" />
                    {source.sourceName}
                  </a>
                ) : (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-accent/20 px-3 py-1.5 rounded-md border border-border/40"
                  >
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                    {source.sourceName}
                  </span>
                )
              )}
            </div>
            <p className="mt-4 text-[10px] text-muted-foreground/60 max-w-2xl leading-relaxed">
              Vehicle specifications and imagery are aggregated from public repositories including Wikipedia, the National Highway Traffic Safety Administration (NHTSA), and API-Ninjas. We strongly recommend verifying with official manufacturer documentation before purchasing decisions inside the application.
            </p>
          </div>
        </footer>
      )}
    </main>
  )
}
