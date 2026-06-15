import type { Metadata, Viewport } from 'next'
import { Outfit, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Navigation } from '@/components/navigation'
import { Toaster } from 'sonner'
import './globals.css'

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: '--font-mono',
  display: 'swap',
})

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://velocity-cars.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'VELOCITY | Premium Car Showcase',
    template: '%s | VELOCITY'
  },
  description: 'Discover the world\'s finest automobiles. Explore luxury, performance, and innovation in one stunning collection.',
  keywords: ['cars', 'luxury cars', 'sports cars', 'automotive', 'car showcase', 'premium vehicles'],
  openGraph: {
    title: 'VELOCITY | Premium Car Showcase',
    description: 'Discover the world\'s finest automobiles. Explore luxury, performance, and innovation in one stunning collection.',
    url: baseUrl,
    siteName: 'VELOCITY',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VELOCITY | Premium Car Showcase',
    description: 'Discover the world\'s finest automobiles.',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Prevent Wikipedia from blocking images based on referrer */}
        <meta name="referrer" content="no-referrer" />
        {/* Preconnect to Cloudinary CDN (primary image source) for faster LCP */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        {/* Fallback image proxy */}
        <link rel="preconnect" href="https://wsrv.nl" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://wsrv.nl" />
        {/* External image sources */}
        <link rel="dns-prefetch" href="https://upload.wikimedia.org" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className={`${outfit.variable} ${geistMono.variable} font-sans antialiased flex flex-col min-h-screen`}>
        <Navigation />
        {children}
        <footer className="mt-auto py-12 border-t border-border/40 text-center">
          <p suppressHydrationWarning className="text-sm text-muted-foreground">© {new Date().getFullYear()} Velocity Automotive. All rights reserved.</p>
        </footer>
        <Analytics />
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  )
}
