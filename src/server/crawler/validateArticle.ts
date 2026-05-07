/**
 * Article validator — validates an ArticleRecord before storage.
 * Returns an array of error strings; empty array means valid.
 */

import { ArticleRecord } from '@/types/article';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a single ArticleRecord.
 */
export function validateArticle(record: ArticleRecord): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!record.id) errors.push('Missing id');
  if (!record.slug) errors.push('Missing slug');
  if (!record.title || record.title.trim().length === 0) {
    errors.push('Title is empty');
  }
  if (!record.sourceUrl) {
    errors.push('Missing sourceUrl');
  } else {
    try {
      new URL(record.sourceUrl);
    } catch {
      errors.push(`Invalid sourceUrl: ${record.sourceUrl}`);
    }
  }
  if (!record.markdown && !record.textContent) {
    errors.push('Both markdown and textContent are empty — no article content');
  }
  if (record.markdown && record.markdown.trim().length < 50) {
    warnings.push('Markdown content is suspiciously short (< 50 chars)');
  }

  // Metadata
  if (!record.metadata.crawledAt) errors.push('Missing metadata.crawledAt');

  // Images
  for (const img of record.images) {
    if (!img.absoluteSrc) {
      errors.push(`Image ${img.id} is missing absoluteSrc`);
    } else {
      try {
        new URL(img.absoluteSrc);
      } catch {
        errors.push(`Image ${img.id} has invalid absoluteSrc: ${img.absoluteSrc}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate multiple records and check for cross-record duplicates.
 */
export function validateDataset(records: ArticleRecord[]): {
  valid: boolean;
  results: Array<{ id: string; slug: string; result: ValidationResult }>;
  duplicateSlugs: string[];
  duplicateUrls: string[];
} {
  const slugCounts = new Map<string, number>();
  const urlCounts = new Map<string, number>();

  for (const r of records) {
    slugCounts.set(r.slug, (slugCounts.get(r.slug) || 0) + 1);
    urlCounts.set(r.sourceUrl, (urlCounts.get(r.sourceUrl) || 0) + 1);
  }

  const duplicateSlugs = [...slugCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([slug]) => slug);
  const duplicateUrls = [...urlCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([url]) => url);

  const results = records.map((r) => ({
    id: r.id,
    slug: r.slug,
    result: validateArticle(r),
  }));

  const valid =
    results.every((r) => r.result.valid) &&
    duplicateSlugs.length === 0 &&
    duplicateUrls.length === 0;

  return { valid, results, duplicateSlugs, duplicateUrls };
}
