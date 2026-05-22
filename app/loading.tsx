import { HeroSkeleton, CarGridSkeleton } from '@/components/loading-skeleton'

export default function Loading() {
  return (
    <main className="min-h-screen bg-background">
      <HeroSkeleton />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        {/* Featured section skeleton */}
        <section className="py-24">
          <div className="mb-8 space-y-3">
            <div className="h-4 w-24 shimmer skeleton-bar" />
            <div className="h-8 w-40 shimmer skeleton-bar" />
          </div>
          <div className="flex gap-6 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[340px]">
                <div className="skeleton-card bg-card border border-border/60">
                  <div className="aspect-[4/3] shimmer" />
                  <div className="p-6 space-y-3">
                    <div className="h-3 w-20 shimmer skeleton-bar" />
                    <div className="h-5 w-32 shimmer skeleton-bar" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* All Cars section skeleton */}
        <section className="py-24 border-t border-border/40">
          <div className="mb-8 space-y-3">
            <div className="h-8 w-32 shimmer skeleton-bar" />
            <div className="h-5 w-64 shimmer skeleton-bar" />
          </div>
          <div className="flex gap-2 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-11 w-24 shimmer" style={{ borderRadius: '0.75rem' }} />
            ))}
          </div>
          <CarGridSkeleton count={8} />
        </section>
      </div>
    </main>
  )
}
