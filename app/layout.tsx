import type { Metadata, Viewport } from 'next'
import { Outfit, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
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
      <body className={`${outfit.variable} ${geistMono.variable} font-sans antialiased noise-overlay`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
