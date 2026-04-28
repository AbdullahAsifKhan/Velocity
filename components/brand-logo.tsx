'use client'

import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LOGO_MAP } from '@/lib/logo-map'

interface BrandLogoProps {
  brand: string
  className?: string
  fallbackClassName?: string
}

export function BrandLogo({ brand, className, fallbackClassName }: BrandLogoProps) {
  const [error, setError] = useState(false)

  const normalizeForLogo = (b: string) => {
    let slug = b.toLowerCase().replace(/ /g, '-')
      .replace(/benz/g, 'benz')
      .replace(/rolls-royce/g, 'rolls-royce')
      .replace(/alfa romeo/g, 'alfa-romeo')
      .replace(/aston martin/g, 'aston-martin')
      .replace(/land rover/g, 'land-rover')
      
    if (slug === 'shelby') return 'saleen'
    return slug
  }

  const slug = normalizeForLogo(brand)
  
  // Use user-provided local images for specific overrides
  const LOCAL_OVERRIDES = ['hummer', 'jaguar', 'maybach', 'saturn']
  const logoUrl = LOCAL_OVERRIDES.includes(slug) 
    ? `/logos/${slug}.png` 
    : `https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/${slug}.png`

  let smartClasses = ''
  
  const whiteBgSlugs = ['genesis', 'maybach', 'oldmobile', 'oldmoblie', 'oldsmobile']
  const solidWhiteDarkSlugs = [
    'audi', 'hummer', 'hummar', 'lincoln', 'lincon', 
    'jaguar', 'jagwar', 'maserati', 'masarati', 
    'toyota', 'toyata', 'saturn', 'nissan'
  ]
  const brightenSlugs = ['vw', 'saab', 'vwsaab', 'peugeot', 'volkswagen']
  const biggerSlugs = ['ram']

  if (whiteBgSlugs.includes(slug)) {
    smartClasses = 'mix-blend-multiply dark:invert dark:mix-blend-screen'
  } else if (solidWhiteDarkSlugs.includes(slug)) {
    smartClasses = 'dark:brightness-0 dark:invert'
  } else if (brightenSlugs.includes(slug)) {
    smartClasses = 'dark:brightness-200'
  }

  if (biggerSlugs.includes(slug)) {
    smartClasses += ' scale-[1.7]' // make ram even bigger relative to the global scale
  }

  if (error) {
    return (
      <div className={cn("rounded-xl bg-card border border-border flex items-center justify-center relative overflow-hidden", fallbackClassName)}>
        <span className="absolute inset-0 z-0 bg-gradient-to-br from-primary/5 to-transparent"></span>
        <Building2 className="w-1/3 h-1/3 text-muted-foreground z-10" />
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={`${brand} logo`}
      className={cn(
        "object-contain w-full h-full transition-all duration-300 scale-[1.3]", 
        smartClasses,
        className
      )}
      loading="lazy"
      onError={() => setError(true)}
    />
  )
}
