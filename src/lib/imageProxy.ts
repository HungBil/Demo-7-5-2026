/**
 * imageProxy.ts — Convert bqp.vn image URLs to proxied URLs.
 * Also filters out non-article images (logos, banners, nav icons).
 */

import type { ArticleImage } from "@/types/article";

const SKIP_PATTERNS = [
  "logo.jpg",
  "banner600.jpg",
  "icon-search.png",
  "bnqc-",       // sidebar partner banners
  "PAKNvbQPPL",
  "TrangcongTP",
  "KVCB-HCBtq",
  "NtBDHVS",
];

/** Return true if an image URL is a UI chrome asset, not article content */
export function isUIChrome(url: string): boolean {
  return SKIP_PATTERNS.some((p) => url.includes(p));
}

/**
 * Convert a raw bqp.vn image URL to a proxied URL.
 * Routes through /api/image-proxy to avoid CORS / mixed-content issues.
 */
export function proxiedImageUrl(originalUrl: string): string {
  if (!originalUrl) return "";
  // Decode any HTML entities (&amp; → &)
  const cleaned = originalUrl.replace(/&amp;/g, "&");
  return `/api/image-proxy?url=${encodeURIComponent(cleaned)}`;
}

/** Filter an images array to content-only images (no logos/banners) */
export function contentImages(images: ArticleImage[]): ArticleImage[] {
  return images.filter((img) => !isUIChrome(img.absoluteSrc || img.src));
}
