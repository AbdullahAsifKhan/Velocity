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

export const metadata: Metadata = {
  title: 'VELOCITY | Premium Car Showcase',
  description: 'Discover the world\'s finest automobiles. Explore luxury, performance, and innovation in one stunning collection.',
  keywords: ['cars', 'luxury cars', 'sports cars', 'automotive', 'car showcase', 'premium vehicles'],
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
        {/* Preconnect to external image sources for faster first-image load */}
        <link rel="preconnect" href="https://wsrv.nl" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://wsrv.nl" />
        <link rel="preconnect" href="https://raw.githubusercontent.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://raw.githubusercontent.com" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className={`${outfit.variable} ${geistMono.variable} font-sans antialiased`}>
        <Navigation />
        {children}
        <footer className="mt-auto py-12 border-t border-border/40 text-center">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Velocity Automotive. All rights reserved.</p>
        </footer>
        <Analytics />
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  )
}
