import Link from "next/link";
import { listArticleSummaries } from "@/server/articles/loadArticles";

export default async function HomePage() {
  const articles = await listArticleSummaries();

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem" }}>
      <h1>Cổng TTĐT Bộ Quốc phòng Việt Nam</h1>
      <p style={{ marginTop: "0.5rem", color: "#666" }}>
        {articles.length > 0
          ? `${articles.length} bài viết đã crawl`
          : "Chưa có bài viết nào. Chạy: npx tsx scripts/crawl-bqp.ts --homepage"}
      </p>
      <div style={{ marginTop: "2rem" }}>
        {articles.map((a) => (
          <Link
            key={a.id}
            href={`/articles/${a.slug}`}
            style={{ display: "block", padding: "1rem", background: "#fff", marginBottom: "1rem", borderRadius: 4, textDecoration: "none", color: "inherit" }}
          >
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600 }}>{a.title}</h2>
            {a.publishedAt && (
              <p style={{ fontSize: "0.85rem", color: "#888", marginTop: "0.25rem" }}>
                {a.publishedAt}
              </p>
            )}
          </Link>
        ))}
      </div>
    </main>
  );
}
