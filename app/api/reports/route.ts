import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/api-service'
import crypto from 'crypto'

// ── In-memory rate limiter ──────────────────────────────────────────────────
// Tracks submissions per hashed IP. Resets on server restart (acceptable for MVP).
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 5       // max reports per window
const RATE_LIMIT_WINDOW = 3600_000 // 1 hour in ms

const VALID_CATEGORIES = ['wrong_specs', 'wrong_image', 'wrong_name', 'other'] as const

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip + (process.env.NEXTAUTH_SECRET || 'salt')).digest('hex').slice(0, 16)
}

function isRateLimited(ipHash: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ipHash)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ipHash, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return false
  }

  if (entry.count >= RATE_LIMIT_MAX) return true
  entry.count++
  return false
}

export async function POST(req: NextRequest) {
  try {
    // Extract IP
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
    const ipHash = hashIp(ip)

    // Rate limit check
    if (isRateLimited(ipHash)) {
      return NextResponse.json(
        { error: 'Too many reports. Please try again later.' },
        { status: 429 }
      )
    }

    // Parse and validate body
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { carId, category, description, evidence } = body

    // Validate required fields
    if (!carId || typeof carId !== 'string') {
      return NextResponse.json({ error: 'carId is required' }, { status: 400 })
    }
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      )
    }
    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: 'description is required' }, { status: 400 })
    }
    if (description.length < 10 || description.length > 1000) {
      return NextResponse.json(
        { error: 'description must be 10-1000 characters' },
        { status: 400 }
      )
    }

    // Validate evidence URL if provided
    if (evidence && typeof evidence === 'string' && evidence.length > 0) {
      if (evidence.length > 2000) {
        return NextResponse.json({ error: 'evidence URL too long' }, { status: 400 })
      }
    }

    // Verify car exists
    const car = await prisma.car.findUnique({ where: { id: carId }, select: { id: true } })
    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }

    // Create report
    const report = await prisma.errorReport.create({
      data: {
        carId,
        category,
        description: description.trim(),
        evidence: evidence?.trim() || null,
        ipHash,
      },
    })

    return NextResponse.json(
      { success: true, id: report.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
