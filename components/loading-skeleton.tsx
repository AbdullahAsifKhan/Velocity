/**
 * Loading skeleton components for premium perceived performance.
 * These match the exact dimensions of real components so there's
 * zero layout shift when content loads in.
 */

export function CarCardSkeleton() {
  return (
    <div className="card-contain skeleton-card bg-card border border-border/60 animate-fade-in-up">
      {/* Image placeholder */}
      <div className="aspect-[4/3] shimmer" />
      {/* Content placeholder */}
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-3 w-20 shimmer skeleton-bar" />
            <div className="h-5 w-36 shimmer skeleton-bar" />
          </div>
          <div className="h-6 w-20 shimmer skeleton-bar" />
        </div>
        <div className="pt-4 border-t border-border/40 grid grid-cols-3 gap-3">
          <div className="h-4 shimmer skeleton-bar" />
          <div className="h-4 shimmer skeleton-bar" />
          <div className="h-4 shimmer skeleton-bar" />
        </div>
      </div>
    </div>
  )
}

export function CarGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CarCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function HeroSkeleton() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 shimmer" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-40 lg:py-48">
        <div className="max-w-2xl space-y-6">
          <div className="h-8 w-40 shimmer skeleton-bar" />
          <div className="space-y-3">
            <div className="h-14 w-64 shimmer skeleton-bar" />
            <div className="h-14 w-80 shimmer skeleton-bar" />
          </div>
          <div className="h-5 w-96 shimmer skeleton-bar" />
          <div className="flex gap-8 pt-4">
            <div className="h-16 w-24 shimmer skeleton-bar" />
            <div className="h-16 w-24 shimmer skeleton-bar" />
            <div className="h-16 w-24 shimmer skeleton-bar" />
          </div>
          <div className="h-14 w-40 shimmer skeleton-bar" style={{ borderRadius: '0.75rem' }} />
        </div>
      </div>
    </section>
  )
}

export function BrandCardSkeleton() {
  return (
    <div className="rounded-2xl bg-card border border-border p-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 shimmer rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-28 shimmer skeleton-bar" />
          <div className="h-4 w-20 shimmer skeleton-bar" />
        </div>
      </div>
    </div>
  )
}

export function CarDetailSkeleton() {
  return (
    <main className="min-h-screen bg-background">
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="h-5 w-40 shimmer skeleton-bar" />
        </div>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Gallery skeleton */}
            <div className="space-y-4">
              <div className="aspect-video w-full rounded-3xl shimmer" />
              <div className="flex gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-32 aspect-video rounded-xl shimmer" />
                ))}
              </div>
            </div>
            {/* Info skeleton */}
            <div className="space-y-6">
              <div className="h-4 w-24 shimmer skeleton-bar" />
              <div className="h-12 w-80 shimmer skeleton-bar" />
              <div className="h-5 w-full shimmer skeleton-bar" />
              <div className="h-5 w-3/4 shimmer skeleton-bar" />
              <div className="h-10 w-32 shimmer skeleton-bar" />
              <div className="flex gap-3">
                <div className="h-12 w-28 shimmer" style={{ borderRadius: '0.75rem' }} />
                <div className="h-12 w-28 shimmer" style={{ borderRadius: '0.75rem' }} />
                <div className="h-12 w-12 shimmer" style={{ borderRadius: '0.75rem' }} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
