/**
 * Retrieval type contracts.
 * Source of truth for BM25 search and the chatbot agent.
 */

export interface Citation {
  title: string;
  sourceUrl: string;
  slug: string;
  chunkIndex: number;
  publishedAt?: string;
}

export interface SearchResult {
  articleId: string;
  slug: string;
  title: string;
  sourceUrl: string;
  /** BM25 score, higher = more relevant */
  score: number;
  /** Verbatim excerpt from original content, never rewritten */
  snippet: string;
  citation: Citation;
  chunkIndex: number;
  matchedTerms: string[];
}

export interface SearchOptions {
  limit?: number;       // max results to return (default: 5)
  articleLimit?: number; // max articles to pull from (default: all)
}
