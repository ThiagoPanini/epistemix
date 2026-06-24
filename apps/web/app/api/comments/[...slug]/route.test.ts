import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, POST } from "./route";

function makeParams(slug: string[]) {
  return { params: Promise.resolve({ slug }) };
}

function makeRequest(init?: { cookie?: string; body?: string }) {
  const headers = new Headers();
  if (init?.cookie) headers.set("cookie", init.cookie);
  return {
    headers,
    text: async () => init?.body ?? "",
  } as never;
}

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
  mockFetch.mockReset();
});

describe("GET /api/comments", () => {
  it("proxies the artifact id rebuilt from the catch-all slug", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [{ id: "c1" }] });

    const res = await GET(makeRequest(), makeParams(["courses", "src", "post"]));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: "c1" }]);
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/api/comments/courses/src/post");
  });

  it("returns an empty list when upstream is unreachable", async () => {
    mockFetch.mockRejectedValue(new Error("network down"));

    const res = await GET(makeRequest(), makeParams(["courses", "src", "post"]));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("returns an empty list when upstream responds not-ok", async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({ detail: "boom" }) });

    const res = await GET(makeRequest(), makeParams(["courses", "src", "post"]));

    expect(await res.json()).toEqual([]);
  });
});

describe("POST /api/comments", () => {
  it("forwards cookie + body and passes through the 201 created comment", async () => {
    mockFetch.mockResolvedValue({ status: 201, json: async () => ({ id: "c9", body: "hi" }) });

    const res = await POST(
      makeRequest({ cookie: "session=abc", body: JSON.stringify({ body: "hi" }) }),
      makeParams(["courses", "src", "post"]),
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: "c9", body: "hi" });
    const opts = mockFetch.mock.calls[0][1] as RequestInit & { headers: Record<string, string> };
    expect(opts.method).toBe("POST");
    expect(opts.headers.cookie).toBe("session=abc");
    expect(opts.body).toBe(JSON.stringify({ body: "hi" }));
  });

  it("passes through the 429 rate-limit status", async () => {
    mockFetch.mockResolvedValue({ status: 429, json: async () => ({ detail: "slow down" }) });

    const res = await POST(makeRequest({ body: "{}" }), makeParams(["courses", "src", "post"]));

    expect(res.status).toBe(429);
  });

  it("passes through the 401 unauthenticated status", async () => {
    mockFetch.mockResolvedValue({ status: 401, json: async () => ({ detail: "no auth" }) });

    const res = await POST(makeRequest({ body: "{}" }), makeParams(["courses", "src", "post"]));

    expect(res.status).toBe(401);
  });

  it("returns 502 when upstream is unreachable", async () => {
    mockFetch.mockRejectedValue(new Error("network down"));

    const res = await POST(makeRequest({ body: "{}" }), makeParams(["courses", "src", "post"]));

    expect(res.status).toBe(502);
  });
});

describe("DELETE /api/comments", () => {
  it("forwards cookie and passes through the 204 status", async () => {
    mockFetch.mockResolvedValue({ status: 204 });

    const res = await DELETE(makeRequest({ cookie: "session=abc" }), makeParams(["uuid-123"]));

    expect(res.status).toBe(204);
    const opts = mockFetch.mock.calls[0][1] as RequestInit & { headers: Record<string, string> };
    expect(opts.method).toBe("DELETE");
    expect(opts.headers.cookie).toBe("session=abc");
  });

  it("passes through the 403 forbidden status", async () => {
    mockFetch.mockResolvedValue({ status: 403 });

    const res = await DELETE(makeRequest(), makeParams(["uuid-123"]));

    expect(res.status).toBe(403);
  });

  it("returns 502 when upstream is unreachable", async () => {
    mockFetch.mockRejectedValue(new Error("network down"));

    const res = await DELETE(makeRequest(), makeParams(["uuid-123"]));

    expect(res.status).toBe(502);
  });
});
