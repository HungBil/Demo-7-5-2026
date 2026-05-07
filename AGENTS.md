# Local Agent Instructions

This repository keeps a local agent toolbox under `.local-ai/claude`. The toolbox is for local coding assistants only and must not be committed or deployed.

## Local Skills

Before planning or implementing work in this repo, inspect relevant local skills from:

```text
.local-ai/claude/skills
```

If your tool does not automatically discover repo-local skills, open the relevant `SKILL.md` files manually and follow their instructions.

For this project, prioritize these skill groups when they exist:

- `plan`
- `cook`
- `frontend-design`
- `frontend-development`
- `web-frameworks`
- `web-testing`
- `backend-development`
- `deploy`
- `qa-full`
- `code-review`
- `ck-scenario`
- `ck-security`
- `use-mcp`

## Project Goal

Build a Vercel-ready clone of `https://bqp.vn/` for school work (Demo Day 7/5/2026):

- Crawl the homepage, article pages, article content, metadata, and visual layout references from `https://bqp.vn/`.
- **CRITICAL**: Use exact original text and original images (downloaded locally). No AI summaries for primary content.
- Recreate the public-facing interface and content closely enough for the assignment.
- Add a RAG chatbot that answers only from the crawled site knowledge.
- Integrated Inline Chat Widget in article pages.
- Automatic deployment to Vercel with environment variable configuration.

## Commit Strategy

Keep work split into multiple small commits in a single PR:

- scaffold and project config
- crawler and data model
- cloned homepage and article UI
- RAG indexing and retrieval
- chatbot API and UI
- tests, deployment docs, and polish

## Safety Rules

- Do not commit `.local-ai/`, `.claude/`, `.env`, or `.env.local`.
- Do not push crawled caches or generated local-only agent files.
- Keep runtime app code separate from local agent tooling.
