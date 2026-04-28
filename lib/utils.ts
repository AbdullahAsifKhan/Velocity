import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Car } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs))
}

export function cleanCarName(name: string, brand?: string): string {
  if (!name) return '';
  let cleaned = name;
  if (brand && cleaned.toLowerCase().startsWith(brand.toLowerCase())) {
    cleaned = cleaned.slice(brand.length).trim();
  }
  const match = cleaned.match(/^(.{4,}?)\s*\1(.*)$/i);
  if (match) {
    return match[1] + match[2];
  }
  return cleaned.trim();
}

export function optimizeImage(url: string | undefined | null, width = 400) {
  if (!url) return null;
  // Local or SVG URLs pass through unchanged
  if (url.startsWith('/') || url.includes('.svg')) return url;
  // Unsplash has its own CDN optimization
  if (url.includes('images.unsplash.com')) return url;
  // Wikipedia/Wikimedia block caching proxies like wsrv.nl
  if (url.includes('wikimedia.org') || url.includes('wikipedia.org')) return url;
  // Proxy all other external images through wsrv.nl for reliable, optimized loading
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&q=75&output=webp`;
}

export function estimatePerformance(car: Partial<Car>) {
  let hp = car.horsepower && car.horsepower > 0 ? car.horsepower : 250;
  
  if (!car.horsepower || car.horsepower === 0) {
    const t = car.type?.toLowerCase() || '';
    if (t.includes('tractor')) hp = 45;
    else if (t.includes('commercial') || t.includes('bus')) hp = 180;
    else if (t.includes('sports')) hp = 350;
    else if (t.includes('suv')) hp = 300;
  }
  
  // Predict torque (usually 10-20% higher than HP in modern cars, but much higher relative for tractors)
  let baseTorqueScalar = 1.15;
  if (car.type?.toLowerCase().includes('tractor')) baseTorqueScalar = 2.5; // Tractors have massive torque
  
  const torque = car.torque && car.torque > 0 ? car.torque : Math.round(hp * baseTorqueScalar)
  
  // Predict acceleration (roughly 2.5s minimum, slower as HP decreases)
  let accel = car.acceleration && car.acceleration > 0 ? car.acceleration : Math.max(2.5, 13.5 - (hp / 45))
  if (car.type?.toLowerCase().includes('tractor')) accel = 35.0; // Tractors are slow
  
  // Predict Top Speed
  let topSpeed = car.topSpeed && car.topSpeed > 0 ? car.topSpeed : Math.round(180 + (hp * 0.25))
  if (car.type?.toLowerCase().includes('tractor')) topSpeed = 25;
  
  return { hp, torque, accel: Number(accel.toFixed(1)), topSpeed }
}

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80", // Classic dark aesthetic
  "https://images.unsplash.com/photo-1503376710915-d9154a4f8087?auto=format&fit=crop&w=800&q=80", // Sleek
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80", // Sports focused
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80", // Premium stance
]

export function getFallbackImage(car: Partial<Car>) {
  if (car.image && car.image.length > 0) return car.image
  
  const hashStr = car.id || car.name || "fallback"
  let hash = 0
  for (let i = 0; i < hashStr.length; i++) {
    hash = hashStr.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return FALLBACK_IMAGES[Math.abs(hash) % FALLBACK_IMAGES.length]
}

export function estimatePrice(car: Partial<Car>) {
  if (car.price && car.price > 100) return car.price

  const premiumBrands = ['Ferrari', 'Lamborghini', 'McLaren', 'Koenigsegg', 'Bugatti', 'Pagani', 'Aston Martin']
  const luxuryBrands = ['Porsche', 'Mercedes-Benz', 'BMW', 'Audi', 'Lexus', 'Maserati']
  
  let basePrice = 30000
  if (car.brand && premiumBrands.includes(car.brand)) basePrice = 250000
  if (car.brand && luxuryBrands.includes(car.brand)) basePrice = 65000

  // Fallback class reduction
  const t = car.type?.toLowerCase() || '';
  if (t.includes('tractor')) basePrice = 12000;
  if (t.includes('hatchback')) basePrice = Math.min(basePrice, 35000);

  const hp = car.horsepower && car.horsepower > 0 ? car.horsepower : 250
  
  // Round to nearest 500
  return Math.round((basePrice + (hp * 120)) / 500) * 500
}
