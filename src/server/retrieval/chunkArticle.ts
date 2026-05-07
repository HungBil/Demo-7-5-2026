/**
 * chunkArticle.ts — Splits an ArticleRecord into searchable text chunks.
 * Chunks preserve original content verbatim; never paraphrased or rewritten.
 */

import type { ArticleRecord } from "@/types/article";

export interface ArticleChunk {
  articleId: string;
  slug: string;
  title: string;
  sourceUrl: string;
  publishedAt?: string;
  chunkIndex: number;
  text: string; // verbatim excerpt from original content
}

const CHUNK_SIZE = 400;   // characters per chunk
const CHUNK_OVERLAP = 80; // overlap between chunks

/**
 * Split article into overlapping text chunks for BM25 indexing.
 * Uses markdown/textContent — never modifies the originals.
 */
export function chunkArticle(article: ArticleRecord): ArticleChunk[] {
  // Use textContent for chunking (cleaner than markdown for search)
  const body = article.textContent || article.markdown || "";

  // Combine title + body for richer context
  const fullText = `${article.title}\n\n${body}`.trim();

  if (fullText.length < 10) return [];

  // Split by sentences / double-newlines first for natural chunks
  const paragraphs = fullText
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 10);

  const chunks: ArticleChunk[] = [];
  let chunkIndex = 0;
  let buffer = "";

  for (const para of paragraphs) {
    if (buffer.length + para.length > CHUNK_SIZE && buffer.length > 0) {
      chunks.push({
        articleId: article.id,
        slug: article.slug,
        title: article.title,
        sourceUrl: article.sourceUrl,
        publishedAt: article.metadata.publishedAt,
        chunkIndex,
        text: buffer.trim(),
      });
      chunkIndex++;
      // overlap: keep last CHUNK_OVERLAP chars
      buffer = buffer.slice(-CHUNK_OVERLAP) + " " + para;
    } else {
      buffer = buffer ? buffer + "\n" + para : para;
    }
  }

  // Last remaining chunk
  if (buffer.trim().length > 10) {
    chunks.push({
      articleId: article.id,
      slug: article.slug,
      title: article.title,
      sourceUrl: article.sourceUrl,
      publishedAt: article.metadata.publishedAt,
      chunkIndex,
      text: buffer.trim(),
    });
  }

  return chunks.length > 0 ? chunks : [
    {
      articleId: article.id,
      slug: article.slug,
      title: article.title,
      sourceUrl: article.sourceUrl,
      publishedAt: article.metadata.publishedAt,
      chunkIndex: 0,
      text: fullText.slice(0, CHUNK_SIZE),
    },
  ];
}
