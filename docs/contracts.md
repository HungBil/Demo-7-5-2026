# Data Contracts — BQP Article Agent

This document defines the canonical data contracts for all phases.
**Do not change these schemas without updating all dependent code.**

---

## ArticleRecord Schema

Stored as JSON at `src/data/articles/{slug}.json`.

```typescript
interface ArticleRecord {
  id: string;           // SHA-256 of sourceUrl, first 16 chars
  slug: string;         // URL-safe slugified title (max 120 chars)
  title: string;        // Original article title — NEVER rewrite
  sourceUrl: string;    // Canonical bqp.vn URL
  markdown: string;     // Full article markdown — NEVER rewrite
  html?: string;        // Raw HTML (optional)
  textContent: string;  // Plaintext for BM25 indexing
  images: ArticleImage[];
  metadata: ArticleMetadata;
}

interface ArticleImage {
  id: string;           // SHA-256 of absoluteSrc, first 16 chars
  src: string;          // Original src as found in HTML
  absoluteSrc: string;  // Resolved absolute URL — REQUIRED
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

interface ArticleMetadata {
  sourceUrl: string;
  canonicalUrl?: string;
  title: string;
  description?: string;
  publishedAt?: string;   // ISO 8601
  crawledAt: string;      // ISO 8601 — when crawled
  category?: string;
  tags?: string[];
  siteName?: string;
}
```

---

## Storage Format

- Location: `src/data/articles/{slug}.json`
- Encoding: UTF-8
- Format: Pretty-printed JSON (2-space indent)
- Naming: `{slug}.json` where slug = slugified title
- Not committed to git (gitignored)

---

## Image Handling Rules

1. All `absoluteSrc` values MUST be valid absolute URLs.
2. Relative URLs are resolved against the article's sourceUrl during crawl.
3. Images are deduplicated by `absoluteSrc`.
4. Tracking pixels (width/height < 20px) are excluded.
5. Only images from `bqp.vn` or `mod.gov.vn` domains are retained.
6. `src` field preserves the original value as found in HTML.

---

## Forbidden Data Mutations

- ❌ Rewrite, paraphrase, or summarize article content
- ❌ Remove or alter `sourceUrl`
- ❌ Change `title` from original
- ❌ Modify `markdown` or `textContent` content
- ❌ Change `absoluteSrc` for any image
- ❌ Remove or modify `crawledAt`

---

## Future: Retrieval Citation Contract (Placeholder)

```typescript
// Phase 2 will define:
interface Citation {
  title: string;
  sourceUrl: string;
  slug: string;
  chunkIndex: number;
  publishedAt?: string;
}

interface SearchResult {
  articleId: string;
  slug: string;
  title: string;
  sourceUrl: string;
  score: number;
  snippet: string;   // Copied from original content, never rewritten
  citation: Citation;
  chunkIndex: number;
  matchedTerms: string[];
}
```

---

## Future: Agent Answer Contract (Placeholder)

```typescript
// Phase 2 will define:
interface ChatResponse {
  answer: string;
  citations: Citation[];
  confidence: 'high' | 'medium' | 'low';
  usedArticleSlugs: string[];
}
```

Agent rules (enforced in Phase 2):
- Never answer from world knowledge
- Never fabricate citations
- Empty retrieval → "không đủ thông tin trong dataset đã crawl"
- Every factual answer must include citation
