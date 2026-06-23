import { type NextRequest, NextResponse } from "next/server";

const API_URL = process.env.ETHITORIAL_API_URL ?? "http://localhost:8000";

type RouteContext = { params: Promise<{ slug: string[] }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  const artifactId = slug.join("/");
  const sessionId = request.cookies.get("ethitorial_sid")?.value;
  if (!sessionId) return new NextResponse(null, { status: 204 });

  try {
    await fetch(`${API_URL}/api/views/${artifactId}`, {
      method: "POST",
      headers: {
        cookie: `ethitorial_sid=${sessionId}`,
        "user-agent": request.headers.get("user-agent") ?? "",
      },
    });
  } catch {
    // swallow network errors — view recording is best-effort
  }
  return new NextResponse(null, { status: 204 });
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  const artifactId = slug.join("/");

  try {
    const res = await fetch(`${API_URL}/api/views/${artifactId}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) return NextResponse.json(await res.json());
  } catch {
    // swallow network errors
  }
  return NextResponse.json({ count: 0 });
}
