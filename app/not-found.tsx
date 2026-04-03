'use client'

import { motion } from 'framer-motion'
import { Home, Search } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background">

      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-9xl font-bold text-gradient mb-8"
          >
            404
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold mb-4"
          >
            Road Not Found
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground mb-8"
          >
            Looks like you took a wrong turn. The page you are looking for does not exist or has been moved.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:glow transition-all"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </Link>
            <Link
              href="/brands"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass font-semibold hover:bg-secondary transition-all"
            >
              <Search className="w-5 h-5" />
              Browse Brands
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </main>
  )
}
