'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Play, Sparkles } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Car } from '@/lib/types'
import { isUnoptimizedUrl } from '@/lib/image'

interface HeroSectionProps {
  car: Car
}

export function HeroSection({ car: featuredCar }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image with Parallax */}
      <motion.div className="absolute inset-0" style={{ y: bgY }}>
        <div className="absolute inset-0 scale-110">
          <Image
            src={featuredCar.image}
            alt={featuredCar.name}
            fill
            priority
            unoptimized={isUnoptimizedUrl(featuredCar.image)}
            className="object-cover"
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ opacity: contentOpacity }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-40 lg:py-48"
      >
        <div className="max-w-2xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium tracking-wide">Car of the Day</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-balance"
          >
            <span className="text-gradient">{featuredCar.brand}</span>
            <br />
            <span className="text-foreground">{featuredCar.name.replace(featuredCar.brand + ' ', '')}</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-lg text-pretty font-light"
          >
            {featuredCar.description}
          </motion.p>

          {/* Stats with dividers */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex items-center gap-0"
          >
            <div className="pr-8">
              <div className="text-3xl font-semibold text-primary tabular-nums">{featuredCar.horsepower}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Horsepower</div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="px-8">
              <div className="text-3xl font-semibold tabular-nums">{featuredCar.acceleration}s</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">0-100 km/h</div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="pl-8">
              <div className="text-3xl font-semibold tabular-nums">{featuredCar.topSpeed}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">km/h Top Speed</div>
            </div>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 flex flex-wrap gap-4"
          >
            <Link
              href={`/car/${featuredCar.id}`}
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:glow transition-all duration-500 hover:scale-[1.02]"
            >
              Explore
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <button className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl glass font-semibold hover:bg-secondary transition-all duration-500 hover:scale-[1.02]">
              <Play className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              Watch Video
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-6 h-10 rounded-full border-2 border-muted-foreground/20 flex items-start justify-center p-2"
        >
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1 h-2 rounded-full bg-muted-foreground"
          />
        </motion.div>
      </motion.div>
    </section>
  )
}
