import { getArticleBySlug } from "@/server/articles/loadArticles";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem" }}>
      <a href="/" style={{ fontSize: "0.875rem", color: "#666" }}>← Trang chủ</a>
      <h1 style={{ marginTop: "1rem", fontSize: "1.75rem", lineHeight: 1.3 }}>
        {article.title}
      </h1>
      {article.metadata.publishedAt && (
        <p style={{ color: "#888", fontSize: "0.875rem", marginTop: "0.5rem" }}>
          {article.metadata.publishedAt}
        </p>
      )}
      {article.images[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.images[0].absoluteSrc}
          alt={article.images[0].alt || article.title}
          style={{ width: "100%", height: "auto", marginTop: "1rem", borderRadius: 4 }}
        />
      )}
      <article
        style={{ marginTop: "1.5rem", lineHeight: 1.8 }}
        dangerouslySetInnerHTML={{ __html: article.html || article.textContent }}
      />
      <footer style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid #eee", fontSize: "0.8rem", color: "#aaa" }}>
        <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">
          Xem bài gốc trên bqp.vn ↗
        </a>
      </footer>
    </main>
  );
}
