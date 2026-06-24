import { type NextRequest, NextResponse } from "next/server";

const API_URL = process.env.ETHITORIAL_API_URL ?? "http://localhost:8000";

// Network to the API is best-effort. 8s survives a slow upstream hop without
// hanging the request forever.
const TIMEOUT_MS = 8000;

type RouteContext = { params: Promise<{ slug: string[] }> };

// GET /api/comments/<artifactId...> — public list, no auth. The catch-all slug
// rebuilds multi-segment artifact ids (e.g. courses/source/post).
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  const artifactId = slug.join("/");
  const cookie = request.headers.get("cookie") ?? "";

  try {
    const res = await fetch(`${API_URL}/api/comments/${artifactId}`, {
      headers: { cookie },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.ok) return NextResponse.json(await res.json());
  } catch {
    // swallow — comments are non-critical; fall through to empty list
  }
  return NextResponse.json([]);
}

// POST /api/comments/<artifactId...> — create a comment. Auth via forwarded
// cookie. Upstream status (201/401/422/429) and body are passed through so the
// client can surface rate-limit and auth errors faithfully.
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  const artifactId = slug.join("/");
  const cookie = request.headers.get("cookie") ?? "";
  const body = await request.text();

  try {
    const res = await fetch(`${API_URL}/api/comments/${artifactId}`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = await res.json().catch(() => null);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}

// DELETE /api/comments/<commentId> — remove a comment. Auth via forwarded
// cookie; the single slug segment is the comment UUID. Upstream status
// (204/401/403/404) is passed through.
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  const commentId = slug.join("/");
  const cookie = request.headers.get("cookie") ?? "";

  try {
    const res = await fetch(`${API_URL}/api/comments/${commentId}`, {
      method: "DELETE",
      headers: { cookie },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return new NextResponse(null, { status: res.status });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
