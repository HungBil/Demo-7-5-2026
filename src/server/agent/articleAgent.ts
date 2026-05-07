/**
 * articleAgent.ts — Grounded chatbot agent.
 * Answers ONLY from retrieved article content via BM25.
 * Never uses general world knowledge. Every answer includes citations.
 * If OPENAI_API_KEY is missing or invalid, falls back to search-result mode.
 */

import { searchArticles } from "@/server/retrieval/searchArticles";
import type { SearchResult } from "@/server/retrieval/types";

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentResponse {
  answer: string;
  citations: Array<{
    title: string;
    sourceUrl: string;
    slug: string;
    publishedAt?: string;
    chunkIndex: number;
  }>;
  confidence: "high" | "medium" | "low";
  usedArticleSlugs: string[];
}

const SYSTEM_PROMPT = `Bạn là trợ lý AI của Cổng TTĐT Bộ Quốc phòng Việt Nam.

QUY TẮC BẮT BUỘC:
1. Chỉ trả lời dựa trên CÁC ĐOẠN VĂN BẢN được cung cấp từ bài viết bqp.vn bên dưới.
2. KHÔNG được dùng kiến thức chung. Nếu thông tin không có trong ngữ cảnh, hãy nói rõ.
3. KHÔNG được bịa đặt tiêu đề, URL, ngày tháng, tên người, hay trích dẫn.
4. Mọi câu trả lời thực tế phải kèm trích dẫn nguồn bài viết.
5. Nếu không tìm thấy thông tin liên quan: "Tôi không tìm thấy thông tin về chủ đề này trong dữ liệu đã crawl từ bqp.vn."
6. Tóm tắt phải được ghi rõ là "Tóm tắt AI" và không thay thế nội dung gốc.
7. Trả lời bằng tiếng Việt, ngắn gọn và chính xác.`;

/* ─── Input Guardrails ─────────────────────────────────────────────────────
 * Block prompt injection, jailbreak attempts, and out-of-scope requests.
 * Returns a rejection reason string, or null if the query is safe.
 * ─────────────────────────────────────────────────────────────────────── */
const INJECTION_PATTERNS = [
  /ignore (all |previous |above |system )?instructions?/i,
  /forget (your |all |previous )?rules?/i,
  /you are now/i,
  /pretend (to be|you are|you're)/i,
  /act as (if you are|a|an)/i,
  /jailbreak/i,
  /DAN\b/,
  /system prompt/i,
  /override (safety|rules|guidelines)/i,
  /roleplay as/i,
];

/** Returns a safe rejection message if the input is a guardrail violation, else null */
function checkInputGuardrails(message: string): string | null {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(message)) {
      return "Yêu cầu này không phù hợp với chức năng của trợ lý. Tôi chỉ trả lời các câu hỏi liên quan đến nội dung bài viết từ bqp.vn.";
    }
  }
  // Block requests that are clearly not about defense/bqp content and are very short
  if (message.trim().length < 2) {
    return "Vui lòng nhập câu hỏi hợp lệ.";
  }
  return null;
}

/* ─── Output Guardrails ────────────────────────────────────────────────────
 * Ensure LLM responses don't fabricate URLs or claim to be authoritative.
 * ─────────────────────────────────────────────────────────────────────── */
const FABRICATED_URL_PATTERN = /https?:\/\/(?!bqp\.vn)[^\s]+\.(vn|com|org|gov)[^\s]*/gi;

function checkOutputGuardrails(answer: string): string {
  // Remove any fabricated external URLs the LLM may have added
  const cleaned = answer.replace(FABRICATED_URL_PATTERN, "[URL đã xóa]");
  return cleaned;
}

function buildContext(results: SearchResult[]): string {
  if (results.length === 0) return "";
  return results
    .map(
      (r, i) =>
        `[${i + 1}] Bài: "${r.title}"\nNguồn: ${r.sourceUrl}\nNội dung:\n${r.snippet}`
    )
    .join("\n\n---\n\n");
}

/** Fallback: return structured search results when no LLM is available */
function buildFallbackResponse(results: SearchResult[], query: string): AgentResponse {
  if (results.length === 0) {
    return {
      answer: `Tôi không tìm thấy thông tin về "${query}" trong dữ liệu đã crawl từ bqp.vn. Vui lòng thử từ khóa khác hoặc xem danh sách bài viết.`,
      citations: [],
      confidence: "low",
      usedArticleSlugs: [],
    };
  }

  const top = results[0];
  const answerLines = [
    `Đây là kết quả tìm kiếm từ bqp.vn cho "${query}":\n`,
    ...results.map(
      (r, i) => `${i + 1}. **${r.title}**\n   ${r.snippet.slice(0, 150)}…`
    ),
  ];

  return {
    answer: answerLines.join("\n"),
    citations: results.map((r) => r.citation),
    confidence: top.score > 2 ? "high" : top.score > 1 ? "medium" : "low",
    usedArticleSlugs: results.map((r) => r.slug),
  };
}

/** Check if OpenAI key looks valid (not just a placeholder) */
function getOpenAIKey(): string | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === "gpt-4o-mini" || key.length < 20) return null;
  return key;
}

/**
 * Main agent function.
 * 1. Search articles with BM25
 * 2. If OpenAI available, use LLM with grounded context
 * 3. Otherwise, return structured search results
 */
export async function runArticleAgent(
  userMessage: string,
  history: AgentMessage[] = [],
  contextArticleSlug?: string
): Promise<AgentResponse> {
  // ── Input Guardrail ──────────────────────────────────────────
  const guardrailViolation = checkInputGuardrails(userMessage);
  if (guardrailViolation) {
    return {
      answer: guardrailViolation,
      citations: [],
      confidence: "low",
      usedArticleSlugs: [],
    };
  }

  // Build search query — combine current message with recent context
  const recentUserMessages = history
    .filter((m) => m.role === "user")
    .slice(-2)
    .map((m) => m.content)
    .join(" ");
  const searchQuery = `${recentUserMessages} ${userMessage}`.trim();

  // BM25 search
  const results = await searchArticles(searchQuery, { limit: 5 });

  // If no results found
  if (results.length === 0) {
    return {
      answer: `Tôi không tìm thấy thông tin về "${userMessage}" trong ${await (async () => { const { loadArticles } = await import("@/server/articles/loadArticles"); return (await loadArticles()).length; })()} bài viết đã crawl từ bqp.vn. Vui lòng thử từ khóa khác.`,
      citations: [],
      confidence: "low",
      usedArticleSlugs: [],
    };
  }

  // Try OpenAI if key available
  const apiKey = getOpenAIKey();
  if (!apiKey) {
    // Fallback mode: return structured search results
    return buildFallbackResponse(results, userMessage);
  }

  try {
    const context = buildContext(results);
    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...history.slice(-4).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      {
        role: "user" as const,
        content: `Ngữ cảnh từ bqp.vn:\n${context}\n\nCâu hỏi: ${userMessage}`,
      },
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 800,
        temperature: 0.1, // low temperature for factual grounded answers
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[agent] OpenAI error:", res.status, errBody);
      return buildFallbackResponse(results, userMessage);
    }

    const data = await res.json();
    const rawAnswer = data.choices?.[0]?.message?.content ?? "";
    // ── Output Guardrail ─────────────────────────────────────────
    const answer = checkOutputGuardrails(rawAnswer);

    const topScore = results[0].score;
    const confidence: "high" | "medium" | "low" =
      topScore > 3 ? "high" : topScore > 1.5 ? "medium" : "low";

    return {
      answer,
      citations: results.map((r) => r.citation),
      confidence,
      usedArticleSlugs: results.map((r) => r.slug),
    };
  } catch (err) {
    console.error("[agent] Unexpected error:", err);
    return buildFallbackResponse(results, userMessage);
  }
}
