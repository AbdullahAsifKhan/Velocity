/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  // Pin Vercel serverless functions to us-east-1 to match Neon DB region
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
    remotePatterns: [
      // Wikimedia
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'http', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'commons.wikimedia.org' },
      { protocol: 'http', hostname: 'commons.wikimedia.org' },
      // Image CDNs & proxies
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'wsrv.nl' },
      { protocol: 'https', hostname: 'images.hgmsites.net' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Automotive dealer / press sources
      { protocol: 'https', hostname: 'www.marshallgoldman.com' },
      { protocol: 'http', hostname: 'www.marshallgoldman.com' },
      { protocol: 'https', hostname: '*.marshallgoldman.com' },
      // Google / CDN sources
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'lh4.googleusercontent.com' },
      { protocol: 'https', hostname: 'lh5.googleusercontent.com' },
      { protocol: 'https', hostname: 'lh6.googleusercontent.com' },
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 2592000, // 30 days
  },
  // Security & performance headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com https://res.cloudinary.com https://wsrv.nl",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
      {
        source: '/images/:all*(svg|jpg|png|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          }
        ],
      },
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          }
        ],
      },
      {
        // API search/track routes — cache for 60s, serve stale while revalidating
        source: '/api/search(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          }
        ],
      },
      {
        // Static logos
        source: '/logos/:all*(png|svg)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          }
        ],
      },
    ]
  },
}

export default nextConfig

