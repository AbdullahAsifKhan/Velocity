/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '/wikipedia/commons/**',
      },
      {
        protocol: 'https',
        hostname: 'commons.wikimedia.org',
        pathname: '/wiki/Special:FilePath/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Cache optimized images for 30 days
    minimumCacheTTL: 2592000,
  },
  experimental: {
    turbopack: {
      root: '.',
    },
  },
}

export default nextConfig
