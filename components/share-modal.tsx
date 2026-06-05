'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { 
  X, Shield, Link as LinkIcon, Download, 
  ChevronRight, Check, Zap, Gauge, Fuel, CheckCircle2, ChevronDown
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { toPng } from 'html-to-image'
import download from 'downloadjs'

import type { Car } from '@/lib/types'
import { estimatePerformance, estimatePrice, cleanCarName } from '@/lib/utils'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  car: Car
}

// Custom Icons
const XIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

const WhatsAppIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
)

const DiscordIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
)

const RedditIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .883.175 1.188.467 1.22-.88 2.92-1.458 4.782-1.503l.872-4.086c.036-.168.196-.285.368-.26l3.181.67a1.25 1.25 0 0 1 1.087-.79zm-9.352 7.026c-.846 0-1.534.688-1.534 1.534 0 .846.688 1.534 1.534 1.534.846 0 1.534-.688 1.534-1.534 0-.846-.688-1.534-1.534-1.534zm8.746 0c-.846 0-1.534.688-1.534 1.534 0 .846.688 1.534 1.534 1.534.846 0 1.534-.688 1.534-1.534 0-.846-.688-1.534-1.534-1.534zm-4.373 3.99c-1.378 0-2.585.498-2.79 1.137l-.025.074.066.04c.48.291 1.488.58 2.749.58 1.252 0 2.253-.284 2.731-.57l.066-.04-.025-.075c-.206-.64-1.41-1.146-2.772-1.146z"/>
  </svg>
)


export function ShareModal({ isOpen, onClose, car }: ShareModalProps) {
  const [theme, setTheme] = useState<'Dark' | 'Light'>('Dark')
  const [copied, setCopied] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  const perf = estimatePerformance(car)
  const price = car.price > 0 ? car.price : estimatePrice(car)
  
  // Share actions
  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}/car/${car.id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Link copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }, [car.id])

  const handleDownload = useCallback(async () => {
    if (!previewRef.current) return
    
    try {
      setIsDownloading(true)
      const dataUrl = await toPng(previewRef.current, { 
        quality: 1, 
        pixelRatio: 1536 / previewRef.current.offsetWidth, // Ensure 1536px width
        style: {
          transform: 'none', // reset any 3d transform for capture
        }
      })
      download(dataUrl, `velocity-${car.brand}-${car.name.replace(/\s+/g, '-').toLowerCase()}.png`)
      toast.success('Image downloaded successfully')
    } catch (err) {
      console.error('Failed to generate image', err)
      toast.error('Failed to download image')
    } finally {
      setIsDownloading(false)
    }
  }, [car])

  const handleShare = useCallback((platform: string) => {
    const url = `${window.location.origin}/car/${car.id}`
    const text = `Check out the ${car.brand} ${car.name} on Velocity!`
    
    let shareUrl = ''
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
        break
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
        break
      case 'reddit':
        shareUrl = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`
        break
      default:
        if (navigator.share) {
          navigator.share({ title: 'Velocity', text, url })
          return
        }
    }
    
    if (shareUrl) window.open(shareUrl, '_blank')
  }, [car])

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Overlay */}
              <Dialog.Overlay asChild forceMount>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
                />
              </Dialog.Overlay>

              {/* Modal Content */}
              <Dialog.Content asChild forceMount>
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 10 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed left-1/2 top-1/2 z-50 w-full max-w-[960px] -translate-x-1/2 -translate-y-1/2 px-4 md:px-0"
                >
                  <VisuallyHidden asChild><Dialog.Title>Share Car</Dialog.Title></VisuallyHidden>

                  <div className="bg-[#0a0a0f] border border-white/10 md:rounded-[2rem] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                    
                    {/* Header */}
                    <div className="flex items-start justify-between p-6 md:p-8 pb-4 shrink-0">
                      <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Share Car</h2>
                        <p className="text-[#a1a1aa] text-[15px] mt-1.5">Share this car with your friends and car enthusiasts.</p>
                      </div>
                      <button 
                        onClick={onClose}
                        className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-[#a1a1aa] hover:text-white transition-colors border border-white/5"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 p-6 md:p-8 pt-2 overflow-y-auto overflow-x-hidden scrollbar-hide relative">
                      
                      {/* Left: Preview Card */}
                      <div className="flex-1 flex justify-center items-center py-4">
                        <div 
                          ref={previewRef}
                          className={`w-full max-w-[600px] rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl flex flex-col shrink-0 ${theme === 'Light' ? 'bg-[#f4f4f5]' : 'bg-[#09090b]'}`}
                          style={{
                            boxShadow: theme === 'Dark' ? '0 0 0 1px rgba(255,255,255,0.05), 0 0 80px rgba(59,130,246,0.15)' : '0 20px 40px rgba(0,0,0,0.1)'
                          }}
                        >
                          {/* Top Image Section */}
                          <div className="relative w-full shrink-0 overflow-hidden" style={{ height: '300px' }}>
                            {car.image ? (
                              <div className="absolute inset-0 w-full h-full overflow-hidden">
                                {/* Base Image with ultra-strong cinematic grading (Catch Me If You Can style) */}
                                <img src={car.image} alt={car.name} className="w-full h-full object-cover contrast-[1.25] brightness-[1.15] saturate-[1.4] sepia-[0.3] hue-rotate-[-10deg]" crossOrigin="anonymous" />
                                {/* Bloom simulated with drop-shadow / blur */}
                                <img src={car.image} alt="" className="absolute inset-0 w-full h-full object-cover blur-[20px] opacity-60 saturate-[1.6] brightness-[1.3] contrast-[1.2]" style={{ mixBlendMode: 'screen' }} crossOrigin="anonymous" />
                                {/* Warm/Cyan Color Palette Tint */}
                                <div className="absolute inset-0 opacity-40 bg-gradient-to-tr from-[#06b6d4] to-[#f59e0b]" style={{ mixBlendMode: 'overlay' }} />
                                {/* Film Stock Vignette */}
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)]" />
                              </div>
                            ) : (
                              <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                <Gauge className="w-12 h-12 text-zinc-600" />
                              </div>
                            )}
                            <div className={`absolute inset-0 bg-gradient-to-t ${theme === 'Light' ? 'from-[#f4f4f5] via-[#f4f4f5]/60 to-black/20' : 'from-[#09090b] via-[#09090b]/80 to-black/30'}`} />
                            
                            {/* Logo */}
                            <div className="absolute top-6 left-6 flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-[#3b82f6] flex items-center justify-center text-white shadow-lg">
                                <Gauge className="w-5 h-5" />
                              </div>
                              <span className="text-[17px] font-bold tracking-widest text-white drop-shadow-md">VELOCITY</span>
                            </div>

                            {/* Type Badge */}
                            <div className="absolute top-6 right-6 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold tracking-widest uppercase">
                              {car.type || 'Coupe'}
                            </div>

                            {/* Car Name - Overlapping the image boundary */}
                            <div className="absolute bottom-6 left-0 w-full px-6 md:px-8 z-10">
                              <h1 className={`text-[34px] leading-[1.05] font-bold tracking-tight drop-shadow-xl shadow-black ${theme === 'Light' ? 'text-zinc-900' : 'text-white'}`}>
                                {car.brand}
                                <br />
                                {cleanCarName(car.name, car.brand)}
                              </h1>
                              <p className={`text-[14px] mt-2 font-medium drop-shadow-md ${theme === 'Light' ? 'text-zinc-500' : 'text-zinc-300'}`}>
                                Produced: {car.year}{car.generationEnd ? `-${car.generationEnd}` : ''} • {car.generationEnd ? 'Discontinued Model' : 'Current Model'}
                              </p>
                            </div>
                          </div>

                          {/* Bottom Content Section */}
                          <div className={`flex flex-col flex-1 px-6 md:px-8 pb-6 ${theme === 'Light' ? 'text-zinc-900 bg-[#f4f4f5]' : 'text-white bg-[#09090b]'}`} style={{ paddingTop: '24px' }}>

                            {/* Performance Gauges */}
                            <div className="flex items-center justify-between px-2 mb-4">
                                  {/* HP */}
                                  <div className="flex flex-col items-center">
                                    <div className="relative w-[72px] h-[72px] mb-2">
                                      <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
                                        <circle cx="44" cy="44" r="38" fill="none" stroke={theme === 'Light' ? '#e4e4e7' : '#27272a'} strokeWidth="6" />
                                        <circle cx="44" cy="44" r="38" fill="none" stroke="url(#gauge-gradient)" strokeWidth="6" strokeLinecap="round" strokeDasharray="238.76" strokeDashoffset={238.76 - (238.76 * Math.min(100, (perf.hp / 1000) * 100)) / 100} />
                                        <defs>
                                          <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#3b82f6" />
                                            <stop offset="100%" stopColor="#eab308" />
                                          </linearGradient>
                                        </defs>
                                      </svg>
                                      <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                                        <span className="text-xl font-bold leading-none">{perf.hp}</span>
                                        <span className={`text-[10px] mt-0.5 font-medium ${theme === 'Light' ? 'text-zinc-500' : 'text-zinc-400'}`}>hp</span>
                                      </div>
                                    </div>
                                    <span className={`text-[9px] font-bold tracking-widest uppercase ${theme === 'Light' ? 'text-zinc-500' : 'text-zinc-400'}`}>Horsepower</span>
                                  </div>

                                  {/* Torque */}
                                  <div className="flex flex-col items-center">
                                    <div className="relative w-[72px] h-[72px] mb-2">
                                      <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
                                        <circle cx="44" cy="44" r="38" fill="none" stroke={theme === 'Light' ? '#e4e4e7' : '#27272a'} strokeWidth="6" />
                                        <circle cx="44" cy="44" r="38" fill="none" stroke="url(#gauge-gradient)" strokeWidth="6" strokeLinecap="round" strokeDasharray="238.76" strokeDashoffset={238.76 - (238.76 * Math.min(100, (perf.torque / 1000) * 100)) / 100} />
                                      </svg>
                                      <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                                        <span className="text-xl font-bold leading-none">{perf.torque}</span>
                                        <span className={`text-[10px] mt-0.5 font-medium ${theme === 'Light' ? 'text-zinc-500' : 'text-zinc-400'}`}>Nm</span>
                                      </div>
                                    </div>
                                    <span className={`text-[9px] font-bold tracking-widest uppercase ${theme === 'Light' ? 'text-zinc-500' : 'text-zinc-400'}`}>Torque</span>
                                  </div>

                                  {/* Accel */}
                                  <div className="flex flex-col items-center">
                                    <div className="relative w-[72px] h-[72px] mb-2">
                                      <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
                                        <circle cx="44" cy="44" r="38" fill="none" stroke={theme === 'Light' ? '#e4e4e7' : '#27272a'} strokeWidth="6" />
                                        <circle cx="44" cy="44" r="38" fill="none" stroke="url(#gauge-gradient)" strokeWidth="6" strokeLinecap="round" strokeDasharray="238.76" strokeDashoffset={238.76 - (238.76 * Math.max(0, Math.min(100, ((10 - perf.accel) / 8) * 100))) / 100} />
                                      </svg>
                                      <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                                        <span className="text-xl font-bold leading-none">{perf.accel}</span>
                                        <span className={`text-[10px] mt-0.5 font-medium ${theme === 'Light' ? 'text-zinc-500' : 'text-zinc-400'}`}>sec</span>
                                      </div>
                                    </div>
                                    <span className={`text-[9px] font-bold tracking-widest uppercase ${theme === 'Light' ? 'text-zinc-500' : 'text-zinc-400'}`}>0-100 km/h</span>
                                  </div>

                                  {/* Top Speed */}
                                  <div className="flex flex-col items-center">
                                    <div className="relative w-[72px] h-[72px] mb-2">
                                      <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
                                        <circle cx="44" cy="44" r="38" fill="none" stroke={theme === 'Light' ? '#e4e4e7' : '#27272a'} strokeWidth="6" />
                                        <circle cx="44" cy="44" r="38" fill="none" stroke="url(#gauge-gradient)" strokeWidth="6" strokeLinecap="round" strokeDasharray="238.76" strokeDashoffset={238.76 - (238.76 * Math.min(100, (perf.topSpeed / 400) * 100)) / 100} />
                                      </svg>
                                      <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                                        <span className="text-xl font-bold leading-none">{perf.topSpeed}</span>
                                        <span className={`text-[10px] mt-0.5 font-medium ${theme === 'Light' ? 'text-zinc-500' : 'text-zinc-400'}`}>km/h</span>
                                      </div>
                                    </div>
                                    <span className={`text-[9px] font-bold tracking-widest uppercase ${theme === 'Light' ? 'text-zinc-500' : 'text-zinc-400'}`}>Top Speed</span>
                                  </div>
                            </div>

                            {/* Price Footer */}
                            <div className={`flex items-end justify-between pt-4 border-t ${theme === 'Light' ? 'border-zinc-200' : 'border-white/10'}`}>
                              <div>
                                <div className={`text-[13px] font-medium mb-1 ${theme === 'Light' ? 'text-zinc-500' : 'text-zinc-400'}`}>Starting from</div>
                                <div className="text-[32px] font-bold leading-none text-[#3b82f6]">
                                  ${price.toLocaleString('en-US')}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-[13px] font-medium mb-1.5 ${theme === 'Light' ? 'text-zinc-500' : 'text-zinc-400'}`}>View on VELOCITY</div>
                                <div className={`text-[15px] font-semibold ${theme === 'Light' ? 'text-[#3b82f6]' : 'text-[#3b82f6]'}`}>velocity.app</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Controls */}
                      <div className="w-full lg:w-[320px] flex flex-col shrink-0">
                        
                        {/* Settings */}
                        <div className="space-y-4 mb-6">
                          <div>
                            <label className="text-[15px] font-medium text-[#e4e4e7] block mb-3">Theme</label>
                            <div className="flex gap-3">
                              <button
                                onClick={() => setTheme('Dark')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-medium text-[15px] transition-all
                                  ${theme === 'Dark' ? 'bg-white/5 border-[#3b82f6] text-white ring-1 ring-[#3b82f6]' : 'bg-transparent border-white/10 text-[#a1a1aa] hover:bg-white/5'}
                                `}
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                                Dark
                                {theme === 'Dark' && <div className="w-5 h-5 rounded-full bg-[#3b82f6] text-white flex items-center justify-center ml-1"><Check className="w-3.5 h-3.5" /></div>}
                              </button>
                              
                              <button
                                onClick={() => setTheme('Light')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-medium text-[15px] transition-all
                                  ${theme === 'Light' ? 'bg-white/5 border-[#3b82f6] text-white ring-1 ring-[#3b82f6]' : 'bg-transparent border-white/10 text-[#a1a1aa] hover:bg-white/5'}
                                `}
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                Light
                                {theme === 'Light' && <div className="w-5 h-5 rounded-full bg-[#3b82f6] text-white flex items-center justify-center ml-1"><Check className="w-3.5 h-3.5" /></div>}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Share Actions List */}
                        <div className="flex-1">
                          <label className="text-[15px] font-medium text-[#e4e4e7] block mb-3">Share via</label>
                          <div className="flex flex-col gap-1.5">
                            
                            <button onClick={handleCopyLink} className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors group">
                              <div className="flex items-center gap-3.5 text-[#e4e4e7] font-medium text-[15px]">
                                <LinkIcon className="w-5 h-5 text-[#a1a1aa]" />
                                Copy Link
                              </div>
                              {copied ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <div className="w-5 h-5 text-[#a1a1aa]"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></div>}
                            </button>
                            
                            <button onClick={handleDownload} disabled={isDownloading} className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50">
                              <div className="flex items-center gap-3.5 text-[#e4e4e7] font-medium text-[15px]">
                                <Download className="w-5 h-5 text-[#a1a1aa]" />
                                {isDownloading ? 'Downloading...' : 'Download Image'}
                              </div>
                              <Download className="w-5 h-5 text-[#a1a1aa]" />
                            </button>
                            
                            <button onClick={() => handleShare('whatsapp')} className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                              <div className="flex items-center gap-3.5 text-[#e4e4e7] font-medium text-[15px]">
                                <div className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center text-white"><WhatsAppIcon className="w-4 h-4" /></div>
                                WhatsApp
                              </div>
                              <ChevronRight className="w-5 h-5 text-[#52525b]" />
                            </button>

                            <button onClick={() => handleShare('twitter')} className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                              <div className="flex items-center gap-3.5 text-[#e4e4e7] font-medium text-[15px]">
                                <div className="w-7 h-7 rounded-full bg-black border border-white/20 flex items-center justify-center text-white"><XIcon className="w-3.5 h-3.5" /></div>
                                X (Twitter)
                              </div>
                              <ChevronRight className="w-5 h-5 text-[#52525b]" />
                            </button>
                            
                            <button onClick={() => handleShare('discord')} className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                              <div className="flex items-center gap-3.5 text-[#e4e4e7] font-medium text-[15px]">
                                <div className="w-7 h-7 rounded-full bg-[#5865F2] flex items-center justify-center text-white"><DiscordIcon className="w-4 h-4" /></div>
                                Discord
                              </div>
                              <ChevronRight className="w-5 h-5 text-[#52525b]" />
                            </button>
                            
                            <button onClick={() => handleShare('reddit')} className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                              <div className="flex items-center gap-3.5 text-[#e4e4e7] font-medium text-[15px]">
                                <div className="w-7 h-7 rounded-full bg-[#FF4500] flex items-center justify-center text-white"><RedditIcon className="w-4 h-4" /></div>
                                Reddit
                              </div>
                              <ChevronRight className="w-5 h-5 text-[#52525b]" />
                            </button>
                            
                            <button onClick={() => handleShare('other')} className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                              <div className="flex items-center gap-3.5 text-[#e4e4e7] font-medium text-[15px]">
                                <div className="w-7 h-7 flex items-center justify-center text-[#a1a1aa]"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg></div>
                                More Options
                              </div>
                              <ChevronRight className="w-5 h-5 text-[#52525b]" />
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                    
                    {/* Footer Policy */}
                    <div className="px-6 md:px-8 py-5 border-t border-white/5 bg-white/[0.02] flex items-center gap-3 text-[#a1a1aa] shrink-0">
                      <Shield className="w-5 h-5 shrink-0" />
                      <p className="text-[13.5px]">
                        By sharing this card, you agree to VELOCITY's <a href="#" className="text-[#3b82f6] hover:underline">Terms of Service</a> and <a href="#" className="text-[#3b82f6] hover:underline">Privacy Policy</a>.
                      </p>
                    </div>

                  </div>
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
