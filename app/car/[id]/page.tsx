import React from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
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
import { fetchCarById, fetchCarsList } from '@/lib/api-service'
import { CarGallery, CarActions } from '@/components/car-details-client'

export const revalidate = 3600 // Cache page for 1 hour (ISR)

export default async function CarDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const car = await fetchCarById(id)

  if (!car) notFound()

  const allCarsList = await fetchCarsList()
  const similarCars = allCarsList
    .filter((c) => c.id !== car.id && c.type === car.type)
    .slice(0, 4) as typeof car[]

  // ── Spec groups ───────────────────────────────────────────────────────────
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
                {/* Brand & Rating */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-primary uppercase tracking-wider">
                    {car.brand}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-accent fill-accent" />
                    <span className="font-medium">{car.rating?.toFixed(1) ?? '—'}</span>
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gradient mb-4">
                  {car.name}
                </h1>

                <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  {car.description}
                </p>

                {/* Price */}
                <div className="mb-8">
                  <span className="text-sm text-muted-foreground">Starting from</span>
                  <div className="text-4xl font-bold text-primary">
                    ${car.price.toLocaleString('en-US')}
                  </div>
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
        <section className="py-24 bg-card/30 border-y border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gradient text-center mb-16">
              Performance
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              <Speedometer value={car.horsepower} maxValue={1200} label="Horsepower" unit="hp" />
              <Speedometer value={car.torque} maxValue={1500} label="Torque" unit="Nm" />
              <Speedometer value={car.acceleration} maxValue={10} label="0–100 km/h" unit="sec" />
              <Speedometer value={car.topSpeed} maxValue={400} label="Top Speed" unit="km/h" />
            </div>
          </div>
        </section>

        {/* Full Technical Specifications */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gradient mb-12">Technical Specifications</h2>
          <SpecGrid title="Powertrain & Economy" specs={powertrain} />
          <SpecGrid title="Dimensions & Chassis" specs={chassis} />
          <SpecGrid title="Handling" specs={handling} />
          <SpecGrid title="Technology & Safety" specs={techSafety} />
          <SpecGrid title="Provenance" specs={provenance} />
        </section>

        {/* Similar Cars */}
        {similarCars.length > 0 && (
          <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-border/40">
            <h2 className="text-2xl sm:text-3xl font-bold text-gradient mb-12">Similar Cars</h2>
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
      {car.sources && car.sources.length > 0 && (
        <footer className="border-t border-border/40 py-8 bg-card/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Data Sources
            </h3>
            <div className="flex flex-wrap gap-3">
              {/* Deduplicate by URL before rendering */}
              {Array.from(
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
            <p className="mt-4 text-[10px] text-muted-foreground/60 max-w-2xl">
              Vehicle specifications are automatically aggregated from leading public sources.
              Always refer to official manufacturer documentation for purchasing decisions.
            </p>
          </div>
        </footer>
      )}
    </main>
  )
}
