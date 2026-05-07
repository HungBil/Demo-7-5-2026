/**
 * imageProxy.ts — Convert bqp.vn image URLs to local paths or proxied URLs.
 * Priority: localPath (downloaded to /public) → proxy API → original URL.
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
  "contenthandler/dav/themelist",
];

/** Return true if an image URL is a UI chrome asset, not article content */
export function isUIChrome(url: string): boolean {
  return SKIP_PATTERNS.some((p) => url.includes(p));
}

/**
 * Convert a raw bqp.vn image URL to a proxied URL (fallback only).
 * Routes through /api/image-proxy to avoid CORS / mixed-content issues.
 */
export function proxiedImageUrl(originalUrl: string): string {
  if (!originalUrl) return "";
  const cleaned = originalUrl.replace(/&amp;/g, "&");
  return `/api/image-proxy?url=${encodeURIComponent(cleaned)}`;
}

/**
 * Return the best available image URL for an ArticleImage:
 * 1. localPath (file downloaded to /public/images/articles/...) — fastest, no external request
 * 2. Proxy API — for images not yet downloaded
 */
export function bestImageUrl(img: ArticleImage): string {
  if (img.localPath) return img.localPath;
  const raw = img.absoluteSrc || img.src;
  if (!raw) return "";
  return proxiedImageUrl(raw);
}

/** Filter an images array to content-only images (no logos/banners) */
export function contentImages(images: ArticleImage[]): ArticleImage[] {
  return images.filter(
    (img) =>
      !img.isUIChrome &&
      !isUIChrome(img.absoluteSrc || img.src || "") &&
      // Only keep wcm/connect images (actual article photos)
      (img.absoluteSrc || img.src || "").includes("/wcm/connect/")
  );
}

/**
 * Build a lookup map: bqp.vn absolute URL → local path (or proxy URL).
 * Used to replace src attributes inside raw HTML bodies.
 */
export function buildImageUrlMap(images: ArticleImage[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const img of images) {
    if (img.isUIChrome) continue;
    const raw = img.absoluteSrc || img.src;
    if (!raw) continue;
    const best = bestImageUrl(img);
    // Register both http and https variants, and &amp; variants
    const variants = [
      raw,
      raw.replace(/^https?:\/\/bqp\.vn/, "http://bqp.vn"),
      raw.replace(/^https?:\/\/bqp\.vn/, "https://bqp.vn"),
      raw.replace(/&amp;/g, "&"),
      raw.replace(/&/g, "&amp;"),
    ];
    for (const v of variants) {
      if (!map.has(v)) map.set(v, best);
    }
  }
  return map;
}
