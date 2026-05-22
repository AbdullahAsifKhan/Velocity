'use client'

import Link from 'next/link'
import { Link2, Zap, Globe, Factory } from 'lucide-react'

interface RelatedCar {
  id: string
  name: string
  brand: string
  year?: number
  type?: string
}

interface Relationship {
  id: string
  relationshipType: string
  note?: string | null
  relatedCar: RelatedCar
}

const RELATIONSHIP_CONFIG: Record<string, { icon: typeof Link2; label: string; color: string; bg: string }> = {
  platform_sibling: {
    icon: Link2,
    label: 'Platform Sibling',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  rebadge: {
    icon: Factory,
    label: 'Rebadge',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  ev_sister: {
    icon: Zap,
    label: 'EV Sister',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  regional_variant: {
    icon: Globe,
    label: 'Regional Variant',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
}

interface RelatedModelsProps {
  relationships: Relationship[]
}

export function RelatedModels({ relationships }: RelatedModelsProps) {
  if (!relationships || relationships.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Related Models
      </h3>
      <div className="flex flex-wrap gap-3">
        {relationships.map((rel) => {
          const config = RELATIONSHIP_CONFIG[rel.relationshipType] || RELATIONSHIP_CONFIG.platform_sibling
          const Icon = config.icon

          return (
            <Link
              key={rel.id}
              href={`/car/${rel.relatedCar.id}`}
              className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border
                         ${config.bg} hover:scale-[1.02] transition-all duration-200 group`}
            >
              <Icon className={`w-4 h-4 ${config.color} flex-shrink-0`} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
                    {config.label}
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {rel.relatedCar.name}
                  {rel.relatedCar.year ? ` (${rel.relatedCar.year})` : ''}
                </p>
                {rel.note && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[250px]">
                    {rel.note}
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
