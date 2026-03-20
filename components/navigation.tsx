'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Search, Heart, LayoutGrid, Menu, X, Gauge } from 'lucide-react'
import { useCarStore } from '@/lib/store'
import { brands } from '@/lib/data'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/brands', label: 'Brands' },
  { href: '/compare', label: 'Compare' },
  { href: '/garage', label: 'Garage' },
  { href: '/favorites', label: 'Favorites' },
]

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { searchQuery, setSearchQuery, favorites, compareList } = useCarStore()
  const router = useRouter()
  const pathname = usePathname()
  const shouldReduceMotion = useReducedMotion()
  
  const popularBrands = brands.slice(0, 8)
  
  const handleSearch = (val: string) => {
    setSearchQuery(val)
    if (pathname !== '/') {
      router.push('/')
    }
  }
  
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <motion.nav
        initial={{ y: shouldReduceMotion ? 0 : -100 }}
        animate={{ y: 0 }}
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
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                </Link>
              ))}
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden lg:flex items-center gap-4">
              <AnimatePresence>
                {isSearchOpen ? (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 300, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="relative group"
                  >
                    <input
                      type="text"
                      placeholder="Search cars, brands..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="peer w-full px-4 py-2 pl-10 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:outline-none transition-colors"
                      autoFocus
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    
                    {/* Brand Recommendations Dropdown */}
                    <div className="absolute top-full left-0 right-0 mt-2 p-3 rounded-lg bg-card border border-border opacity-0 invisible peer-focus:opacity-100 peer-focus:visible hover:opacity-100 hover:visible transition-all shadow-xl z-50">
                      <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Popular Brands</div>
                      <div className="flex flex-wrap gap-2">
                        {popularBrands.map(brand => (
                          <button
                            key={brand}
                            onMouseDown={(e) => { e.preventDefault(); handleSearch(brand); }}
                            className="text-xs px-2 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            {brand}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
              
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                {isSearchOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
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

              <Link
                href="/compare"
                className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <LayoutGrid className="w-5 h-5" />
                {mounted && compareList.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center">
                    {compareList.length}
                  </span>
                )}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-background/95 backdrop-blur-lg pt-20">
              <div className="p-6 space-y-6">
                {/* Mobile Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search cars, brands..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full px-4 py-3 pl-12 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:outline-none"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  
                  <div className="mt-4 p-3 rounded-xl bg-card border border-border">
                    <div className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Popular Brands</div>
                    <div className="flex flex-wrap gap-2">
                      {popularBrands.map(brand => (
                        <button
                          key={brand}
                          onClick={() => { handleSearch(brand); setIsOpen(false); }}
                          className="text-sm px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          {brand}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mobile Nav Links */}
                <nav className="space-y-2">
                  {navLinks.map((link, index) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
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
                    <Link
                      href="/compare"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 flex items-center justify-center gap-2 p-4 rounded-xl bg-secondary"
                    >
                      <LayoutGrid className="w-5 h-5" />
                      <span>Compare ({compareList.length})</span>
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
