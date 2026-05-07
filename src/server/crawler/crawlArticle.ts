/**
 * crawlArticle.ts — Main crawler for bqp.vn articles.
 *
 * Strategy:
 * 1. Use Firecrawl API for markdown + HTML extraction (fast, reliable).
 * 2. Use Playwright (via MCP or local) as fallback/supplement for:
 *    - Lazy-loaded images
 *    - Dynamic content not captured by Firecrawl
 * 3. Normalize + validate before returning ArticleRecord.
 *
 * CRITICAL: Preserve all original content. Never rewrite or paraphrase.
 */

import FirecrawlApp from '@mendable/firecrawl-js';
import { ArticleRecord } from '@/types/article';
import { extractImagesFromHtml, extractImagesFromMarkdown, mergeImages } from './imageExtractor';
import { normalizeArticle } from './normalizeArticle';
import { validateArticle } from './validateArticle';
import { getFirecrawlApiKey } from '@/lib/config/env';

export interface CrawlOptions {
  /** Timeout in ms for Playwright fallback (default: 15000) */
  playwrightTimeoutMs?: number;
  /** Whether to use Playwright fallback for image extraction */
  usePlaywrightFallback?: boolean;
  /** Verbose logging */
  verbose?: boolean;
}

export interface CrawlResult {
  record: ArticleRecord;
  warnings: string[];
  usedPlaywrightFallback: boolean;
}

/**
 * Crawl a single bqp.vn article URL.
 * Returns a validated ArticleRecord or throws on critical failure.
 */
export async function crawlArticle(
  url: string,
  options: CrawlOptions = {}
): Promise<CrawlResult> {
  const { verbose = false, usePlaywrightFallback = true } = options;
  const log = verbose ? console.log : () => {};

  log(`[crawler] Crawling: ${url}`);

  // ── Step 1: Firecrawl extraction ──────────────────────────────────────────
  const apiKey = getFirecrawlApiKey();
  const firecrawl = new FirecrawlApp({ apiKey });

  let markdown = '';
  let html = '';
  let title = '';
  let description = '';
  let publishedAt: string | undefined;

  try {
    log('[crawler] Calling Firecrawl...');
    const result = await firecrawl.scrapeUrl(url, {
      formats: ['markdown', 'html'],
    });

    if (result.success) {
      markdown = result.markdown || '';
      html = result.html || '';

      // Extract metadata from Firecrawl response
      const meta = (result as Record<string, unknown>).metadata as Record<string, string> | undefined;
      title = meta?.['og:title'] || meta?.['title'] || extractTitleFromMarkdown(markdown);
      description = meta?.['og:description'] || meta?.['description'] || '';
      publishedAt = meta?.['article:published_time'] || meta?.['publishedTime'] || undefined;

      log(`[crawler] Firecrawl success. Title: "${title}", markdown length: ${markdown.length}`);
    } else {
      log('[crawler] Firecrawl returned unsuccessful result, will use fallback data');
    }
  } catch (err) {
    log(`[crawler] Firecrawl error: ${err}. Continuing with partial data.`);
  }

  // ── Step 2: Extract images ──────────────────────────────────────────────
  let images = mergeImages(
    extractImagesFromHtml(html, url),
    extractImagesFromMarkdown(markdown, url)
  );

  // Filter to only include bqp.vn domain images (avoid tracking pixels, ads)
  images = images.filter(
    (img) =>
      img.absoluteSrc.includes('bqp.vn') ||
      img.absoluteSrc.includes('mod.gov.vn')
  );

  log(`[crawler] Found ${images.length} images`);

  // ── Step 3: Playwright fallback for missing content ────────────────────
  let usedPlaywrightFallback = false;
  const warnings: string[] = [];

  if (usePlaywrightFallback && (!title || !markdown || images.length === 0)) {
    log('[crawler] Triggering Playwright fallback for missing content...');
    try {
      const playwrightData = await crawlWithPlaywright(url, options);
      if (!title && playwrightData.title) title = playwrightData.title;
      if (!markdown && playwrightData.textContent) markdown = playwrightData.textContent;
      if (playwrightData.images.length > 0) {
        images = mergeImages(images, playwrightData.images);
      }
      usedPlaywrightFallback = true;
      log(`[crawler] Playwright fallback added ${playwrightData.images.length} extra images`);
    } catch (err) {
      warnings.push(`Playwright fallback failed: ${err}`);
      log(`[crawler] Playwright fallback error: ${err}`);
    }
  }

  // ── Step 4: Normalize into ArticleRecord ──────────────────────────────
  const record = normalizeArticle({
    sourceUrl: url,
    title,
    markdown,
    html,
    images,
    publishedAt,
    description,
  });

  // ── Step 5: Validate ──────────────────────────────────────────────────
  const validation = validateArticle(record);
  if (!validation.valid) {
    throw new Error(
      `[crawler] Invalid article at ${url}:\n${validation.errors.join('\n')}`
    );
  }
  warnings.push(...validation.warnings);

  log(`[crawler] Done. ID: ${record.id}, slug: ${record.slug}`);
  return { record, warnings, usedPlaywrightFallback };
}

/**
 * Extract title from markdown (first H1 or H2 heading).
 */
function extractTitleFromMarkdown(markdown: string): string {
  const match = markdown.match(/^#{1,2}\s+(.+)$/m);
  return match ? match[1].trim() : '';
}

/**
 * Playwright-based fallback crawl for lazy images and missing data.
 * Uses the playwright MCP server when available.
 */
async function crawlWithPlaywright(
  url: string,
  _options: CrawlOptions
): Promise<{ title: string; textContent: string; images: import('@/types/article').ArticleImage[] }> {
  // NOTE: In production, this would use the Playwright MCP tools.
  // For the script runner (scripts/crawl-bqp.ts), playwright is used via
  // the @playwright/test package directly.
  // This function is kept as a stub that can be extended.
  const { extractImagesFromHtml } = await import('./imageExtractor');

  // Try a simple fetch as lightweight fallback
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  const html = await response.text();

  // Extract title from <title> tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s*[\|\-–]\s*[^|]+$/, '').trim() : '';

  // Extract text content from article body
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                       html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  const bodyHtml = articleMatch ? articleMatch[1] : html;
  const textContent = bodyHtml
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 10000);

  const images = extractImagesFromHtml(html, url);

  return { title, textContent, images };
}
