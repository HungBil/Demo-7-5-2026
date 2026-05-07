#!/usr/bin/env node
/**
 * crawl-bqp.ts — CLI script to crawl bqp.vn article URLs.
 *
 * Usage:
 *   npx tsx scripts/crawl-bqp.ts <url1> [url2] [url3] ...
 *   npx tsx scripts/crawl-bqp.ts --homepage   # crawl top articles from homepage
 *
 * Output: src/data/articles/{slug}.json
 *
 * CRITICAL: Content is preserved as-is. Never rewritten.
 */

// Load .env.local FIRST — required when running outside Next.js runtime
import * as fs from 'fs';
import * as path from 'path';

const envFile = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
  console.log('[crawl-bqp] Loaded .env.local');
}


// Homepage article URLs extracted from https://bqp.vn/ (scraped 2026-05-07)
const HOMEPAGE_ARTICLE_URLS = [
  'http://bqp.vn/vn/chi-tiet/sa-ttsk/sa-tt-qpan/dai-tuong-nguyen-tan-cuong-tiep-xuc-cu-tri-tinh-dong-thap',
  'http://bqp.vn/vn/chi-tiet/sa-ttsk/sa-tt-dnqp/thuc-day-hop-tac-trong-linh-vuc-phap-luat-quan-su-quoc-phong-giua-viet-nam-cam-pu-chia',
  'http://bqp.vn/vn/chi-tiet/sa-ttsk/sa-tt-dnqp/viet-nam-va-tho-nhi-ky-tang-cuong-hop-tac-quoc-phong-thiet-thuc-hieu-qua',
  'http://bqp.vn/vn/chi-tiet/sa-ttsk/sa-tt-qpan/bo-quoc-phong-cong-bo-thong-tin-du-an-nha-o-cho-gia-dinh-luc-luong-vu-trang-trong-quan-doi-tai-phuong-dong-son-tinh-thanh-hoa',
  'http://bqp.vn/vn/chi-tiet/sa-ttsk/sa-tt-qpan/phat-huy-truyen-thong-anh-hung-xay-dung-quan-chung-hai-quan-cach-mang-chinh-quy-tinh-nhue-hien-dai',
  'http://bqp.vn/vn/chi-tiet/sa-ttsk/sa-tt-dnqp/thuong-tuong-nguyen-truong-thang-tham-du-trien-lam-quoc-phong-va-hang-khong-vu-tru-2026-tai-tho-nhi-ky',
  'http://bqp.vn/vn/chi-tiet/sa-ttsk/sa-tt-qpan/van-ban-hop-nhat-ve-le-tang-quan-nhan-cong-nhan-vien-chuc-quoc-phong-nguoi-lam-co-yeu-do-bo-quoc-phong-quan-ly',
  'http://bqp.vn/vn/chi-tiet/sa-ttsk/sa-tt-qpan/nghi-quyet-cat-giam-phan-cap-don-gian-hoa-thu-tuc-hanh-chinh-dieu-kien-kinh-doanh-linh-vuc-quoc-phong-noi-vu-tai-chinh-xay-dung-ngoai-giao-tu-phap-ngan-hang',
  'http://bqp.vn/vn/chi-tiet/sa-ttsk/sa-tt-qpan/dai-tuong-phan-van-giang-gui-thu-chuc-mung-80-nam-ngay-truyen-thong-van-phong-tong-cuc-chinh-tri',
  'http://bqp.vn/vn/chi-tiet/sa-ttsk/sa-tt-dnqp/tau-ins-sagardhwani-cua-hai-quan-an-do-tham-khanh-hoa',
];

async function main() {
  // Dynamic import to allow module resolution after chdir
  const { crawlArticle } = await import('../src/server/crawler/crawlArticle');
  const { saveArticle } = await import('../src/server/articles/loadArticles');

  const args = process.argv.slice(2);
  let urls: string[] = [];

  if (args.includes('--homepage') || args.length === 0) {
    urls = HOMEPAGE_ARTICLE_URLS;
    console.log(`[crawl-bqp] Crawling ${urls.length} homepage articles from bqp.vn`);
  } else {
    urls = args.filter((a) => !a.startsWith('--'));
    console.log(`[crawl-bqp] Crawling ${urls.length} URL(s)`);
  }

  let success = 0;
  let failed = 0;

  for (const url of urls) {
    console.log(`\n─── ${url}`);
    try {
      const { record, warnings, usedPlaywrightFallback } = await crawlArticle(url, {
        verbose: true,
        usePlaywrightFallback: true,
      });

      saveArticle(record);

      console.log(`✅ Saved: ${record.slug}`);
      console.log(`   Title: ${record.title}`);
      console.log(`   Images: ${record.images.length}`);
      console.log(`   Content length: ${record.markdown.length} chars`);
      if (usedPlaywrightFallback) console.log('   [used Playwright fallback]');
      if (warnings.length > 0) {
        warnings.forEach((w) => console.warn(`   ⚠️  ${w}`));
      }
      success++;
    } catch (err) {
      console.error(`❌ Failed: ${url}`);
      console.error(`   ${err}`);
      failed++;
    }

    // Rate limiting: wait 1s between requests
    if (urls.indexOf(url) < urls.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log(`\n═══ Summary: ${success} succeeded, ${failed} failed ═══`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[crawl-bqp] Fatal error:', err);
  process.exit(1);
});
