#!/usr/bin/env node
/**
 * download-images-fetch.mjs
 * Uses Node.js native fetch (v18+) to download images.
 * bqp.vn requires: HTTPS + session cookie + proper headers
 * Cookie extracted from Playwright MCP session.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "src", "data", "articles");
const PUBLIC_IMG_DIR = path.join(ROOT, "public", "images", "articles");

// Session cookie from Playwright browser session on bqp.vn
const SESSION_COOKIE = process.env.BQP_COOKIE || "D1N=ad2ab03b17147579f641250af0b399f6";

const SKIP_PATTERNS = [
  "contenthandler/dav/themelist",
  "bnqc-",
  "PAKNvbQPPL",
  "TrangcongTP",
  "KVCB-HCBtq",
  "NtBDHVS",
];

function isUIChrome(url) {
  return SKIP_PATTERNS.some((p) => url.includes(p));
}

/** Decode HTML entities and ensure HTTPS */
function normalizeUrl(url) {
  let u = url.replace(/&amp;/g, "&");
  u = u.replace(/^http:\/\/bqp\.vn/, "https://bqp.vn");
  return u;
}

function localFilename(url) {
  try {
    const urlObj = new URL(url);
    const segments = urlObj.pathname.split("/").filter(Boolean);
    const rawName = segments[segments.length - 1] || "image";
    const extMatch = rawName.match(/\.(jpg|jpeg|png|gif|webp)/i);
    const hash = crypto.createHash("md5").update(url).digest("hex").slice(0, 10);
    const baseName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 40);
    return `${hash}_${baseName}${extMatch ? "" : ".jpg"}`;
  } catch {
    const hash = crypto.createHash("md5").update(url).digest("hex").slice(0, 10);
    return `${hash}_image.jpg`;
  }
}

async function downloadFile(rawUrl, destPath) {
  const url = normalizeUrl(rawUrl);

  const HEADERS = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Referer: "https://bqp.vn/",
    Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
    "Cache-Control": "no-cache",
    Cookie: SESSION_COOKIE,
  };

  try {
    const res = await fetch(url, {
      headers: HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      console.warn(`  ✗ HTTP ${res.status}: ${url.slice(0, 80)}`);
      return false;
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("image/")) {
      console.warn(`  ✗ Not image (${contentType.slice(0, 40)}): ${url.slice(0, 80)}`);
      return false;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 100) {
      console.warn(`  ✗ Too small (${buffer.length} bytes): ${url.slice(0, 80)}`);
      return false;
    }

    fs.writeFileSync(destPath, buffer);
    return true;
  } catch (e) {
    console.warn(`  ✗ ${e.message?.slice(0, 100)}`);
    return false;
  }
}

async function processArticle(jsonPath) {
  const slug = path.basename(jsonPath, ".json");
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  if (!data.images || data.images.length === 0) return 0;

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

    const normalized = normalizeUrl(rawUrl);
    if (seenUrls.has(normalized)) continue;
    seenUrls.add(normalized);

    // Already downloaded
    if (img.localPath) {
      const fullPath = path.join(ROOT, "public", img.localPath);
      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        if (stat.size > 100) {
          console.log(`  ✓ exists: ${img.localPath}`);
          saved++;
          continue;
        }
      }
    }

    const filename = localFilename(normalized);
    const destPath = path.join(articleImgDir, filename);
    const publicPath = `/images/articles/${slug}/${filename}`;

    process.stdout.write(`  ↓ ${filename} ... `);
    const ok = await downloadFile(rawUrl, destPath);

    if (ok) {
      const stat = fs.statSync(destPath);
      console.log(`✓ (${(stat.size / 1024).toFixed(1)}KB)`);
      img.localPath = publicPath;
      saved++;
    }
  }

  // Always write JSON to persist isUIChrome flags even if no images downloaded
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf-8");
  if (saved > 0) {
    console.log(`  💾 JSON updated (${saved} images)`);
  } else {
    console.log(`  💾 JSON updated (isUIChrome flags only)`);
  }

  return saved;
}

async function main() {
  console.log("🚀 BQP Image Downloader (fetch + HTTPS)\n");
  fs.mkdirSync(PUBLIC_IMG_DIR, { recursive: true });

  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json") && f !== "README.md");
  console.log(`Found ${files.length} article files\n`);

  let total = 0;
  for (const file of files) {
    const slug = path.basename(file, ".json");
    console.log(`📄 ${slug}`);
    const count = await processArticle(path.join(DATA_DIR, file));
    total += count;
    console.log();
  }

  console.log(`✅ Done! ${total} images saved to public/images/articles/`);
  if (total === 0) {
    console.log("\n⚠️  Zero images downloaded. bqp.vn may require a session cookie.");
    console.log("   Try running: node scripts/download-images-cookie.mjs");
  }
}

main().catch(console.error);
