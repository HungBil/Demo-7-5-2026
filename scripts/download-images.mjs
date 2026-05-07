#!/usr/bin/env node
/**
 * download-images.mjs
 * Downloads all article images from bqp.vn to public/images/articles/
 * Updates each article JSON to store localPath alongside absoluteSrc.
 *
 * AGENTS.md requirement: "Use exact original images (downloaded locally)"
 */

import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "src", "data", "articles");
const PUBLIC_IMG_DIR = path.join(ROOT, "public", "images", "articles");

// Skip these patterns — not article content
const SKIP_PATTERNS = [
  "logo.jpg",
  "banner600.jpg",
  "icon-search.png",
  "bnqc-",
  "PAKNvbQPPL",
  "TrangcongTP",
  "KVCB-HCBtq",
  "NtBDHVS",
];

function isUIChrome(url) {
  return SKIP_PATTERNS.some((p) => url.includes(p));
}

/** Decode HTML entities in URL (&amp; → &) */
function decodeUrl(url) {
  return url.replace(/&amp;/g, "&");
}

/** Derive a stable local filename from the URL */
function localFilename(url) {
  const decoded = decodeUrl(url);
  // Try to extract a meaningful filename from the path
  const urlObj = new URL(decoded);
  const segments = urlObj.pathname.split("/").filter(Boolean);
  const rawName = segments[segments.length - 1] || "image";
  // Remove query string from name, keep extension
  const extMatch = rawName.match(/\.(jpg|jpeg|png|gif|webp)/i);
  const ext = extMatch ? extMatch[0].toLowerCase() : ".jpg";
  // Use hash of full URL for uniqueness
  const hash = crypto.createHash("md5").update(decoded).digest("hex").slice(0, 10);
  const baseName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 40);
  return `${hash}_${baseName}${extMatch ? "" : ext}`;
}

/** Download a URL to destPath. Returns true on success. */
function downloadFile(rawUrl, destPath) {
  return new Promise((resolve) => {
    const url = decodeUrl(rawUrl);
    const protocol = url.startsWith("https") ? https : http;

    const req = protocol.get(
      url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: "http://bqp.vn/",
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        },
        timeout: 15000,
      },
      (res) => {
        // Follow redirects (max 3)
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          downloadFile(res.headers.location, destPath).then(resolve);
          return;
        }
        if (res.statusCode !== 200) {
          console.warn(`  ✗ HTTP ${res.statusCode}: ${url.slice(0, 80)}`);
          resolve(false);
          return;
        }
        const contentType = res.headers["content-type"] || "";
        if (!contentType.startsWith("image/")) {
          console.warn(`  ✗ Not an image (${contentType}): ${url.slice(0, 80)}`);
          resolve(false);
          return;
        }
        const file = fs.createWriteStream(destPath);
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve(true);
        });
        file.on("error", (err) => {
          fs.unlink(destPath, () => {});
          console.warn(`  ✗ Write error: ${err.message}`);
          resolve(false);
        });
      }
    );
    req.on("error", (err) => {
      console.warn(`  ✗ Request error: ${err.message} for ${url.slice(0, 80)}`);
      resolve(false);
    });
    req.on("timeout", () => {
      req.destroy();
      console.warn(`  ✗ Timeout: ${url.slice(0, 80)}`);
      resolve(false);
    });
  });
}

async function processArticle(jsonPath) {
  const slug = path.basename(jsonPath, ".json");
  console.log(`\n📄 ${slug}`);

  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  if (!data.images || data.images.length === 0) {
    console.log("  (no images)");
    return;
  }

  // Create per-article subdirectory
  const articleImgDir = path.join(PUBLIC_IMG_DIR, slug);
  fs.mkdirSync(articleImgDir, { recursive: true });

  let changed = false;
  const seenUrls = new Set();

  for (const img of data.images) {
    const rawUrl = img.absoluteSrc || img.src;
    if (!rawUrl) continue;

    // Skip UI chrome images
    if (isUIChrome(rawUrl)) {
      img.isUIChrome = true;
      continue;
    }

    // Deduplicate
    const decodedUrl = decodeUrl(rawUrl);
    if (seenUrls.has(decodedUrl)) {
      img.localPath = data.images.find(
        (i) => decodeUrl(i.absoluteSrc) === decodedUrl && i.localPath
      )?.localPath;
      continue;
    }
    seenUrls.add(decodedUrl);

    // Already downloaded?
    if (img.localPath) {
      const fullPath = path.join(ROOT, "public", img.localPath);
      if (fs.existsSync(fullPath)) {
        console.log(`  ✓ already: ${img.localPath}`);
        continue;
      }
    }

    const filename = localFilename(rawUrl);
    const destPath = path.join(articleImgDir, filename);
    const publicPath = `/images/articles/${slug}/${filename}`;

    console.log(`  ↓ ${filename}`);
    const ok = await downloadFile(rawUrl, destPath);

    if (ok) {
      img.localPath = publicPath;
      changed = true;
      console.log(`  ✓ saved: ${publicPath}`);
    } else {
      // Keep original absoluteSrc as fallback
      img.localPath = null;
    }
  }

  if (changed) {
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`  💾 JSON updated`);
  }
}

async function main() {
  console.log("🚀 BQP Image Downloader\n");
  fs.mkdirSync(PUBLIC_IMG_DIR, { recursive: true });

  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json") && f !== "README.md");
  console.log(`Found ${files.length} article files`);

  for (const file of files) {
    await processArticle(path.join(DATA_DIR, file));
  }

  console.log("\n✅ Done! Run `npm run build` to verify.");
}

main().catch(console.error);
