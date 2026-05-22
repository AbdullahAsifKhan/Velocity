import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { logger } from '@/lib/logger'

/**
 * On-Demand Revalidation API
 * 
 * Busts ISR cache for specified paths when catalog data is updated.
 * Protected by REVALIDATION_SECRET to prevent abuse.
 * 
 * Usage:
 *   POST /api/revalidate
 *   Headers: { "Authorization": "Bearer <REVALIDATION_SECRET>" }
 *   Body: { "paths": ["/", "/brands", "/search"] }
 *   
 *   Or omit paths to revalidate all known routes.
 */

const ALL_CACHED_PATHS = [
  '/',
  '/search',
  '/brands',
  '/compare',
]

export async function POST(request: NextRequest) {
  // Validate secret
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!process.env.REVALIDATION_SECRET) {
    logger.error('REVALIDATION_SECRET not configured', { path: '/api/revalidate', statusCode: 500 })
    return NextResponse.json(
      { error: 'Revalidation not configured on this deployment' },
      { status: 500 }
    )
  }

  if (token !== process.env.REVALIDATION_SECRET) {
    logger.warn('Unauthorized revalidation attempt', { path: '/api/revalidate', statusCode: 401 })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const paths: string[] = Array.isArray(body.paths) && body.paths.length > 0
      ? body.paths
      : ALL_CACHED_PATHS

    const revalidated: string[] = []

    for (const path of paths) {
      if (path.startsWith('tag:')) {
        const tag = path.replace('tag:', '')
        // @ts-expect-error - Next.js types can be inconsistent
        revalidateTag(tag)
        revalidated.push(path)
      } else {
        revalidatePath(path)
        revalidated.push(path)
      }
    }

    logger.info('Cache revalidated', {
      path: '/api/revalidate',
      meta: { revalidated },
    })

    return NextResponse.json({
      revalidated,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Revalidation failed', {
      path: '/api/revalidate',
      error: error instanceof Error ? error.message : String(error),
      statusCode: 500,
    })
    return NextResponse.json(
      { error: 'Revalidation failed' },
      { status: 500 }
    )
  }
}
