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
} from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Speedometer } from '@/components/speedometer'
import { CarCard } from '@/components/car-card'
import { CompareBar } from '@/components/compare-bar'
import { cars, carMap } from '@/lib/data'
import { CarGallery, CarActions } from '@/components/car-details-client'

export default async function CarDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const car = carMap.get(id)
  
  if (!car) {
    notFound()
  }

  const similarCars = cars
    .filter((c) => c.id !== car.id && c.type === car.type)
    .slice(0, 4)

  const detailSpecs = [
    { icon: Settings, label: 'Engine', value: car.engine },
    { icon: Calendar, label: 'Year', value: String(car.year) },
    { icon: CarIcon, label: 'Drivetrain', value: car.drivetrain },
    { icon: Users, label: 'Seats', value: String(car.seats) },
    { icon: Weight, label: 'Weight', value: `${car.weight.toLocaleString('en-US')} kg` },
    { icon: Fuel, label: 'Fuel Type', value: car.fuelType },
    { icon: Activity, label: 'Mileage', value: car.mileage },
  ]

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

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
            {/* Image Gallery (Client Component) */}
            <CarGallery car={car} />

            {/* Car Info */}
            <div className="flex flex-col">
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Brand & Rating */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-primary uppercase tracking-wider">
                    {car.brand}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-accent fill-accent" />
                    <span className="font-medium">{car.rating}</span>
                  </div>
                </div>

                {/* Name */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gradient mb-4">
                  {car.name}
                </h1>

                {/* Description */}
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

                {/* Actions (Client Component) */}
                <CarActions car={car} />

                {/* Vehicle Details */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {detailSpecs.map((spec, index) => (
                    <div
                      key={spec.label}
                      className="flex items-center gap-3 p-3 rounded-xl bg-card/60 border border-border/50 animate-in fade-in slide-in-from-bottom-2"
                      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <spec.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">{spec.label}</div>
                        <div className="text-sm font-semibold truncate">{spec.value}</div>
                      </div>
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
              <div>
                <Speedometer
                  value={car.horsepower}
                  maxValue={1200}
                  label="Horsepower"
                  unit="hp"
                />
              </div>
              
              <div>
                <Speedometer
                  value={car.torque}
                  maxValue={1500}
                  label="Torque"
                  unit="Nm"
                />
              </div>
              
              <div>
                <Speedometer
                  value={car.acceleration}
                  maxValue={10}
                  label="0-100 km/h"
                  unit="sec"
                />
              </div>
              
              <div>
                <Speedometer
                  value={car.topSpeed}
                  maxValue={400}
                  label="Top Speed"
                  unit="km/h"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Similar Cars */}
        {similarCars.length > 0 && (
          <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-border/40">
            <h2 className="text-2xl sm:text-3xl font-bold text-gradient mb-12">
              Similar Cars
            </h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarCars.map((c, index) => (
                <CarCard key={c.id} car={c} index={index} />
              ))}
            </div>
          </section>
        )}
      </div>

      <CompareBar />
    </main>
  )
}
