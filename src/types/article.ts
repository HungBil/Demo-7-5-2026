/**
 * Article data contract — source of truth for all phases.
 * DO NOT mutate original article content. These types define
 * the canonical storage format for crawled bqp.vn articles.
 */

/**
 * Represents a single image extracted from an article.
 */
export interface ArticleImage {
  /** Stable unique ID (hash of absoluteSrc) */
  id: string;
  /** Original src as found in HTML (may be relative) */
  src: string;
  /** Resolved absolute URL, required for rendering */
  absoluteSrc: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

/**
 * Metadata about an article's origin and provenance.
 */
export interface ArticleMetadata {
  /** Canonical source URL of the article on bqp.vn */
  sourceUrl: string;
  canonicalUrl?: string;
  /** Article title as crawled — MUST match original */
  title: string;
  description?: string;
  /** ISO 8601 string if available on the page */
  publishedAt?: string;
  /** ISO 8601 timestamp when this article was crawled */
  crawledAt: string;
  category?: string;
  tags?: string[];
  siteName?: string;
}

/**
 * The canonical record for a single crawled article.
 * Stored as JSON at src/data/articles/{slug}.json.
 */
export interface ArticleRecord {
  /** Stable unique ID: SHA-256 of sourceUrl (first 16 chars) */
  id: string;
  /** URL-safe slug derived from the article title */
  slug: string;
  /** Article title — MUST match original, never rewritten */
  title: string;
  /** Canonical source URL */
  sourceUrl: string;
  /** Full markdown content — MUST match original, never paraphrased */
  markdown: string;
  /** Raw HTML content if available */
  html?: string;
  /** Plaintext content for BM25 indexing */
  textContent: string;
  /** All images extracted from the article */
  images: ArticleImage[];
  /** Article provenance and metadata */
  metadata: ArticleMetadata;
}

/**
 * Lightweight summary for listing pages (avoids loading full markdown).
 */
export interface ArticleSummary {
  id: string;
  slug: string;
  title: string;
  sourceUrl: string;
  publishedAt?: string;
  category?: string;
  description?: string;
  imageCount: number;
  /** URL of the first image for card display */
  thumbnailUrl?: string;
  crawledAt: string;
}
