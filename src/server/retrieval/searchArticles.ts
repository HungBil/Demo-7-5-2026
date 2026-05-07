/**
 * searchArticles.ts — Main retrieval entry point.
 * Loads all articles, chunks them, runs BM25, returns ranked SearchResults.
 * Snippets are verbatim excerpts — never rewritten.
 */

import { loadArticles } from "@/server/articles/loadArticles";
import { chunkArticle } from "./chunkArticle";
import { bm25Search } from "./bm25";
import type { SearchResult, SearchOptions } from "./types";

/**
 * Extract a readable snippet from chunk text that contains matched terms.
 * Always returns verbatim text from the original chunk.
 */
function extractSnippet(text: string, matchedTerms: string[], maxLen = 240): string {
  if (matchedTerms.length === 0) return text.slice(0, maxLen);

  const lower = text.toLowerCase();
  let bestPos = 0;
  let bestScore = -1;

  // Find position that covers most matched terms
  for (let i = 0; i < lower.length - 50; i++) {
    const window = lower.slice(i, i + maxLen);
    const score = matchedTerms.filter((t) => window.includes(t)).length;
    if (score > bestScore) {
      bestScore = score;
      bestPos = i;
    }
  }

  const snippet = text.slice(bestPos, bestPos + maxLen);
  return (bestPos > 0 ? "…" : "") + snippet + (bestPos + maxLen < text.length ? "…" : "");
}

let _cachedChunks: ReturnType<typeof chunkArticle> | null = null;
let _cacheKey = "";

/**
 * Search articles using BM25 ranking.
 */
export async function searchArticles(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const { limit = 5 } = options;

  if (!query.trim()) return [];

  // Load + chunk all articles (cached in memory during a single request lifecycle)
  const articles = await loadArticles();
  const cacheKey = articles.map((a) => a.id).join(",");

  if (cacheKey !== _cacheKey || !_cachedChunks) {
    const allChunks: ReturnType<typeof chunkArticle> = [];
    for (const article of articles) {
      allChunks.push(...chunkArticle(article));
    }
    _cachedChunks = allChunks;
    _cacheKey = cacheKey;
  }

  const bm25Results = bm25Search(query, _cachedChunks, limit * 2);

  // Deduplicate by article (keep best-scoring chunk per article)
  const seen = new Set<string>();
  const deduped = bm25Results.filter((r) => {
    if (seen.has(r.chunk.articleId)) return false;
    seen.add(r.chunk.articleId);
    return true;
  });

  return deduped.slice(0, limit).map((r) => ({
    articleId: r.chunk.articleId,
    slug: r.chunk.slug,
    title: r.chunk.title,
    sourceUrl: r.chunk.sourceUrl,
    score: Math.round(r.score * 1000) / 1000,
    snippet: extractSnippet(r.chunk.text, r.matchedTerms),
    citation: {
      title: r.chunk.title,
      sourceUrl: r.chunk.sourceUrl,
      slug: r.chunk.slug,
      chunkIndex: r.chunk.chunkIndex,
      publishedAt: r.chunk.publishedAt,
    },
    chunkIndex: r.chunk.chunkIndex,
    matchedTerms: r.matchedTerms,
  }));
}
