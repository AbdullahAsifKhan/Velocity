import { NextResponse } from 'next/server'
import { prisma } from '@/lib/api-service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { rating } = await request.json()

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
    }

    const car = await prisma.car.findUnique({
      where: { id },
    })

    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Upsert the user's rating for this car
    await prisma.rating.upsert({
      where: {
        userId_carId: {
          userId: user.id,
          carId: id
        }
      },
      update: { rating },
      create: {
        userId: user.id,
        carId: id,
        rating
      }
    })

    // Compute the new average rating
    const aggregates = await prisma.rating.aggregate({
      where: { carId: id },
      _avg: { rating: true }
    })

    const newRating = aggregates._avg.rating || 0

    const updatedCar = await prisma.car.update({
      where: { id },
      data: {
        rating: newRating
      }
    })

    return NextResponse.json({ rating: updatedCar.rating })
  } catch (error) {
    console.error('Error updating rating:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
