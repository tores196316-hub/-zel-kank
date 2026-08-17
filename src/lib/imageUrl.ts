/**
 * Utility to format and resolve image URLs safely on the client side.
 * If the URL points to a local upload path or was stored with localhost,
 * it adapts to the current origin.
 */
export function formatImageUrl(url?: string): string {
  if (!url) return '';
  
  // Cloudinary CDN URLs remain direct
  if (url.includes('res.cloudinary.com')) {
    return url;
  }

  // If the URL contains /uploads/
  if (url.includes('/uploads/')) {
    const idx = url.indexOf('/uploads/');
    return url.substring(idx);
  }

  // If the URL contains /api/images/
  if (url.includes('/api/images/')) {
    const idx = url.indexOf('/api/images/');
    return url.substring(idx);
  }

  return url;
}
