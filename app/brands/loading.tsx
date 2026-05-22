import { BrandCardSkeleton } from '@/components/loading-skeleton'

export default function Loading() {
  return (
    <main className="min-h-screen bg-background">
      <div className="pt-24 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header skeleton */}
          <div className="mb-12">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl shimmer" />
              <div className="space-y-2">
                <div className="h-9 w-32 shimmer skeleton-bar" />
                <div className="h-5 w-64 shimmer skeleton-bar" />
              </div>
            </div>
          </div>

          {/* Brand grid skeleton */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 16 }).map((_, i) => (
              <BrandCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
