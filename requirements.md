You are a senior full-stack AI engineer.

PROJECT CONTEXT

We are building a Demo Day product: a modern web demo with an AI chatbot pop-up for bqp.vn articles.

The product must:

1. Crawl bqp.vn articles accurately.
2. Preserve original article content without rewriting, paraphrasing, or modifying it.
3. Capture and display all article images successfully.
4. Store crawled content as local JSON/Markdown with metadata.
5. Later phases will use this data for search, summarization, and grounded chatbot answers.
6. The final app must deploy on Vercel.

CURRENT PHASE GOAL

Implement the foundation, data contract, and crawler.

Do not implement chatbot, retrieval, Notion MCP, Stitch redesign, or deployment polish in this phase.

GLOBAL RULES

1. Do not rewrite, paraphrase, summarize, or mutate original article content.
2. Preserve article title, source URL, body, published date if available, image URLs, captions, alt text, and metadata.
3. Do not introduce a database. Use local static JSON/Markdown storage for demo reliability.
4. Do not perform unrelated refactors.
5. Do not delete existing files unless clearly obsolete and explain why.
6. Keep the repo runnable after changes.
7. Do not expose secrets to client-side code.
8. Use TypeScript and typed interfaces for cross-phase contracts.
9. If an external API key is missing, fail with a clear server-side error only when that feature is used.
10. Before finishing, run available lint/typecheck/build commands and report results.

TASKS

1. Audit the repo briefly:

   - Detect framework, package manager, scripts, app router/pages router, TypeScript setup.
   - Do not write a long report, but use this information before editing.
2. Create or update the foundation structure:

   - src/types/article.ts
   - src/lib/config/env.ts
   - src/server/crawler/
   - src/server/articles/
   - src/data/articles/
   - scripts/
   - docs/contracts.md
   - .env.example
3. Define the article data contract in src/types/article.ts:

   ArticleImage:

   - id: string
   - src: string
   - absoluteSrc: string
   - alt?: string
   - caption?: string
   - width?: number
   - height?: number

   ArticleMetadata:

   - sourceUrl: string
   - canonicalUrl?: string
   - title: string
   - description?: string
   - publishedAt?: string
   - crawledAt: string
   - category?: string
   - tags?: string[]
   - siteName?: string

   ArticleRecord:

   - id: string
   - slug: string
   - title: string
   - sourceUrl: string
   - markdown: string
   - html?: string
   - textContent: string
   - images: ArticleImage[]
   - metadata: ArticleMetadata
4. Add .env.example:

   - FIRECRAWL_API_KEY=
   - OPENAI_API_KEY=
   - NOTION_MCP_ENABLED=false
   - NEXT_PUBLIC_APP_NAME="BQP Article Agent"
5. Implement server-only env handling:

   - src/lib/config/env.ts
   - Never expose FIRECRAWL_API_KEY or OPENAI_API_KEY to client code.
   - Validate required env only when relevant feature is used.
6. Implement crawler:
   Required files:

   - src/server/crawler/crawlArticle.ts
   - src/server/crawler/imageExtractor.ts
   - src/server/crawler/normalizeArticle.ts
   - src/server/crawler/validateArticle.ts
   - scripts/crawl-bqp.ts

   Required behavior:

   - Accept one or more bqp.vn article URLs from CLI.
   - Use Firecrawl for markdown/text extraction when available.
   - Use Playwright to validate/fill gaps for:
     - page title
     - article body
     - images
     - lazy-loaded images
     - image captions if available
   - Scroll/wait as needed to capture lazy images.
   - Detect img src, data-src, data-original, srcset where possible.
   - Convert relative image URLs to absolute URLs.
   - Deduplicate images.
   - Preserve original content.
   - Store each article as ArticleRecord JSON under src/data/articles/.
   - Use stable id and slug.
   - Add clear validation errors.
7. Implement article loading/validation:
   Required files:

   - src/server/articles/loadArticles.ts
   - src/server/articles/validateDataset.ts
   - scripts/validate-articles.ts

   Required behavior:

   - loadArticles(): Promise<ArticleRecord[]>
   - getArticleBySlug(slug: string): Promise<ArticleRecord | null>
   - getArticleById(id: string): Promise<ArticleRecord | null>
   - listArticleSummaries()
   - Validate:
     - non-empty title
     - valid sourceUrl
     - non-empty markdown or textContent
     - all images have absoluteSrc
     - duplicate slug detection
     - duplicate sourceUrl detection
8. Update docs/contracts.md with:

   - ArticleRecord schema
   - Storage format
   - Image handling rules
   - Forbidden data mutations
   - Future retrieval citation contract placeholder
   - Future agent answer contract placeholder

FORBIDDEN IN THIS PHASE

- Do not implement chatbot.
- Do not implement BM25/retrieval.
- Do not implement LLM calls.
- Do not redesign UI.
- Do not implement Notion MCP.
- Do not add database.
- Do not crawl the entire bqp.vn website.
- Do not mutate original article content.

ACCEPTANCE CRITERIA

1. The repo has a stable ArticleRecord contract.
2. The crawl script can crawl at least one bqp.vn article URL into src/data/articles/.
3. The output JSON includes title, sourceUrl, markdown or textContent, images, and metadata.
4. Image URLs are absolute and deduplicated.
5. Dataset validation script exists and gives clear results.
6. Existing app still builds or any build failure is clearly reported with exact cause.
7. Final response must include:

   - Summary of changes
   - Files changed
   - How to crawl
   - How to validate data
   - Build/lint/typecheck results
   - Known risks

   You are a senior full-stack AI engineer.

   PROJECT CONTEXT

   We are building a Demo Day product: a modern web demo with an AI chatbot pop-up for bqp.vn articles.

   Previous phase already created:

   - ArticleRecord schema
   - Local article JSON storage
   - Firecrawl + Playwright crawler
   - Dataset validation and article loading utilities

   CURRENT PHASE GOAL

   Implement the article browsing UI, BM25 retrieval, and grounded chatbot pop-up.

   GLOBAL RULES

   1. Do not rewrite, paraphrase, or mutate stored article content.
   2. ArticleRecord schema from src/types/article.ts is the source of truth.
   3. Images must remain attached to their source article.
   4. Retrieval must return citations for every result.
   5. Chatbot must answer only from retrieved crawled content.
   6. If no relevant content is found, chatbot must clearly say it cannot find an answer in the crawled dataset.
   7. Do not expose API keys or server-only code to client-side bundle.
   8. Do not introduce a database.
   9. Do not perform unrelated refactors.
   10. Keep the repo runnable after changes.
   11. Before finishing, run available lint/typecheck/build commands and report results.

   TASKS

   1. Build article UI.

      Required pages/components, adjusted to existing router structure:

      - /articles
      - /articles/[slug]
      - src/components/articles/ArticleCard.tsx
      - src/components/articles/ArticleRenderer.tsx
      - src/components/articles/ArticleImageGallery.tsx

      Required behavior:

      - /articles lists all crawled articles.
      - Each card shows title, source URL, published date if available, category if available, and image count.
      - /articles/[slug] renders article detail.
      - Article detail shows title, metadata, original source link, original crawled content, and all images.
      - Clearly label original crawled content.
      - Images render from absolute URLs.
      - If Next.js image domain config becomes a blocker, use normal img tags as safe fallback.
      - Empty/error states must be graceful.
   2. Implement retrieval.

      Required files:

      - src/server/retrieval/types.ts
      - src/server/retrieval/chunkArticle.ts
      - src/server/retrieval/bm25.ts
      - src/server/retrieval/searchArticles.ts
      - scripts/test-retrieval.ts

      Retrieval input:

      - query: string
      - options?: { limit?: number; articleLimit?: number }

      Retrieval output:
      SearchResult[]:

      - articleId
      - slug
      - title
      - sourceUrl
      - score
      - snippet
      - citation
      - chunkIndex
      - matchedTerms

      Citation object:

      - title
      - sourceUrl
      - slug
      - chunkIndex
      - publishedAt?

      Required behavior:

      - Chunk articles into searchable sections.
      - Index title, metadata, markdown/textContent.
      - Implement BM25 or lightweight BM25-compatible scoring.
      - Return deterministic ranked results.
      - Snippets must be copied from original content, not rewritten.
      - Empty query and no-match query must be handled safely.
   3. Implement grounded chatbot.

      Required files:

      - src/server/agent/articleAgent.ts
      - src/app/api/chat/route.ts or equivalent API route for the existing router
      - src/components/chat/ChatWidget.tsx
      - src/components/chat/ChatMessage.tsx

      User-facing capabilities:

      - Find articles by topic or keyword.
      - Summarize a selected or retrieved article.
      - Answer questions using retrieved article content.
      - Provide citations for every factual answer.
      - Give no-data response when no relevant article exists.

      Server behavior:

      - /api/chat receives user message.
      - It calls searchArticles().
      - It uses only retrieved context to answer.
      - If using an LLM, pass only retrieved chunks, not the entire dataset.
      - If OPENAI_API_KEY is missing, return a clear server-side configuration error or fallback to search-result mode.
      - Response format:
        - answer: string
        - citations: Citation[]
        - confidence: "high" | "medium" | "low"
        - usedArticleSlugs: string[]

      Agent system rules:

      - Never answer from general world knowledge.
      - Never fabricate article titles, URLs, dates, citations, or quotes.
      - If retrieval is empty, say there is not enough information in the crawled dataset.
      - Summaries must be labeled as AI-generated summaries and must not replace original article content.
      - Every factual answer must include citation.

      Frontend behavior:

      - Add a fixed bottom-right chatbot pop-up.
      - Collapsible widget.
      - Shows user messages, assistant messages, loading state, and errors.
      - Shows citations as clickable links to article detail page and/or original source URL.
      - Does not block article reading.
   4. Update docs/contracts.md:

      - Retrieval contract
      - Citation contract
      - Agent answer contract
      - No-data behavior

   FORBIDDEN IN THIS PHASE

   - Do not change ArticleRecord schema unless absolutely necessary.
   - Do not change crawler logic.
   - Do not mutate crawled article files.
   - Do not implement Notion MCP.
   - Do not perform full UI redesign with Stitch yet.
   - Do not add database or vector DB.
   - Do not remove source URLs.
   - Do not hide citations.

   ACCEPTANCE CRITERIA

   1. /articles lists crawled articles.
   2. /articles/[slug] renders article text and images.
   3. Retrieval script can return ranked results with citations.
   4. Chatbot pop-up works.
   5. Chatbot can search, summarize, and answer using crawled content.
   6. Chatbot refuses/no-answers safely when retrieval has no relevant content.
   7. Every factual chatbot answer includes citations.
   8. Existing build passes or failure is reported with exact cause.
   9. Final response must include:

      - Summary of changes
      - Files changed
      - How to run article UI
      - How to test retrieval
      - How to test chatbot
      - Build/lint/typecheck results
      - Known risks

      You are a senior full-stack AI engineer.

      PROJECT CONTEXT

      We are building a Demo Day product: a modern web demo with an AI chatbot pop-up for bqp.vn articles.

      Previous phases already created:

      - ArticleRecord schema
      - Firecrawl + Playwright crawler
      - Local article dataset
      - Article pages
      - BM25 retrieval
      - Grounded chatbot pop-up

      CURRENT PHASE GOAL

      Harden the demo:

      1. Add guardrails and evaluation.
      2. Add Notion MCP requirement reader as developer/ops utility.
      3. Polish UI using Stitch MCP guidance if available.
      4. Prepare for Vercel deployment.

      GLOBAL RULES

      1. Do not mutate original article content.
      2. Do not change ArticleRecord schema.
      3. Do not change crawler output format.
      4. Do not remove citations.
      5. Do not weaken grounded-answer behavior.
      6. Do not expose secrets to client-side code.
      7. Do not make Notion MCP required for normal user chatbot usage.
      8. Do not add new product features beyond this phase.
      9. Keep the repo runnable after changes.
      10. Before finishing, run available lint/typecheck/build commands and report results.

      TASK 1 — Guardrails

      Required files:

      - src/server/guardrails/inputGuardrails.ts
      - src/server/guardrails/outputGuardrails.ts
      - src/server/evaluation/evaluateAgent.ts
      - scripts/eval-agent.ts

      Input guardrails must detect and safely refuse:

      - "ignore previous instructions"
      - "reveal system prompt"
      - "bypass guardrails"
      - prompt injection attempts
      - requests to answer without sources
      - requests to modify original article content
      - requests to fabricate sources

      Output guardrails must validate:

      - Factual answers include citations.
      - If citations are absent, answer must be a no-data/refusal/configuration response.
      - Citation URLs must come from retrieved ArticleRecord.sourceUrl.
      - Article titles in citations must match retrieved records.
      - No claim of finding data if retrieval was empty.

      Evaluation script must test:

      1. Normal article search.
      2. Summary request.
      3. No-result query.
      4. Prompt injection attempt.
      5. Unsupported external knowledge request.
      6. Request to alter source article content.

      Integrate guardrails into /api/chat.

      TASK 2 — Notion MCP requirement reader

      Required files:

      - src/server/notion/readPmRequirements.ts
      - docs/pm-requirements-summary.md

      Required behavior:

      - Add a server-side developer/ops utility for reading PM requirements from Notion MCP if configured.
      - Normalize requirements into:
        - feature requirements
        - technical requirements
        - acceptance criteria
        - risks
        - owner/task mapping if available
      - Handle MCP unavailable state gracefully.
      - The normal app and chatbot must work even if Notion MCP is unavailable.
      - Do not modify Notion pages.

      TASK 3 — UI polish with Stitch MCP guidance

      Polish:

      - Home page
      - /articles page
      - /articles/[slug] page
      - ChatWidget
      - Article cards
      - Empty/error/loading states
      - Citation display

      Design requirements:

      - Modern, clean, showcase-ready.
      - Responsive.
      - Good article readability.
      - Clear source/citation presentation.
      - Chatbot integrated but not intrusive.
      - Demo narrative should be clear:
        "Crawl → Search → Summarize → Cite"

      Hard UI constraints:

      - Do not hide source URLs.
      - Do not hide citations.
      - Do not break image rendering.
      - Do not change retrieval or agent behavior for visual reasons.

      TASK 4 — Vercel deployment hardening

      Required files:

      - docs/deployment.md
      - scripts/smoke-test.ts if feasible, otherwise a clear smoke checklist in docs/deployment.md

      Deployment requirements:

      - Production build passes.
      - Server-only code must not leak into client bundle.
      - Static article data can be read in Vercel environment.
      - Chatbot API route works under production assumptions.
      - Image rendering works with external bqp.vn image URLs or safe img fallback.
      - Runtime crawling must not be required for app startup.
      - No secrets are committed.

      docs/deployment.md must include:

      - Required env vars
      - Local run steps
      - Crawl step
      - Validate step
      - Retrieval test step
      - Chatbot test step
      - Build step
      - Vercel deploy steps
      - Smoke test checklist

      Smoke test checklist:

      - /articles loads
      - article detail loads
      - images render
      - chatbot opens
      - chatbot search works
      - chatbot no-result behavior works
      - citations visible
      - prompt injection is refused

      FORBIDDEN IN THIS PHASE

      - Do not change ArticleRecord schema.
      - Do not rewrite crawler.
      - Do not change data storage approach.
      - Do not remove guardrails.
      - Do not disable citations.
      - Do not make runtime crawling mandatory.
      - Do not make Notion MCP mandatory for normal demo usage.
      - Do not add database.
      - Do not add vector DB.
      - Do not implement unrelated features.

      ACCEPTANCE CRITERIA

      1. Guardrails block obvious prompt injection and no-source requests.
      2. Agent still answers valid article queries.
      3. No-result behavior remains safe.
      4. Notion MCP utility exists and fails gracefully when unavailable.
      5. UI is visibly more polished and demo-ready.
      6. Production build passes or exact failure cause is documented.
      7. docs/deployment.md exists and is complete.
      8. Final response must include:
         - Summary of changes
         - Files changed
         - Guardrail/eval results
         - Notion MCP status
         - UI changes
         - Deployment instructions
         - Build/lint/typecheck results
         - Remaining risks
