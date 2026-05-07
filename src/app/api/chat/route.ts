import { NextRequest, NextResponse } from "next/server";
import { runArticleAgent } from "@/server/agent/articleAgent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [], contextArticleSlug } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: "message too long (max 1000 chars)" },
        { status: 400 }
      );
    }

    const result = await runArticleAgent(
      message.trim(),
      Array.isArray(history) ? history : [],
      contextArticleSlug
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("[/api/chat] Error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { status: "ok", description: "BQP Article Agent Chat API" },
    { status: 200 }
  );
}
