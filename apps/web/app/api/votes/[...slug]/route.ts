import { type NextRequest, NextResponse } from "next/server";

const API_URL = process.env.ETHITORIAL_API_URL ?? "http://localhost:8000";

type RouteContext = { params: Promise<{ slug: string[] }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  const artifactId = slug.join("/");
  const cookie = request.headers.get("cookie") ?? "";

  try {
    const res = await fetch(`${API_URL}/api/votes/${artifactId}`, {
      headers: { cookie },
      next: { revalidate: 0 },
    });
    if (res.ok) return NextResponse.json(await res.json());
  } catch {
    // swallow
  }
  return NextResponse.json({ count: 0, voted: false });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  const artifactId = slug.join("/");
  const cookie = request.headers.get("cookie") ?? "";

  try {
    const res = await fetch(`${API_URL}/api/votes/${artifactId}`, {
      method: "POST",
      headers: { cookie },
    });
    if (res.ok) return NextResponse.json(await res.json());
    if (res.status === 401) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  } catch {
    // swallow
  }
  return NextResponse.json({ count: 0, voted: false });
}
