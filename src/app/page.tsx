import Link from "next/link";
import { loadArticles } from "@/server/articles/loadArticles";
import { PageLayout } from "@/components/layout/PageLayout";
import { ArticleCard } from "@/components/articles/ArticleCard";

export const revalidate = 3600; // ISR: revalidate hourly

export default async function HomePage() {
  const articles = await loadArticles();

  const tickerHeadlines = articles.slice(0, 8).map((a) => a.title);

  const [featured, ...rest] = articles;
  const gridArticles = rest.slice(0, 6);
  const sidebarArticles = rest.slice(6);

  return (
    <PageLayout currentPath="/" tickerHeadlines={tickerHeadlines}>
      <div className="container">
        {articles.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 64 }}>
            <h2>Chưa có bài viết nào</h2>
            <p style={{ marginTop: 8 }}>
              Chạy:{" "}
              <code
                style={{
                  background: "var(--color-bg-alt)",
                  padding: "2px 8px",
                  fontFamily: "monospace",
                }}
              >
                npx tsx scripts/crawl-bqp.ts --homepage
              </code>
            </p>
          </div>
        ) : (
          <>
            {/* ─── Featured Article ─── */}
            {featured && (
              <section style={{ marginTop: 36 }}>
                <ArticleCard article={featured} variant="featured" />
              </section>
            )}

            {/* ─── Main Content + Sidebar ─── */}
            <div className="content-grid">
              {/* Main: 3-col article grid */}
              <section>
                <h2 className="section-heading">Tin tức mới nhất</h2>
                <div className="articles-grid">
                  {gridArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} variant="grid" />
                  ))}
                </div>

                {articles.length > 7 && (
                  <div style={{ marginTop: 28, textAlign: "center" }}>
                    <Link href="/articles" className="btn btn-outline">
                      Xem tất cả {articles.length} bài viết →
                    </Link>
                  </div>
                )}
              </section>

              {/* Sidebar */}
              <aside className="sidebar">
                {/* Latest articles */}
                <div className="sidebar-block">
                  <h3 className="section-heading">Đọc nhiều nhất</h3>
                  {(sidebarArticles.length > 0
                    ? sidebarArticles
                    : rest.slice(0, 4)
                  ).map((a) => (
                    <ArticleCard key={a.id} article={a} variant="sidebar" />
                  ))}
                </div>

                {/* Stats box */}
                <div
                  style={{
                    background: "var(--color-dark)",
                    color: "#fff",
                    padding: "20px",
                    borderTop: "2px solid var(--color-primary)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "var(--fs-xs)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "rgba(255,255,255,0.6)",
                      marginBottom: 12,
                    }}
                  >
                    Dữ liệu crawl
                  </div>
                  <div style={{ fontSize: "var(--fs-2xl)", fontWeight: 800 }}>
                    {articles.length}
                  </div>
                  <div style={{ fontSize: "var(--fs-sm)", color: "rgba(255,255,255,0.7)" }}>
                    bài viết từ bqp.vn
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <Link href="/articles" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                      Xem tất cả
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}
