import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArticleBySlug, loadArticles } from "@/server/articles/loadArticles";
import { PageLayout } from "@/components/layout/PageLayout";
import { ArticleRenderer } from "@/components/articles/ArticleRenderer";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { ChatWidget } from "@/components/chat/ChatWidget";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const articles = await loadArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Không tìm thấy bài viết" };
  return {
    title: `${article.title} — Bộ Quốc phòng Việt Nam`,
    description: article.metadata.description ?? article.textContent.slice(0, 160),
    openGraph: {
      title: article.title,
      description: article.metadata.description,
      images: article.images[0]
        ? [{ url: article.images[0].absoluteSrc }]
        : undefined,
    },
  };
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const [article, allArticles] = await Promise.all([
    getArticleBySlug(slug),
    loadArticles(),
  ]);

  if (!article) notFound();

  const related = allArticles
    .filter((a) => a.slug !== slug)
    .slice(0, 5);

  const publishedDate = formatDate(article.metadata.publishedAt);
  const category = article.metadata.category ?? "Tin tức";

  return (
    <PageLayout currentPath="/articles">
      <div className="container">
        {/* ─── Breadcrumb ─── */}
        <nav className="breadcrumb" aria-label="Điều hướng phân cấp">
          <Link href="/">Trang chủ</Link>
          <span className="breadcrumb-sep">›</span>
          <Link href="/articles">Tin tức</Link>
          <span className="breadcrumb-sep">›</span>
          <span
            style={{
              maxWidth: 300,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: "var(--color-text)",
            }}
          >
            {article.title}
          </span>
        </nav>

        {/* ─── Main + Sidebar layout ─── */}
        <div className="content-grid">
          {/* ─── Article body ─── */}
          <article className="article-detail">
            {/* Category tag */}
            <div className="card-tag" style={{ marginBottom: 14 }}>
              {category}
            </div>

            {/* Title */}
            <h1 className="article-title-main">{article.title}</h1>

            {/* Meta row */}
            <div className="article-meta-row">
              {publishedDate && (
                <span
                  style={{
                    fontSize: "var(--fs-xs)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--color-text-light)",
                    fontWeight: 600,
                  }}
                >
                  📅 {publishedDate}
                </span>
              )}
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "var(--fs-xs)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--color-primary)",
                  fontWeight: 600,
                }}
              >
                bqp.vn ↗
              </a>
              {article.images.length > 0 && (
                <span
                  style={{
                    fontSize: "var(--fs-xs)",
                    color: "var(--color-text-light)",
                  }}
                >
                  📷 {article.images.length} ảnh
                </span>
              )}
            </div>

            {/* Article content */}
            <ArticleRenderer article={article} />

            {/* Footer */}
            <div className="article-footer">
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="source-link"
              >
                📎 Xem bài gốc trên bqp.vn ↗
              </a>
              <div
                style={{
                  fontSize: "var(--fs-xs)",
                  color: "var(--color-text-light)",
                }}
              >
                Crawl lúc:{" "}
                {new Date(article.metadata.crawledAt).toLocaleString("vi-VN")}
              </div>
            </div>
          </article>

          {/* ─── Sidebar ─── */}
          <aside className="sidebar">
            {/* Article info box */}
            <div
              className="sidebar-block"
              style={{
                background: "var(--color-bg-alt)",
                padding: "16px",
                borderTop: "2px solid var(--color-primary)",
              }}
            >
              <div
                style={{
                  fontSize: "var(--fs-xs)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--color-text-light)",
                  marginBottom: 10,
                }}
              >
                Thông tin bài viết
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--fs-sm)" }}>
                <tbody>
                  {article.metadata.category && (
                    <tr>
                      <td style={{ color: "var(--color-text-light)", paddingBottom: 6, paddingRight: 8, whiteSpace: "nowrap" }}>
                        Chuyên mục
                      </td>
                      <td style={{ fontWeight: 600 }}>{article.metadata.category}</td>
                    </tr>
                  )}
                  {article.metadata.publishedAt && (
                    <tr>
                      <td style={{ color: "var(--color-text-light)", paddingBottom: 6, paddingRight: 8, whiteSpace: "nowrap" }}>
                        Ngày đăng
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {formatDate(article.metadata.publishedAt)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ color: "var(--color-text-light)", paddingBottom: 6, paddingRight: 8 }}>
                      Nguồn
                    </td>
                    <td>
                      <a
                        href={article.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--color-primary)", fontWeight: 600 }}
                      >
                        bqp.vn
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ color: "var(--color-text-light)", paddingRight: 8 }}>
                      Hình ảnh
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {article.images.length} ảnh
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Related articles */}
            {related.length > 0 && (
              <div className="sidebar-block">
                <h3 className="section-heading">Bài viết liên quan</h3>
                {related.map((a) => (
                  <ArticleCard key={a.id} article={a} variant="sidebar" />
                ))}
              </div>
            )}

            {/* Back to list */}
            <Link href="/articles" className="btn btn-outline" style={{ width: "100%", justifyContent: "center" }}>
              ← Tất cả bài viết
            </Link>
          </aside>
        </div>
      </div>

      {/* ─── Inline Chat Widget ─── */}
      <ChatWidget articleSlug={slug} />
    </PageLayout>
  );
}
