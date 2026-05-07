import Link from "next/link";
import { bestImageUrl } from "@/lib/imageProxy";
import type { ArticleRecord } from "@/types/article";

interface ArticleCardProps {
  article: {
    id: string;
    slug: string;
    title: string;
    sourceUrl: string;
    metadata: {
      publishedAt?: string;
      category?: string;
      description?: string;
    };
    images: Array<{ absoluteSrc: string; src?: string; alt?: string; localPath?: string | null; isUIChrome?: boolean }>;
    imageCount?: number;
  };
  variant?: "grid" | "row" | "featured" | "sidebar";
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function ArticleCard({ article, variant = "grid" }: ArticleCardProps) {
  const href = `/articles/${article.slug}`;
  // Skip UI chrome assets (logos, banners) — pick first real article photo
  const heroImg = article.images?.find((img) => !img.isUIChrome);
  const date = formatDate(article.metadata?.publishedAt);
  const category = article.metadata?.category ?? "Tin tức";

  if (variant === "sidebar") {
    return (
      <Link href={href} style={{ textDecoration: "none" }}>
        <div className="sidebar-article">
          {heroImg && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bestImageUrl(heroImg as Parameters<typeof bestImageUrl>[0])}
              alt={heroImg.alt ?? article.title}
              className="card-row-image"
              style={{ width: 70, height: 48 }}
              loading="lazy"
            />
          )}
          <div>
            <div className="sidebar-article-title">{article.title}</div>
            {date && <div className="sidebar-date">{date}</div>}
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "row") {
    return (
      <Link href={href} style={{ textDecoration: "none" }}>
        <article className="article-card-row">
          {heroImg && (
            <div className="card-image-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bestImageUrl(heroImg as Parameters<typeof bestImageUrl>[0])}
                alt={heroImg.alt ?? article.title}
                className="card-row-image"
                loading="lazy"
              />
            </div>
          )}
          <div>
            <div className="card-tag">{category}</div>
            <h3 className="card-title" style={{ marginTop: 6 }}>
              {article.title}
            </h3>
            {date && (
              <div className="card-meta" style={{ marginTop: 6 }}>
                {date}
              </div>
            )}
          </div>
        </article>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link href={href} style={{ textDecoration: "none" }}>
        <article className="article-card-featured">
          {heroImg && (
            <div className="card-image-wrap" style={{ aspectRatio: "16/9", overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bestImageUrl(heroImg as Parameters<typeof bestImageUrl>[0])}
                alt={heroImg.alt ?? article.title}
                className="card-image"
                loading="eager"
              />
            </div>
          )}
          <div>
            <div className="card-tag">{category}</div>
            <h2 className="card-title" style={{ marginTop: 10, fontSize: 26, fontWeight: 800 }}>
              {article.title}
            </h2>
            {article.metadata?.description && (
              <p style={{ marginTop: 10, fontSize: 15, color: "var(--color-text-light)", lineHeight: 1.6 }}>
                {article.metadata.description.slice(0, 200)}
                {article.metadata.description.length > 200 ? "…" : ""}
              </p>
            )}
            {date && (
              <div className="card-meta" style={{ marginTop: 14 }}>
                {date}
                <span className="card-meta-dot">•</span>
                <span>bqp.vn</span>
              </div>
            )}
          </div>
        </article>
      </Link>
    );
  }

  // Default: grid card
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <article className="article-card">
        {heroImg && (
          <div className="card-image-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bestImageUrl(heroImg as Parameters<typeof bestImageUrl>[0])}
              alt={heroImg.alt ?? article.title}
              className="card-image"
              loading="lazy"
            />
          </div>
        )}
        <div className="card-tag">{category}</div>
        <h3 className="card-title">{article.title}</h3>
        <div className="card-meta">
          {date && <span>{date}</span>}
          {date && <span className="card-meta-dot">•</span>}
          <span>bqp.vn</span>
        </div>
      </article>
    </Link>
  );
}
