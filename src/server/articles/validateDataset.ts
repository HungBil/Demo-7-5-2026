/**
 * validateDataset.ts — Validate the entire article dataset.
 * Run via: npx tsx scripts/validate-articles.ts
 */

import { loadArticles } from './loadArticles';
import { validateDataset } from '@/server/crawler/validateArticle';

export async function runDatasetValidation(): Promise<boolean> {
  const articles = await loadArticles();

  if (articles.length === 0) {
    console.log('[validateDataset] No articles found in src/data/articles/');
    console.log('[validateDataset] Run: npx tsx scripts/crawl-bqp.ts <url>');
    return true; // empty dataset is not an error
  }

  console.log(`[validateDataset] Validating ${articles.length} articles...`);
  const { valid, results, duplicateSlugs, duplicateUrls } = validateDataset(articles);

  let hasErrors = false;
  for (const { slug, result } of results) {
    if (!result.valid) {
      console.error(`\n❌ INVALID: ${slug}`);
      result.errors.forEach((e) => console.error(`   ERROR: ${e}`));
      hasErrors = true;
    } else if (result.warnings.length > 0) {
      console.warn(`\n⚠️  WARNING: ${slug}`);
      result.warnings.forEach((w) => console.warn(`   WARN: ${w}`));
    } else {
      console.log(`✅ OK: ${slug}`);
    }
  }

  if (duplicateSlugs.length > 0) {
    console.error(`\n❌ DUPLICATE SLUGS: ${duplicateSlugs.join(', ')}`);
    hasErrors = true;
  }
  if (duplicateUrls.length > 0) {
    console.error(`\n❌ DUPLICATE SOURCE URLS: ${duplicateUrls.join(', ')}`);
    hasErrors = true;
  }

  console.log(`\n${valid && !hasErrors ? '✅ Dataset valid' : '❌ Dataset has errors'}`);
  console.log(`Total articles: ${articles.length}`);
  return !hasErrors;
}
