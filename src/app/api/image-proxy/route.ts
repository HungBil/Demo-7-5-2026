/**
 * /api/image-proxy — Proxy images from bqp.vn to avoid CORS / mixed-content errors.
 * Usage: /api/image-proxy?url=http%3A%2F%2Fbqp.vn%2F...
 */

import { NextRequest, NextResponse } from "next/server";

// Allowlist: only proxy from bqp.vn
const ALLOWED_ORIGIN = "bqp.vn";

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  // Security: only proxy bqp.vn images
  if (!targetUrl.hostname.endsWith(ALLOWED_ORIGIN)) {
    return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(targetUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; BQPPortal/1.0; +https://github.com/HungBil/Demo-7-5-2026)",
        Referer: "http://bqp.vn/",
      },
      // 10 second timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream ${upstream.status}` },
        { status: 502 }
      );
    }

    const contentType =
      upstream.headers.get("content-type") ?? "image/jpeg";
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Cache 24h on client, 1h on CDN
        "Cache-Control": "public, max-age=86400, s-maxage=3600",
        "X-Proxied-From": "bqp.vn",
      },
    });
  } catch (err) {
    console.error("[image-proxy] fetch failed:", err);
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 });
  }
}
