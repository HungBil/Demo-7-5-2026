"use client";

import type { ArticleRecord } from "@/types/article";
import { bestImageUrl, contentImages, buildImageUrlMap } from "@/lib/imageProxy";

interface Props {
  article: ArticleRecord;
}

/**
 * Extract only the article body HTML from bqp.vn's full page HTML.
 * bqp.vn wraps content inside `.contentDetail` div.
 */
function extractArticleHtml(rawHtml: string): string {
  // Primary: match contentDetail block up to file-list or author
  const match = rawHtml.match(
    /<div[^>]+class="[^"]*contentDetail[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]+class="[^"]*file-list/
  );
  if (match) return match[1];

  // Fallback: content block followed by author paragraph
  const fallback = rawHtml.match(
    /<div[^>]+class="[^"]*contentDetail[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<p[^>]+class="author|<div[^>]+class="baicungchuyenmuc)/
  );
  if (fallback) return fallback[1];

  return ""; // Could not extract
}

/**
 * Replace ALL bqp.vn image src attributes in HTML with local or proxied URLs.
 * Uses a prebuilt map from the article's images array for accuracy.
 */
function replaceImageSrcsInHtml(html: string, urlMap: Map<string, string>): string {
  // Replace src="..." where the URL is from bqp.vn
  return html.replace(
    /src="(https?:\/\/bqp\.vn\/[^"]+)"/g,
    (_, url) => {
      // Decode &amp; in the HTML attribute value
      const decoded = url.replace(/&amp;/g, "&");
      const localUrl = urlMap.get(decoded) || urlMap.get(url);
      if (localUrl) {
        return `src="${localUrl}"`;
      }
      // Fallback: use proxy for any bqp.vn URL not in our map
      return `src="/api/image-proxy?url=${encodeURIComponent(decoded)}"`;
    }
  );
}

export function ArticleRenderer({ article }: Props) {
  // Filter to article content images only (wcm/connect URLs, no UI chrome)
  const articleImages = contentImages(article.images ?? []);
  const heroImage = articleImages[0];
  const galleryImages = articleImages.slice(1);

  // Build URL→localPath map for efficient HTML body replacement
  const urlMap = buildImageUrlMap(article.images ?? []);

  // Extract clean article body from raw HTML
  const rawHtml = article.html ?? "";
  const bodyHtml = extractArticleHtml(rawHtml);
  const hasCleanHtml = bodyHtml.trim().length > 100;
  // Replace all bqp.vn image srcs with local paths
  const localBodyHtml = hasCleanHtml ? replaceImageSrcsInHtml(bodyHtml, urlMap) : "";

  // Fallback: render textContent paragraphs
  const hasText =
    !!article.textContent && article.textContent.trim().length > 50;

  return (
    <div className="article-body">
      {/* Hero image — only shown if HTML body didn't already contain it */}
      {heroImage && !hasCleanHtml && (
        <figure style={{ margin: "0 0 24px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bestImageUrl(heroImage)}
            alt={heroImage.alt ?? article.title}
            className="article-hero-img"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          {heroImage.caption && (
            <figcaption className="article-hero-caption">
              {heroImage.caption}
            </figcaption>
          )}
        </figure>
      )}

      {/* Article body — HTML with local images injected */}
      {hasCleanHtml ? (
        <div
          className="article-content-html"
          dangerouslySetInnerHTML={{ __html: localBodyHtml }}
          style={{ lineHeight: 1.85 }}
        />
      ) : hasText ? (
        <div style={{ lineHeight: 1.85 }}>
          {article.textContent
            .split("\n\n")
            .filter((para) => para.trim().length > 20)
            .slice(0, 60)
            .map((para, i) => (
              <p key={i} style={{ marginBottom: "1em" }}>
                {para.trim()}
              </p>
            ))}
        </div>
      ) : (
        <p style={{ color: "var(--color-text-light)", fontStyle: "italic" }}>
          Nội dung bài viết không có sẵn. Vui lòng xem bài gốc tại{" "}
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--color-primary)" }}
          >
            bqp.vn
          </a>
          .
        </p>
      )}

      {/* Gallery — only for articles without clean HTML (text-only fallback) */}
      {!hasCleanHtml && galleryImages.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <div
            style={{
              fontSize: "var(--fs-xs)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--color-text-light)",
              borderTop: "2px solid var(--color-primary)",
              paddingTop: 10,
              marginBottom: 16,
            }}
          >
            Hình ảnh bài viết ({galleryImages.length} ảnh)
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {galleryImages.map((img) => (
              <figure key={img.id} style={{ margin: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bestImageUrl(img)}
                  alt={img.alt ?? ""}
                  loading="lazy"
                  style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover" }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
                {img.caption && (
                  <figcaption
                    style={{
                      fontSize: "var(--fs-xs)",
                      color: "var(--color-text-light)",
                      fontStyle: "italic",
                      marginTop: 4,
                      lineHeight: 1.4,
                    }}
                  >
                    {img.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
