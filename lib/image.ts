export function isUnoptimizedUrl(url: string | null | undefined): boolean {
  if (!url) return false
  // All external images are now proxied through wsrv.nl for reliable WebP delivery.
  // No URLs need to bypass Next.js optimization.
  return false
}
