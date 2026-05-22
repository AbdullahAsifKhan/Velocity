'use client'

// Set this to your Cloudflare R2 public bucket URL later. (e.g., 'cdn.velocity.app')
const R2_DOMAIN = process.env.NEXT_PUBLIC_R2_DOMAIN || 'your-r2-domain-placeholder.com';
const USE_CLOUDFLARE_RESIZING = false; // Toggle to true once Cloudflare Image Resizing is enabled

export default function myImageLoader({ src, width, quality }: { src: string, width: number, quality?: number }) {
  // 1. Pass through local files, unsupported formats, or already-proxied URLs
  if (src.startsWith('/') || src.includes('.svg') || src.includes('images.unsplash.com') || src.includes('wsrv.nl')) {
    return src;
  }
  
  // Wiki images go through wsrv.nl proxy like everything else for reliable WebP delivery.
  // If wsrv.nl is temporarily blocked by Wikipedia, the frontend onError handler catches it.
  
  // 2. Future-Proofing: Cloudflare Native Image Resizing 
  // If the image is coming from our R2 bucket and we enabled native resizing
  if (USE_CLOUDFLARE_RESIZING && src.includes(R2_DOMAIN)) {
    try {
      const url = new URL(src);
      // Cloudflare native format: cdn.domain.com/cdn-cgi/image/w=800,q=75,f=auto/path/to/image.webp
      return `${url.origin}/cdn-cgi/image/w=${width},q=${quality || 75},f=auto${url.pathname}`;
    } catch (e) {
      // If parsing fails for any reason, fall down to proxy
    }
  }

  // 3. Current Strategy: Free wsrv.nl proxy
  // Bypasses Wikipedia firewalls and generates responsive WebP images on the fly
  return `https://wsrv.nl/?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}&output=webp`;
}
