export function isUnoptimizedUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes('wikimedia.org');
}
