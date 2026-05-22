'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronRight, Zap, Activity, Clock, Gauge, Fuel, Settings, DollarSign, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Car } from '@/lib/types'

const COMPARISON_SPECS = [
  { key: 'price', label: 'Price', icon: DollarSign, format: (v: any) => typeof v === 'number' && v > 0 ? `$${v.toLocaleString()}` : '—' },
  { key: 'horsepower', label: 'Horsepower', icon: Zap, format: (v: any) => typeof v === 'number' && v > 0 ? `${v} hp` : '—' },
  { key: 'torque', label: 'Torque', icon: Activity, format: (v: any) => typeof v === 'number' && v > 0 ? `${v} Nm` : '—' },
  { key: 'acceleration', label: '0–100 km/h', icon: Clock, format: (v: any) => typeof v === 'number' && v > 0 ? `${v}s` : '—', reverse: true },
  { key: 'topSpeed', label: 'Top Speed', icon: Gauge, format: (v: any) => typeof v === 'number' && v > 0 ? `${v} km/h` : '—' },
  { key: 'engine', label: 'Engine', icon: Settings, format: (v: any) => v || '—' },
  { key: 'drivetrain', label: 'Drivetrain', icon: BarChart3, format: (v: any) => v || '—' },
  { key: 'fuelType', label: 'Fuel', icon: Fuel, format: (v: any) => v || '—' },
  { key: 'transmission', label: 'Transmission', icon: Settings, format: (v: any) => v || '—' },
] as const

interface VariantComparisonTableProps {
  variants: Partial<Car>[]
  className?: string
}

export function VariantComparisonTable({ variants, className }: VariantComparisonTableProps) {
  const [showAll, setShowAll] = useState(false)

  // Determine which specs are identical across all variants (to auto-collapse)
  const specAnalysis = useMemo(() => {
    return COMPARISON_SPECS.map(spec => {
      const values = variants.map(v => v[spec.key as keyof Car])
      const uniqueValues = new Set(values.map(v => JSON.stringify(v)))
      const allSame = uniqueValues.size <= 1
      return { ...spec, allSame, values }
    })
  }, [variants])

  const differingSpecs = specAnalysis.filter(s => !s.allSame)
  const sameSpecs = specAnalysis.filter(s => s.allSame)
  const displaySpecs = showAll ? specAnalysis : differingSpecs

  // Find winner for numeric specs
  const getWinner = (key: string, reverse = false): number | null => {
    if (variants.length < 2) return null
    const values = variants.map(v => {
      const val = v[key as keyof Car]
      return typeof val === 'number' ? val : null
    })
    const numericVals = values.filter((v): v is number => v !== null && v > 0)
    if (numericVals.length < 2) return null
    const best = reverse ? Math.min(...numericVals) : Math.max(...numericVals)
    return values.indexOf(best)
  }

  if (variants.length === 0) return null

  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="min-w-[600px]">
        {/* Header row: variant names */}
        <div
          className="grid gap-2 mb-3"
          style={{ gridTemplateColumns: `140px repeat(${variants.length}, 1fr)` }}
        >
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest py-2">
            Spec
          </div>
          {variants.map((v) => (
            <Link
              key={v.id}
              href={`/car/${v.id}`}
              className="group text-center py-2 px-2 rounded-lg hover:bg-primary/5 transition-colors"
            >
              <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                {v.name?.replace(v.brand || '', '').trim() || v.name}
              </p>
              <p className="text-[11px] text-muted-foreground">{v.year}</p>
            </Link>
          ))}
        </div>

        {/* Spec rows — differing specs */}
        <div className="space-y-1">
          {displaySpecs.map((spec) => {
            const winner = 'reverse' in spec
              ? getWinner(spec.key, spec.reverse)
              : getWinner(spec.key)

            return (
              <div
                key={spec.key}
                className="grid gap-2 items-center rounded-lg hover:bg-secondary/30 transition-colors"
                style={{ gridTemplateColumns: `140px repeat(${variants.length}, 1fr)` }}
              >
                <div className="flex items-center gap-2 py-2.5 px-2">
                  <spec.icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs font-medium text-muted-foreground">{spec.label}</span>
                </div>
                {variants.map((v, idx) => {
                  const val = v[spec.key as keyof Car]
                  const isWinner = winner === idx
                  return (
                    <div
                      key={v.id}
                      className={cn(
                        "text-center py-2.5 px-2 rounded-md text-sm font-medium transition-colors",
                        isWinner ? "bg-primary/10 text-primary" : "text-foreground"
                      )}
                    >
                      {spec.format(val)}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Collapsed same-specs summary */}
        {sameSpecs.length > 0 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="mt-3 w-full py-2 text-xs text-muted-foreground hover:text-foreground 
                       bg-secondary/20 hover:bg-secondary/40 rounded-lg transition-colors text-center"
          >
            {sameSpecs.length} spec{sameSpecs.length !== 1 ? 's' : ''} identical across all trims
            <ChevronRight className="w-3 h-3 inline ml-1 rotate-90" />
          </button>
        )}

        {showAll && sameSpecs.length > 0 && (
          <button
            onClick={() => setShowAll(false)}
            className="mt-3 w-full py-2 text-xs text-muted-foreground hover:text-foreground
                       bg-secondary/20 hover:bg-secondary/40 rounded-lg transition-colors text-center"
          >
            Hide identical specs
            <ChevronRight className="w-3 h-3 inline ml-1 -rotate-90" />
          </button>
        )}

        {/* View detail links */}
        <div
          className="grid gap-2 mt-4 pt-3 border-t border-border/40"
          style={{ gridTemplateColumns: `140px repeat(${variants.length}, 1fr)` }}
        >
          <div />
          {variants.map(v => (
            <Link
              key={v.id}
              href={`/car/${v.id}`}
              className="text-center text-xs font-semibold text-primary hover:underline py-1"
            >
              Full Specs →
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
