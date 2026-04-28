import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/api-service'
import { logger } from '@/lib/logger'

const CRON_SECRET = process.env.CRON_SECRET || ''

/**
 * POST /api/recompute-scores
 * 
 * Nightly cron job to recompute platformScore and blendedScore for every car.
 * 
 * Phase 1 — platformScore (live behavioral signals, 0–1):
 *   platformScore = (0.40 × CTR)
 *                 + (0.35 × trendingScore)
 *                 + (0.25 × normalizedEngagement)
 * 
 * Phase 2 — blendedScore (final ranking, 0–1):
 *   blendedScore = (0.60 × popularityScore)   ← set by weekly static script
 *                + (0.40 × platformScore)      ← computed in phase 1
 * 
 * Protected by CRON_SECRET header.
 */
export async function POST(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86_400_000)

    // ── 1. Gather all cars with current stats ───────────────────────────────
    const allCars = await prisma.car.findMany({
      select: { id: true, popularityScore: true, favorites: true, views: true },
    })

    if (allCars.length === 0) {
      return NextResponse.json({ ok: true, message: 'No cars found' })
    }

    // Engagement = (favorites * 10) + views
    const carEngagements = allCars.map(c => ({
      id: c.id,
      engagement: (c.favorites || 0) * 10 + (c.views || 0)
    }))
    const maxEngagement = Math.max(...carEngagements.map(e => e.engagement), 1)

    // ── 2. Aggregate view counts (7d and 30d) per car ────────────────────────
    const [views7d, views30d] = await Promise.all([
      prisma.carView.groupBy({
        by: ['carId'],
        where: { viewedAt: { gte: sevenDaysAgo } },
        _count: true,
      }),
      prisma.carView.groupBy({
        by: ['carId'],
        where: { viewedAt: { gte: thirtyDaysAgo } },
        _count: true,
      })
    ])

    const views7dMap = new Map(views7d.map(v => [v.carId, v._count]))
    const views30dMap = new Map(views30d.map(v => [v.carId, v._count]))

    // ── 3. Aggregate impression + click counts (30d) per car ─────────────────
    const [impressions30d, clicks30d] = await Promise.all([
      prisma.carImpression.groupBy({
        by: ['carId'],
        where: { impressedAt: { gte: thirtyDaysAgo } },
        _count: true,
      }),
      prisma.carImpression.groupBy({
        by: ['carId'],
        where: { impressedAt: { gte: thirtyDaysAgo }, clicked: true },
        _count: true,
      })
    ])

    const impressionsMap = new Map(impressions30d.map(i => [i.carId, i._count]))
    const clicksMap = new Map(clicks30d.map(c => [c.carId, c._count]))

    // ── 4. Compute scores for each car ───────────────────────────────────────
    const updates: { id: string; platformScore: number; blendedScore: number }[] = []

    for (const car of allCars) {
      // 1. Trending score: ratio of 7d views to 30d views (capped at 1)
      const v7 = views7dMap.get(car.id) || 0
      const v30 = views30dMap.get(car.id) || 0
      const trendingScore = v30 > 0 ? Math.min(v7 / (v30 * (7 / 30)), 1.0) : 0

      // 2. Click-through rate (0–1)
      const impressionCount = impressionsMap.get(car.id) || 0
      const clickCount = clicksMap.get(car.id) || 0
      const ctr = impressionCount > 0 ? Math.min(clickCount / impressionCount, 1.0) : 0

      // 3. Normalized Engagement (0-1)
      const engagement = carEngagements.find(e => e.id === car.id)?.engagement || 0
      const normalizedEngagement = engagement / maxEngagement

      // 4. Platform Score (0-1)
      const platformScore = (0.40 * ctr) 
                          + (0.35 * trendingScore) 
                          + (0.25 * normalizedEngagement)

      // 5. Blended Score (0-1)
      // popularityScore is already normalized 0-1 by the static script
      const blendedScore = (0.60 * car.popularityScore) 
                         + (0.40 * platformScore)

      updates.push({ 
        id: car.id, 
        platformScore: Math.round(platformScore * 10000) / 10000,
        blendedScore: Math.round(blendedScore * 10000) / 10000 
      })
    }

    // ── 5. Batch-update scores (chunks of 500) ───────────────────────────────
    const CHUNK_SIZE = 500
    for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
      const chunk = updates.slice(i, i + CHUNK_SIZE)
      await prisma.$transaction(
        chunk.map(u => prisma.car.update({
          where: { id: u.id },
          data: { 
            platformScore: u.platformScore,
            blendedScore: u.blendedScore 
          },
        }))
      )
    }

    // ── 6. Prune old tracking data (>90 days) ────────────────────────────────
    const [deletedViews, deletedImpressions] = await Promise.all([
      prisma.carView.deleteMany({ where: { viewedAt: { lt: ninetyDaysAgo } } }),
      prisma.carImpression.deleteMany({ where: { impressedAt: { lt: ninetyDaysAgo } } }),
    ])

    logger.info('Score recomputation complete', {
      path: '/api/recompute-scores',
      meta: {
        totalCars: allCars.length,
        prunedViews: deletedViews.count,
        prunedImpressions: deletedImpressions.count,
      },
    })

    return NextResponse.json({
      ok: true,
      carsUpdated: updates.length,
      prunedViews: deletedViews.count,
      prunedImpressions: deletedImpressions.count,
    })
  } catch (error) {
    logger.error('Score recomputation failed', {
      path: '/api/recompute-scores',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: 'Score recomputation failed' },
      { status: 500 }
    )
  }
}
