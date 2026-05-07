/**
 * test-retrieval.ts — CLI script to test BM25 search.
 * Usage: npx tsx --tsconfig tsconfig.scripts.json scripts/test-retrieval.ts "từ khóa tìm kiếm"
 */
import path from "path";
import fs from "fs";

// Manual .env.local loading (same as crawl-bqp.ts)
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
}

// Import after env is set
const { searchArticles } = await import("../src/server/retrieval/searchArticles.js");

const query = process.argv.slice(2).join(" ") || "quốc phòng";
console.log(`\n🔍 Tìm kiếm: "${query}"\n${"─".repeat(60)}`);

const results = await searchArticles(query, { limit: 5 });

if (results.length === 0) {
  console.log("❌ Không tìm thấy kết quả nào.");
} else {
  console.log(`✅ Tìm thấy ${results.length} kết quả:\n`);
  for (const r of results) {
    console.log(`[Score: ${r.score}] ${r.title}`);
    console.log(`   Slug: ${r.slug}`);
    console.log(`   Terms: ${r.matchedTerms.join(", ")}`);
    console.log(`   Snippet: ${r.snippet.slice(0, 120)}…`);
    console.log();
  }
}
