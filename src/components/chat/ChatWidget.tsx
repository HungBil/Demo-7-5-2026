"use client";

import { useState, useRef, useEffect } from "react";

interface Citation {
  title: string;
  sourceUrl: string;
  slug: string;
  publishedAt?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

interface ChatWidgetProps {
  articleSlug?: string; // optional context — pre-fills the chat about this article
}

export function ChatWidget({ articleSlug }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Xin chào! Tôi là trợ lý AI của Cổng TTĐT Bộ Quốc phòng. Tôi chỉ trả lời dựa trên các bài viết đã crawl từ bqp.vn. Bạn muốn tìm hiểu về chủ đề nào?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          contextArticleSlug: articleSlug,
          history: messages.slice(-6), // send last 6 messages for context
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg: Message = {
        role: "assistant",
        content: data.answer,
        citations: data.citations,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Lỗi không xác định";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `❌ Lỗi: ${errMsg}. Vui lòng thử lại.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-widget" role="complementary" aria-label="Hỏi đáp AI">
      {open && (
        <div className="chat-panel" role="dialog" aria-label="Cửa sổ hỏi đáp AI">
          <div className="chat-header">
            <span className="chat-header-title">🤖 Hỏi đáp AI — bqp.vn</span>
            <button
              className="chat-close"
              onClick={() => setOpen(false)}
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>

          <div className="chat-messages" aria-live="polite">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-msg ${
                  msg.role === "user" ? "chat-msg-user" : "chat-msg-assistant"
                }`}
              >
                <span>{msg.content}</span>
                {msg.citations && msg.citations.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {msg.citations.map((c, j) => (
                      <a
                        key={j}
                        href={`/articles/${c.slug}`}
                        className="chat-citation"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        📄 {c.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="chat-msg chat-msg-assistant">
                <span className="spinner" /> Đang tìm kiếm…
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-row" onSubmit={sendMessage}>
            <input
              id="chat-input"
              className="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi về bài viết hoặc chủ đề…"
              disabled={loading}
              aria-label="Nhập câu hỏi"
              autoComplete="off"
            />
            <button
              type="submit"
              className="chat-send"
              disabled={loading || !input.trim()}
              aria-label="Gửi câu hỏi"
            >
              Hỏi
            </button>
          </form>
        </div>
      )}

      <button
        className="chat-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Đóng hỏi đáp AI" : "Mở hỏi đáp AI"}
        title="Hỏi đáp AI"
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
