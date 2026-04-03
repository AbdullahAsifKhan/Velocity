import { NextResponse } from 'next/server'
import { prisma } from '@/lib/api-service'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const idsParam = searchParams.get('ids')
  
  if (!idsParam) return NextResponse.json([])

  const ids = idsParam.split(',').map(id => id.trim()).filter(Boolean)
  
  try {
    const cars = await prisma.car.findMany({
      where: {
        id: {
          in: ids
        }
      }
    })
    return NextResponse.json(cars)
  } catch (err) {
    console.error('Failed to parse cars from db:', err)
    return NextResponse.json([], { status: 500 })
  }
}
