'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Search, Heart, LayoutGrid, Menu, X, Gauge } from 'lucide-react'
import { useCarStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { SearchModal } from '@/components/search-modal'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/brands', label: 'Brands' },
  { href: '/compare', label: 'Compare' },
  { href: '/garage', label: 'Garage' },
]

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { favorites, compareList } = useCarStore()
  const pathname = usePathname()
  const shouldReduceMotion = useReducedMotion()
  
  
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Ctrl+K / Cmd+K to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      <motion.nav
        initial={{ y: shouldReduceMotion ? 0 : -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "glass border-b border-border/50 shadow-lg shadow-background/20"
            : "bg-transparent backdrop-blur-sm"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <motion.div
                whileHover={shouldReduceMotion ? {} : { rotate: 180 }}
                transition={{ duration: 0.5 }}
                className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center"
              >
                <Gauge className="w-6 h-6 text-primary-foreground" />
              </motion.div>
              <span className="text-xl font-bold tracking-tight text-gradient">VELOCITY</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 ease-out group-hover:w-full" />
                </Link>
              ))}
            </div>

            {/* Search trigger + icons — Desktop */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Search button with Ctrl+K hint */}
              <button
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search cars"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/60 border border-border/40 hover:bg-secondary transition-colors text-sm text-muted-foreground group"
              >
                <Search className="w-4 h-4" />
                <span className="hidden xl:block">Search...</span>
                <kbd className="hidden xl:flex items-center gap-0.5 text-xs border border-border/60 rounded px-1.5 py-0.5 bg-background/50 group-hover:border-primary/40 transition-colors">⌃K</kbd>
              </button>

              <Link
                href="/favorites"
                className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <Heart className="w-5 h-5" />
                {mounted && favorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
              </Link>

            </div>

            {/* Mobile: search icon + hamburger */}
            <div className="flex lg:hidden items-center gap-1">
              <button
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search"
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isOpen}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Global Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-background/95 backdrop-blur-lg pt-20">
              <div className="p-6 space-y-6">
                {/* Mobile Search — opens the modal */}
                <button
                  onClick={() => { setIsOpen(false); setIsSearchOpen(true) }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary text-muted-foreground border border-border hover:border-primary/50 transition-colors text-left"
                >
                  <Search className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">Search cars, brands...</span>
                </button>

                {/* Mobile Nav Links */}
                <nav className="space-y-2">
                  {navLinks.map((link, index) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="block px-4 py-3 rounded-xl text-lg font-medium hover:bg-secondary transition-colors"
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                {/* Mobile Quick Actions */}
                {mounted && (
                  <div className="flex gap-4 pt-4 border-t border-border">
                    <Link
                      href="/favorites"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 flex items-center justify-center gap-2 p-4 rounded-xl bg-secondary"
                    >
                      <Heart className="w-5 h-5" />
                      <span>Favorites ({favorites.length})</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
