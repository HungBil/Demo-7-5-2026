/**
 * DemoFooter — Clear disclaimer footer for Demo Day 7/5/2026.
 * Required per requirements.md Phase 3: avoid confusion with official site.
 */
export function DemoFooter() {
  return (
    <footer className="demo-footer">
      <div className="container">
        <div className="demo-footer-inner">
          {/* Demo disclaimer banner */}
          <div className="demo-badge">
            🎓 DỰ ÁN HỌC THUẬT — DEMO DAY 7/5/2026
          </div>

          <div className="demo-footer-cols">
            {/* Left: Disclaimer */}
            <div className="demo-footer-col">
              <h4>Tuyên bố miễn trách nhiệm</h4>
              <p>
                Đây là dự án <strong>Demo học thuật</strong> được xây dựng cho
                mục đích trình bày kỹ thuật (Demo Day 7/5/2026). Website này{" "}
                <strong>không phải</strong> là trang thông tin chính thức của Bộ
                Quốc phòng Việt Nam.
              </p>
              <p>
                Nội dung được crawl tự động từ{" "}
                <a
                  href="https://bqp.vn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  bqp.vn
                </a>{" "}
                chỉ phục vụ mục đích minh họa kỹ thuật RAG (Retrieval-Augmented
                Generation).
              </p>
            </div>

            {/* Middle: Tech stack */}
            <div className="demo-footer-col">
              <h4>Công nghệ sử dụng</h4>
              <ul className="demo-tech-list">
                <li>⚡ Next.js 15 (App Router)</li>
                <li>🔍 BM25 Retrieval (Vietnamese-aware)</li>
                <li>🤖 OpenAI GPT-4o-mini (RAG)</li>
                <li>🕷️ Firecrawl + Playwright MCP</li>
                <li>🚀 Deployed on Vercel</li>
              </ul>
            </div>

            {/* Right: Source */}
            <div className="demo-footer-col">
              <h4>Thông tin dự án</h4>
              <ul className="demo-tech-list">
                <li>
                  📁 Source:{" "}
                  <a
                    href="https://github.com/HungBil/Demo-7-5-2026"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    github.com/HungBil/Demo-7-5-2026
                  </a>
                </li>
                <li>
                  🌐 Source dữ liệu:{" "}
                  <a
                    href="https://bqp.vn"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    bqp.vn
                  </a>{" "}
                  (Bộ Quốc phòng VN)
                </li>
                <li>📅 Ngày crawl: 07/05/2026</li>
                <li>📄 Số bài viết: 11 bài</li>
              </ul>
            </div>
          </div>

          <div className="demo-footer-bottom">
            <span>
              © 2026 Demo học thuật — Không phải trang chính thức của Bộ Quốc
              phòng Việt Nam
            </span>
            <span>
              Trang chính thức:{" "}
              <a
                href="https://bqp.vn"
                target="_blank"
                rel="noopener noreferrer"
              >
                bqp.vn
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
