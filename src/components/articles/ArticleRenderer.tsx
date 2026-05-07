"use client";

import type { ArticleRecord } from "@/types/article";
import { proxiedImageUrl, contentImages } from "@/lib/imageProxy";

interface Props {
  article: ArticleRecord;
}

/**
 * Extract only the article body HTML from bqp.vn's full page HTML.
 * bqp.vn wraps content inside `.contentDetail` div.
 */
function extractArticleHtml(rawHtml: string): string {
  // Simple regex-based extraction (no DOM available in Node SSG)
  const match = rawHtml.match(
    /<div[^>]+class="[^"]*contentDetail[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]+class="[^"]*file-list/
  );
  if (match) return match[1];

  // Fallback: look for the title followed by content
  const fallback = rawHtml.match(
    /<div[^>]+class="[^"]*contentDetail[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<p[^>]+class="author|<div[^>]+class="baicungchuyenmuc)/
  );
  if (fallback) return fallback[1];

  return ""; // Could not extract
}

/** Replace bqp.vn image srcs inside HTML with proxied URLs */
function proxyImagesInHtml(html: string): string {
  return html.replace(
    /src="(http:\/\/bqp\.vn\/[^"]+)"/g,
    (_, url) => `src="${proxiedImageUrl(url)}"`
  );
}

export function ArticleRenderer({ article }: Props) {
  // Filter to content images only (no logos, banners, nav icons)
  const articleImages = contentImages(article.images ?? []);
  const heroImage = articleImages[0];
  const galleryImages = articleImages.slice(1);

  // Extract clean article body from raw HTML
  const rawHtml = article.html ?? "";
  const bodyHtml = extractArticleHtml(rawHtml);
  const hasCleanHtml = bodyHtml.trim().length > 100;
  const proxiedBodyHtml = hasCleanHtml ? proxyImagesInHtml(bodyHtml) : "";

  // Fallback: render textContent paragraphs
  const hasText =
    !!article.textContent && article.textContent.trim().length > 50;

  return (
    <div className="article-body">
      {/* Hero image */}
      {heroImage && (
        <figure style={{ margin: "0 0 24px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proxiedImageUrl(heroImage.absoluteSrc)}
            alt={heroImage.alt ?? article.title}
            className="article-hero-img"
            onError={(e) => {
              // Hide broken image gracefully
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

      {/* Article body */}
      {hasCleanHtml ? (
        <div
          className="article-content-html"
          dangerouslySetInnerHTML={{ __html: proxiedBodyHtml }}
          style={{ lineHeight: 1.85 }}
        />
      ) : hasText ? (
        <div style={{ lineHeight: 1.85 }}>
          {article.textContent
            .split("\n\n")
            .filter((para) => para.trim().length > 20)
            .slice(0, 60) // safety cap
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

      {/* Additional images gallery — only if we have >1 content image */}
      {galleryImages.length > 0 && (
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
                  src={proxiedImageUrl(img.absoluteSrc)}
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
