import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/api-service'
import { logger } from '@/lib/logger'

/**
 * POST /api/track
 * 
 * Accepts behavioral tracking events:
 * - "view":       Car detail page viewed. Also records co-view pairs.
 * - "impression": Car cards entered viewport on grid.
 * - "click":      Car card was clicked.
 * 
 * All events are fire-and-forget from the client — no blocking on response.
 */

// Simple in-memory rate limiter per session
const sessionCounts = new Map<string, { count: number, resetAt: number }>()
const MAX_REQUESTS_PER_MINUTE = 100

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, sessionId } = body

    if (!event || !sessionId) {
      return NextResponse.json({ error: 'Missing event or sessionId' }, { status: 400 })
    }

    const now = Date.now()
    const sessionData = sessionCounts.get(sessionId) || { count: 0, resetAt: now + 60000 }
    
    if (now > sessionData.resetAt) {
      sessionData.count = 1
      sessionData.resetAt = now + 60000
    } else {
      sessionData.count++
    }
    
    sessionCounts.set(sessionId, sessionData)

    if (sessionData.count > MAX_REQUESTS_PER_MINUTE) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    switch (event) {
      case 'view': {
        const { carId, viewedCarIds } = body
        if (!carId) {
          return NextResponse.json({ error: 'Missing carId' }, { status: 400 })
        }

        const carExists = await prisma.car.findUnique({
          where: { id: carId },
          select: { id: true }
        })
        if (!carExists) {
          return NextResponse.json({ error: 'Car not found' }, { status: 404 })
        }

        // 1. Record the page view
        await prisma.carView.create({
          data: { carId, sessionId },
        })

        // 2. Update co-view pairs: for every previously viewed car in this session,
        //    increment the co-view count for both directions (A→B and B→A)
        if (Array.isArray(viewedCarIds) && viewedCarIds.length > 0) {
          // Limit to last 10 to cap DB writes per request
          const recentViews = viewedCarIds.slice(-10).filter((id: string) => id !== carId)

          const coViewOps = recentViews.flatMap((prevCarId: string) => {
            // Normalize pair order to deduplicate (smaller ID always goes in carAId)
            const [a, b] = [prevCarId, carId].sort()
            return [
              prisma.carCoView.upsert({
                where: { carAId_carBId: { carAId: a, carBId: b } },
                create: { carAId: a, carBId: b, count: 1 },
                update: { count: { increment: 1 } },
              }),
            ]
          })

          // Execute in parallel — but don't let a failure block the response
          await Promise.allSettled(coViewOps)
        }

        return NextResponse.json({ ok: true })
      }

      case 'impression': {
        const { carIds } = body
        if (!Array.isArray(carIds) || carIds.length === 0) {
          return NextResponse.json({ error: 'Missing carIds array' }, { status: 400 })
        }

        // Batch-insert impressions (max 50 per request to bound DB load)
        const limited = carIds.slice(0, 50)
        await prisma.carImpression.createMany({
          data: limited.map((carId: string) => ({ carId, sessionId })),
          skipDuplicates: true,
        })

        return NextResponse.json({ ok: true })
      }

      case 'click': {
        const { carId } = body
        if (!carId) {
          return NextResponse.json({ error: 'Missing carId' }, { status: 400 })
        }

        // Mark the most recent impression for this car+session as clicked
        const latestImpression = await prisma.carImpression.findFirst({
          where: { carId, sessionId, clicked: false },
          orderBy: { impressedAt: 'desc' },
        })

        if (latestImpression) {
          await prisma.carImpression.update({
            where: { id: latestImpression.id },
            data: { clicked: true },
          })
        }

        return NextResponse.json({ ok: true })
      }

      default:
        return NextResponse.json({ error: `Unknown event: ${event}` }, { status: 400 })
    }
  } catch (error) {
    logger.error('Track API failed', {
      path: '/api/track',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    // Still return 200 — tracking failures should never block the user
    return NextResponse.json({ ok: false })
  }
}
