'use client'

export default function myImageLoader({ src, width, quality }: { src: string, width: number, quality?: number }) {
  // 1. Pass through local files, unsupported formats, or already-proxied URLs
  if (
    src.startsWith('/') ||
    src.includes('.svg') ||
    src.includes('images.unsplash.com') ||
    src.includes('wsrv.nl') ||
    src.includes('i0.wp.com') ||
    src.includes('placehold.co')
  ) {
    return src;
  }

  // 2. Cloudinary native resizing
  if (src.includes('res.cloudinary.com') && src.includes('/image/upload/')) {
    // Inject w_{width},q_{quality},f_auto into the Cloudinary URL
    const q = quality ? `q_${quality}` : 'q_auto';
    return src.replace('/image/upload/', `/image/upload/w_${width},${q},f_auto/`);
  }

  // 3. Use wsrv.nl proxy as fallback for unmigrated images
  return `https://wsrv.nl/?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}&output=webp`;
}
