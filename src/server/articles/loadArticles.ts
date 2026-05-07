/**
 * loadArticles.ts — Load and query articles from local JSON storage.
 * Data source: src/data/articles/*.json
 * Never modifies article content.
 */

import fs from 'fs';
import path from 'path';
import { ArticleRecord, ArticleSummary } from '@/types/article';

const DATA_DIR = path.join(process.cwd(), 'src', 'data', 'articles');

/**
 * Load all ArticleRecords from local JSON storage.
 */
export async function loadArticles(): Promise<ArticleRecord[]> {
  if (!fs.existsSync(DATA_DIR)) return [];

  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith('.json'));

  const records: ArticleRecord[] = [];
  for (const file of files) {
    try {
      const filePath = path.join(DATA_DIR, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const record = JSON.parse(raw) as ArticleRecord;
      records.push(record);
    } catch (err) {
      console.error(`[loadArticles] Failed to parse ${file}:`, err);
    }
  }

  // Sort by crawledAt descending (newest first)
  return records.sort((a, b) =>
    b.metadata.crawledAt.localeCompare(a.metadata.crawledAt)
  );
}

/**
 * Get a single article by slug.
 */
export async function getArticleBySlug(
  slug: string
): Promise<ArticleRecord | null> {
  const filePath = path.join(DATA_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    // Search by scanning all files (slug may differ from filename)
    const all = await loadArticles();
    return all.find((a) => a.slug === slug) ?? null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ArticleRecord;
  } catch {
    return null;
  }
}

/**
 * Get a single article by ID.
 */
export async function getArticleById(
  id: string
): Promise<ArticleRecord | null> {
  const all = await loadArticles();
  return all.find((a) => a.id === id) ?? null;
}

/**
 * List lightweight article summaries (avoids loading full markdown).
 */
export async function listArticleSummaries(): Promise<ArticleSummary[]> {
  const articles = await loadArticles();
  return articles.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    sourceUrl: a.sourceUrl,
    publishedAt: a.metadata.publishedAt,
    category: a.metadata.category,
    description: a.metadata.description,
    imageCount: a.images.length,
    thumbnailUrl: a.images[0]?.absoluteSrc,
    crawledAt: a.metadata.crawledAt,
  }));
}

/**
 * Save an ArticleRecord to local JSON storage.
 * Filename: {slug}.json
 */
export function saveArticle(record: ArticleRecord): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const filePath = path.join(DATA_DIR, `${record.slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf-8');
}
