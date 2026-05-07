# Article Data Storage

This directory contains crawled bqp.vn articles as JSON files.
Each file is named `{slug}.json` and contains an `ArticleRecord`.

## Structure
- Each `.json` file = one `ArticleRecord` (see `src/types/article.ts`)
- Files are gitignored by default (see `.gitignore`)
- Run `npx tsx scripts/crawl-bqp.ts --homepage` to populate

## Rules
- DO NOT manually edit these files
- DO NOT rewrite or paraphrase content
- DO NOT commit these files to git
