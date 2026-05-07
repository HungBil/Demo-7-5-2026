/**
 * Image extractor — parses img elements from HTML to ArticleImage[].
 * Handles src, data-src, data-original, srcset.
 * Converts relative URLs to absolute. Deduplicates by absoluteSrc.
 */

import crypto from 'crypto';
import { ArticleImage } from '@/types/article';

const BASE_URL = 'https://bqp.vn';

/**
 * Resolve a potentially relative URL to absolute.
 */
export function toAbsoluteUrl(src: string, baseUrl: string = BASE_URL): string {
  if (!src || src.startsWith('data:')) return src;
  try {
    return new URL(src, baseUrl).href;
  } catch {
    return src;
  }
}

/**
 * Generate a stable ID for an image from its absolute URL.
 */
function imageId(absoluteSrc: string): string {
  return crypto.createHash('sha256').update(absoluteSrc).digest('hex').slice(0, 16);
}

/**
 * Extract the best src from an img element's attributes.
 * Priority: data-original > data-src > src > srcset (first entry).
 */
function extractSrc(attrs: Record<string, string | undefined>): string {
  return (
    attrs['data-original'] ||
    attrs['data-src'] ||
    attrs['src'] ||
    extractSrcset(attrs['srcset'] || '') ||
    ''
  );
}

/**
 * Extract the first URL from a srcset attribute.
 */
function extractSrcset(srcset: string): string {
  if (!srcset) return '';
  const first = srcset.split(',')[0]?.trim();
  return first ? first.split(/\s+/)[0] : '';
}

/**
 * Parse img tags from raw HTML and return deduplicated ArticleImage[].
 */
export function extractImagesFromHtml(
  html: string,
  baseUrl: string = BASE_URL
): ArticleImage[] {
  const imgRegex = /<img([^>]*?)(?:\/>|>)/gi;
  const attrRegex = /(\w[\w-]*)=["']([^"']*)["']/gi;
  const seen = new Set<string>();
  const images: ArticleImage[] = [];

  let imgMatch: RegExpExecArray | null;
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    const attrsStr = imgMatch[1];
    const attrs: Record<string, string> = {};
    let attrMatch: RegExpExecArray | null;
    const attrRegexLocal = new RegExp(attrRegex.source, 'gi');
    while ((attrMatch = attrRegexLocal.exec(attrsStr)) !== null) {
      attrs[attrMatch[1].toLowerCase()] = attrMatch[2];
    }

    const rawSrc = extractSrc(attrs);
    if (!rawSrc) continue;

    const absoluteSrc = toAbsoluteUrl(rawSrc, baseUrl);
    if (!absoluteSrc || seen.has(absoluteSrc)) continue;

    // Skip tiny icons / tracking pixels
    const w = parseInt(attrs['width'] || '0', 10);
    const h = parseInt(attrs['height'] || '0', 10);
    if ((w > 0 && w < 20) || (h > 0 && h < 20)) continue;

    seen.add(absoluteSrc);
    images.push({
      id: imageId(absoluteSrc),
      src: rawSrc,
      absoluteSrc,
      alt: attrs['alt'] || undefined,
      width: w > 0 ? w : undefined,
      height: h > 0 ? h : undefined,
    });
  }

  return images;
}

/**
 * Extract images from markdown image syntax: ![alt](src).
 */
export function extractImagesFromMarkdown(
  markdown: string,
  baseUrl: string = BASE_URL
): ArticleImage[] {
  const mdImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const seen = new Set<string>();
  const images: ArticleImage[] = [];

  let match: RegExpExecArray | null;
  while ((match = mdImgRegex.exec(markdown)) !== null) {
    const alt = match[1] || undefined;
    const rawSrc = match[2];
    if (!rawSrc) continue;

    const absoluteSrc = toAbsoluteUrl(rawSrc, baseUrl);
    if (!absoluteSrc || seen.has(absoluteSrc)) continue;

    seen.add(absoluteSrc);
    images.push({
      id: imageId(absoluteSrc),
      src: rawSrc,
      absoluteSrc,
      alt,
    });
  }

  return images;
}

/**
 * Merge two image arrays, deduplicating by absoluteSrc.
 */
export function mergeImages(
  primary: ArticleImage[],
  secondary: ArticleImage[]
): ArticleImage[] {
  const seen = new Set(primary.map((img) => img.absoluteSrc));
  const merged = [...primary];
  for (const img of secondary) {
    if (!seen.has(img.absoluteSrc)) {
      seen.add(img.absoluteSrc);
      merged.push(img);
    }
  }
  return merged;
}
