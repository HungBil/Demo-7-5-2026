/**
 * bm25.ts — BM25 scoring for Vietnamese text retrieval.
 * Pure implementation, no external dependencies.
 * Returns deterministic ranked results with verbatim snippets.
 */

import type { ArticleChunk } from "./chunkArticle";

// BM25 hyperparameters
const K1 = 1.5;
const B = 0.75;

/** Tokenise Vietnamese text: lowercase, remove punctuation, split on whitespace */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/** Build IDF map: log( (N - df + 0.5) / (df + 0.5) + 1 ) */
function buildIdf(chunks: ArticleChunk[]): Map<string, number> {
  const df = new Map<string, number>();
  const N = chunks.length;

  for (const chunk of chunks) {
    const terms = new Set(tokenize(chunk.text));
    for (const t of terms) {
      df.set(t, (df.get(t) ?? 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [term, freq] of df) {
    idf.set(term, Math.log((N - freq + 0.5) / (freq + 0.5) + 1));
  }
  return idf;
}

export interface BM25Result {
  chunkIndex: number;
  chunk: ArticleChunk;
  score: number;
  matchedTerms: string[];
}

/**
 * Score all chunks against a query and return sorted results.
 * @param query - User query string
 * @param chunks - All article chunks to score
 * @param topK - Number of top results to return
 */
export function bm25Search(
  query: string,
  chunks: ArticleChunk[],
  topK = 5
): BM25Result[] {
  if (!query.trim() || chunks.length === 0) return [];

  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) return [];

  const idf = buildIdf(chunks);

  // Average document length
  const avgDL =
    chunks.reduce((acc, c) => acc + tokenize(c.text).length, 0) / chunks.length;

  const results: BM25Result[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const docTokens = tokenize(chunk.text);
    const dl = docTokens.length;

    // Frequency map for this doc
    const freq = new Map<string, number>();
    for (const t of docTokens) {
      freq.set(t, (freq.get(t) ?? 0) + 1);
    }

    let score = 0;
    const matchedTerms: string[] = [];

    for (const term of queryTerms) {
      const tf = freq.get(term) ?? 0;
      if (tf === 0) continue;

      matchedTerms.push(term);
      const idfVal = idf.get(term) ?? 0;
      const numerator = tf * (K1 + 1);
      const denominator = tf + K1 * (1 - B + B * (dl / avgDL));
      score += idfVal * (numerator / denominator);
    }

    if (score > 0) {
      results.push({ chunkIndex: i, chunk, score, matchedTerms });
    }
  }

  // Sort by score descending, deterministic tie-break by chunkIndex
  return results
    .sort((a, b) => b.score - a.score || a.chunkIndex - b.chunkIndex)
    .slice(0, topK);
}
