export function isUnoptimizedUrl(url: string | null | undefined): boolean {
  if (!url) return false
  
  // Wikipedia/Wikimedia images don't go through the Next.js image optimizer
  // because Wikipedia aggressively blocks caching servers/scrapers.
  if (url.includes('wikimedia.org') || url.includes('wikipedia.org')) {
    return true
  }
  
  return false
}
