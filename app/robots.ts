import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://velocity-cars.vercel.app'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',          // Block API routes from crawling
          '/favorites',     // User-specific, no SEO value
          '/garage',        // User-specific, no SEO value
          '/test-logos',    // Internal testing page
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
