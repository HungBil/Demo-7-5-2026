/**
 * Article normalizer — converts raw crawl data into a valid ArticleRecord.
 * CRITICAL: Never rewrite, paraphrase, or summarize article content.
 */

import crypto from 'crypto';
import { ArticleRecord, ArticleImage, ArticleMetadata } from '@/types/article';

/**
 * Generate a stable ID from a URL (first 16 chars of SHA-256).
 */
export function generateId(url: string): string {
  return crypto.createHash('sha256').update(url).digest('hex').slice(0, 16);
}

/**
 * Generate a URL-safe slug from a Vietnamese title.
 * Removes diacritics, replaces spaces with hyphens.
 */
export function generateSlug(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining diacritics
    .replace(/đ/gi, 'd')
    .replace(/[^a-z0-9\s-]/gi, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120); // max slug length
}

/**
 * Convert HTML to plain text for BM25 indexing.
 * Strips tags, decodes common HTML entities.
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export interface RawCrawlData {
  sourceUrl: string;
  title?: string;
  markdown?: string;
  html?: string;
  textContent?: string;
  images?: ArticleImage[];
  publishedAt?: string;
  description?: string;
  category?: string;
  canonicalUrl?: string;
}

/**
 * Normalize raw crawl data into a canonical ArticleRecord.
 * Content is preserved as-is; never rewritten or summarized.
 */
export function normalizeArticle(raw: RawCrawlData): ArticleRecord {
  const sourceUrl = raw.sourceUrl;
  const id = generateId(sourceUrl);

  const title = (raw.title || '').trim();
  const slug = generateSlug(title) || id;

  const markdown = raw.markdown || '';
  const html = raw.html;
  const textContent =
    raw.textContent || htmlToText(html || '') || markdown.replace(/[#*`\[\]]/g, '').trim();

  // Extract category from bqp.vn URL pattern: /sa-tt-{category}/
  const categoryMatch = sourceUrl.match(/\/sa-tt-([a-z]+)\//);
  const urlCategory = categoryMatch ? mapCategory(categoryMatch[1]) : undefined;

  const metadata: ArticleMetadata = {
    sourceUrl,
    canonicalUrl: raw.canonicalUrl,
    title,
    description: raw.description,
    publishedAt: raw.publishedAt,
    crawledAt: new Date().toISOString(),
    category: raw.category || urlCategory,
    siteName: 'Cổng TTĐT Bộ Quốc phòng Việt Nam',
  };

  return {
    id,
    slug,
    title,
    sourceUrl,
    markdown,
    html,
    textContent,
    images: raw.images || [],
    metadata,
  };
}

/**
 * Map bqp.vn URL category codes to human-readable labels.
 */
function mapCategory(code: string): string {
  const map: Record<string, string> = {
    qpan: 'Quân sự - Quốc phòng',
    dnqp: 'Đối ngoại Quốc phòng',
    tn: 'Tin nhanh',
    cmsk: 'Chính sách',
    qlcddh: 'Quản lý - Chỉ đạo',
  };
  return map[code] || code;
}
