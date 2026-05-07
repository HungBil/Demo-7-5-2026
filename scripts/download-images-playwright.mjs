#!/usr/bin/env node
/**
 * download-images-playwright.mjs
 * Uses Playwright to download images with browser-level headers (bypasses bqp.vn auth wall).
 * Saves images to public/images/articles/<slug>/ and updates article JSON with localPath.
 */

import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "src", "data", "articles");
const PUBLIC_IMG_DIR = path.join(ROOT, "public", "images", "articles");

const SKIP_PATTERNS = [
  "logo.jpg",
  "banner600.jpg",
  "icon-search.png",
  "bnqc-",
  "PAKNvbQPPL",
  "TrangcongTP",
  "KVCB-HCBtq",
  "NtBDHVS",
  "contenthandler/dav/themelist",
];

function isUIChrome(url) {
  return SKIP_PATTERNS.some((p) => url.includes(p));
}

function decodeUrl(url) {
  return url.replace(/&amp;/g, "&");
}

function localFilename(url) {
  const decoded = decodeUrl(url);
  try {
    const urlObj = new URL(decoded);
    const segments = urlObj.pathname.split("/").filter(Boolean);
    const rawName = segments[segments.length - 1] || "image";
    const extMatch = rawName.match(/\.(jpg|jpeg|png|gif|webp)/i);
    const ext = extMatch ? extMatch[0].toLowerCase() : ".jpg";
    const hash = crypto.createHash("md5").update(decoded).digest("hex").slice(0, 10);
    const baseName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 40);
    return `${hash}_${baseName}${extMatch ? "" : ext}`;
  } catch {
    const hash = crypto.createHash("md5").update(decoded).digest("hex").slice(0, 10);
    return `${hash}_image.jpg`;
  }
}

async function downloadViaPlaywright(page, rawUrl, destPath) {
  const url = decodeUrl(rawUrl);

  try {
    const response = await page.request.get(url, {
      headers: {
        Referer: "http://bqp.vn/",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      timeout: 20000,
    });

    if (!response.ok()) {
      console.warn(`  ✗ HTTP ${response.status()}: ${url.slice(0, 80)}`);
      return false;
    }

    const contentType = response.headers()["content-type"] || "";
    if (!contentType.includes("image/")) {
      console.warn(`  ✗ Not image (${contentType.slice(0, 40)}): ${url.slice(0, 80)}`);
      return false;
    }

    const buffer = await response.body();
    fs.writeFileSync(destPath, buffer);
    return true;
  } catch (e) {
    console.warn(`  ✗ Error: ${e.message?.slice(0, 80)}`);
    return false;
  }
}

async function processArticle(jsonPath, page) {
  const slug = path.basename(jsonPath, ".json");
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  if (!data.images || data.images.length === 0) {
    return 0;
  }

  const articleImgDir = path.join(PUBLIC_IMG_DIR, slug);
  fs.mkdirSync(articleImgDir, { recursive: true });

  let saved = 0;
  const seenUrls = new Set();

  for (const img of data.images) {
    const rawUrl = img.absoluteSrc || img.src;
    if (!rawUrl) continue;
    if (isUIChrome(rawUrl)) {
      img.isUIChrome = true;
      continue;
    }

    const decodedUrl = decodeUrl(rawUrl);
    if (seenUrls.has(decodedUrl)) continue;
    seenUrls.add(decodedUrl);

    // Already downloaded
    if (img.localPath) {
      const fullPath = path.join(ROOT, "public", img.localPath);
      if (fs.existsSync(fullPath)) {
        console.log(`  ✓ exists: ${img.localPath}`);
        saved++;
        continue;
      }
    }

    const filename = localFilename(rawUrl);
    const destPath = path.join(articleImgDir, filename);
    const publicPath = `/images/articles/${slug}/${filename}`;

    console.log(`  ↓ ${filename}`);
    const ok = await downloadViaPlaywright(page, rawUrl, destPath);
    if (ok) {
      img.localPath = publicPath;
      saved++;
      console.log(`  ✓ ${publicPath}`);
    }
  }

  if (saved > 0) {
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`  💾 Updated JSON (${saved} images)`);
  }

  return saved;
}

async function main() {
  console.log("🚀 BQP Image Downloader (Playwright)\n");
  fs.mkdirSync(PUBLIC_IMG_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  // Warm up session with a real page visit to get cookies
  console.log("🌐 Warming up browser session...");
  await page.goto("http://bqp.vn/", { waitUntil: "domcontentloaded", timeout: 30000 });
  console.log("  Session ready\n");

  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json") && f !== "README.md");

  console.log(`Found ${files.length} article files\n`);

  let total = 0;
  for (const file of files) {
    const slug = path.basename(file, ".json");
    console.log(`📄 ${slug}`);
    const count = await processArticle(path.join(DATA_DIR, file), page);
    total += count;
  }

  await browser.close();
  console.log(`\n✅ Done! Downloaded ${total} images total.`);
  console.log('   Run "npm run dev" to verify locally.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
