import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/api-service'

/**
 * Dynamic sitemap generation for SEO.
 * Generates URLs for all static pages and all car detail pages.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://velocity-cars.vercel.app'

  // Static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/brands`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ]

  // Dynamic car pages
  try {
    const cars = await prisma.car.findMany({
      where: { isCanonical: true, isDemoted: false },
      select: { id: true },
      orderBy: { popularityScore: 'desc' },
      take: 5000, // Cap to prevent sitemap from being too large
    })

    const carRoutes: MetadataRoute.Sitemap = cars.map((car) => ({
      url: `${baseUrl}/car/${car.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    // Dynamic brand pages
    const brands = await prisma.car.findMany({
      where: { isCanonical: true, isDemoted: false },
      select: { brand: true },
      distinct: ['brand'],
    })

    const brandRoutes: MetadataRoute.Sitemap = brands.map((b) => ({
      url: `${baseUrl}/brands/${encodeURIComponent(b.brand)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }))

    return [...staticRoutes, ...brandRoutes, ...carRoutes]
  } catch (error) {
    console.error('Sitemap generation failed:', error)
    return staticRoutes
  }
}
