import Link from "next/link";
import { ReactNode } from "react";
import { DemoFooter } from "./DemoFooter";

const NAV_LINKS = [
  { href: "/", label: "Trang chủ" },
  { href: "/articles", label: "Tin tức" },
  { href: "/articles", label: "Quốc phòng" },
  { href: "/articles", label: "Đối ngoại" },
  { href: "/articles", label: "Pháp luật" },
];

export function SiteHeader({ currentPath = "/" }: { currentPath?: string }) {
  return (
    <header className="site-header">
      <div className="container">
        <div className="header-inner">
          <Link href="/" className="site-logo">
            <div className="logo-emblem">BQP</div>
            <div>
              <div className="logo-text-main">Bộ Quốc phòng</div>
              <div className="logo-text-sub">Cổng thông tin điện tử</div>
            </div>
          </Link>

          <nav className="site-nav" aria-label="Điều hướng chính">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`nav-link${currentPath === link.href ? " active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

export function NewsTicker({ headlines }: { headlines: string[] }) {
  // Double the headlines so marquee loops seamlessly
  const doubled = [...headlines, ...headlines];
  return (
    <div className="ticker-bar" aria-label="Tin mới nhất">
      <div className="ticker-label">TIN MỚI</div>
      <div className="ticker-track">
        <div className="ticker-inner">
          {doubled.map((h, i) => (
            <span key={i} className="ticker-item">
              {i % headlines.length !== 0 && (
                <span className="ticker-sep"> ◆ </span>
              )}
              {h}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// SiteFooter kept as a nav-only mini footer above DemoFooter
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-logo-text">BỘ QUỐC PHÒNG — PORTAL DEMO</div>
            <p className="footer-desc">
              Dữ liệu crawl từ{" "}
              <a href="https://bqp.vn" target="_blank" rel="noopener noreferrer">
                bqp.vn
              </a>{" "}
              phục vụ mục đích minh họa kỹ thuật RAG.
            </p>
          </div>
          <div>
            <div className="footer-heading">Điều hướng</div>
            <ul className="footer-links">
              <li><Link href="/">Trang chủ</Link></li>
              <li><Link href="/articles">Tất cả bài viết</Link></li>
              <li>
                <a href="https://bqp.vn" target="_blank" rel="noopener noreferrer">
                  Nguồn gốc: bqp.vn ↗
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="footer-heading">Demo Day 7/5/2026</div>
            <ul className="footer-links">
              <li>
                <a
                  href="https://github.com/HungBil/Demo-7-5-2026"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Source ↗
                </a>
              </li>
              <li>Next.js 15 · BM25 · GPT-4o-mini</li>
              <li>Deployed on Vercel</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>Demo học thuật — Không phải trang chính thức Bộ Quốc phòng VN</span>
          <span>Nguồn dữ liệu: bqp.vn — Demo Day 07/05/2026</span>
        </div>
      </div>
    </footer>
  );
}

export function PageLayout({
  children,
  currentPath = "/",
  tickerHeadlines = [],
}: {
  children: ReactNode;
  currentPath?: string;
  tickerHeadlines?: string[];
}) {
  return (
    <>
      {tickerHeadlines.length > 0 && (
        <NewsTicker headlines={tickerHeadlines} />
      )}
      <SiteHeader currentPath={currentPath} />
      <main className="page-main">{children}</main>
      <SiteFooter />
      <DemoFooter />
    </>
  );
}
