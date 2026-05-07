import Link from "next/link";
import { loadArticles } from "@/server/articles/loadArticles";
import { PageLayout } from "@/components/layout/PageLayout";
import { ArticleCard } from "@/components/articles/ArticleCard";

export const revalidate = 3600;

export const metadata = {
  title: "Tất cả bài viết — Bộ Quốc phòng Việt Nam",
  description: "Danh sách bài viết được crawl từ cổng TTĐT Bộ Quốc phòng bqp.vn.",
};

export default async function ArticlesPage() {
  const articles = await loadArticles();

  return (
    <PageLayout currentPath="/articles">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb" aria-label="Điều hướng phân cấp">
          <Link href="/">Trang chủ</Link>
          <span className="breadcrumb-sep">›</span>
          <span>Tin tức</span>
        </nav>

        <h1
          style={{
            fontSize: "var(--fs-2xl)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            borderTop: "2px solid var(--color-primary)",
            paddingTop: 12,
            marginBottom: 8,
          }}
        >
          Tất cả bài viết
        </h1>
        <p style={{ color: "var(--color-text-light)", fontSize: "var(--fs-sm)", marginBottom: 28 }}>
          {articles.length} bài viết từ bqp.vn
        </p>

        {articles.length === 0 ? (
          <div className="empty-state">
            <h2>Chưa có bài viết nào</h2>
            <p style={{ marginTop: 8 }}>Chạy script crawl để lấy dữ liệu từ bqp.vn</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} variant="row" />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
