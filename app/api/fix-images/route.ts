import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/api-service';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_CX;
const CRON_SECRET = process.env.CRON_SECRET || '';

const BAD_IMAGE_KEYWORDS = [
  'engine', 'motor', 'powertrain', 'cutaway', 'diagram', 'schematic',
  'logo', 'badge', 'emblem', 'blueprint', 'patent', 'drawing',
  'dashboard', 'cockpit', 'interior', 'steering',
  'assembly.line', 'factory', 'plant',
  'portrait', 'headshot', 'person', 'people', 'driver',
  'thumbnail', 'icon', 'avatar', 'placeholder', 'stock',
];
const BAD_IMAGE_REGEX = new RegExp(BAD_IMAGE_KEYWORDS.join('|'), 'i');
const BLOCKED_DOMAINS = [
  'pinterest.com', 'facebook.com', 'instagram.com', 'twitter.com',
  'tiktok.com', 'reddit.com', 'ebay.com', 'amazon.com',
  'shutterstock.com', 'gettyimages.com', 'alamy.com', 'istockphoto.com',
  'dreamstime.com', '123rf.com',
];

function isGoodImage(url: string) {
  if (!url) return false;
  if (url.toLowerCase().endsWith('.svg')) return false;
  if (url.toLowerCase().endsWith('.gif')) return false;
  
  try {
    const hostname = new URL(url).hostname;
    if (BLOCKED_DOMAINS.some(d => hostname.includes(d))) return false;
  } catch { return false; }
  
  try {
    const filename = decodeURIComponent(new URL(url).pathname.split('/').pop() || '');
    return !BAD_IMAGE_REGEX.test(filename);
  } catch {
    return !BAD_IMAGE_REGEX.test(decodeURIComponent(url.split('/').pop() || ''));
  }
}

async function searchGoogleImage(brand: string, model: string, year: number | null) {
  if (!GOOGLE_API_KEY || !GOOGLE_CX) {
    throw new Error('Missing GOOGLE_API_KEY or GOOGLE_CX in .env');
  }

  let cleanModel = model;
  if (cleanModel.startsWith(brand + ' ')) {
    cleanModel = cleanModel.slice(brand.length + 1);
  }
  cleanModel = cleanModel.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  cleanModel = cleanModel.replace(/\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\s+generation\b/gi, '').trim();

  const yearStr = year && year > 1990 ? ` ${year}` : '';
  const query = encodeURIComponent(`${brand} ${cleanModel}${yearStr} car exterior photo`);

  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${query}&searchType=image&imgSize=xlarge&imgType=photo&safe=active&num=3`;

  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) {
    if (res.status === 429) {
       throw new Error('Google API quota exceeded');
    }
    const errBody = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${errBody.slice(0, 100)}`);
  }

  const data = await res.json();
  if (!data.items || data.items.length === 0) return null;

  for (const item of data.items) {
    if (isGoodImage(item.link)) {
      return item.link;
    }
  }
  return null;
}

async function uploadToCloudinary(imageUrl: string, carId: string) {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'velocity/cars',
      public_id: `car_${carId}_${Date.now()}`,
      resource_type: 'image'
    });
    return result.secure_url;
  } catch (err: any) {
    throw new Error(`Cloudinary upload failed: ${err.message}`);
  }
}

export const maxDuration = 300; // 5 mins for Vercel
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Auth check — prevent public access
  const authHeader = request.headers.get('authorization')
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const cars = await prisma.car.findMany({
      where: {
        OR: [
          { image: { contains: 'placehold.co' } },
          { image: { equals: '' } }
        ]
      },
      select: {
        id: true,
        name: true,
        brand: true,
        year: true,
        image: true
      },
      take: 20
    });

    const results = [];

    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      try {
        const googleImageUrl = await searchGoogleImage(car.brand, car.name, car.year);
        
        if (!googleImageUrl) {
          results.push({ car: car.name, status: 'No image found' });
          continue;
        }
        
        const cloudinaryUrl = await uploadToCloudinary(googleImageUrl, car.id);
        
        await prisma.car.update({
          where: { id: car.id },
          data: { 
            image: cloudinaryUrl,
            cdnImage: cloudinaryUrl
          }
        });
        
        results.push({ car: car.name, status: 'Success', url: cloudinaryUrl });
      } catch (err: any) {
        results.push({ car: car.name, status: 'Error', message: err.message });
      }
    }

    return NextResponse.json({ success: true, count: cars.length, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
