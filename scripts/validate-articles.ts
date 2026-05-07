#!/usr/bin/env node
/**
 * validate-articles.ts — CLI to validate the article dataset.
 *
 * Usage:
 *   npx tsx scripts/validate-articles.ts
 */

import path from 'path';
process.chdir(path.resolve(__dirname, '..'));

async function main() {
  const { runDatasetValidation } = await import('../src/server/articles/validateDataset');
  const ok = await runDatasetValidation();
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error('[validate-articles] Fatal error:', err);
  process.exit(1);
});
