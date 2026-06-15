import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/catalog", () => ({
  resolveContentAssetPath: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
}));

import { readFile } from "node:fs/promises";
import { resolveContentAssetPath } from "@/lib/catalog";
import { GET } from "./route";

const mockResolve = resolveContentAssetPath as ReturnType<typeof vi.fn>;
const mockRead = readFile as ReturnType<typeof vi.fn>;

afterEach(() => vi.clearAllMocks());

function makeParams(segments: string[]) {
  return { params: Promise.resolve({ segments }) };
}

describe("content-assets route", () => {
  it("returns 404 when path not resolved", async () => {
    mockResolve.mockReturnValue(null);
    const res = await GET(new Request("http://x"), makeParams(["missing.webp"]));
    expect(res.status).toBe(404);
  });

  it("serves raster image without sandbox headers (SEC-3)", async () => {
    mockResolve.mockReturnValue("/content/cover.webp");
    mockRead.mockResolvedValue(Buffer.from([0x00]));
    const res = await GET(new Request("http://x"), makeParams(["cover.webp"]));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/webp");
    expect(res.headers.get("Content-Security-Policy")).toBeNull();
    expect(res.headers.get("Content-Disposition")).toBeNull();
  });

  it("serves SVG with sandbox CSP + Content-Disposition (SEC-3)", async () => {
    mockResolve.mockReturnValue("/content/icon.svg");
    mockRead.mockResolvedValue(Buffer.from("<svg></svg>"));
    const res = await GET(new Request("http://x"), makeParams(["icon.svg"]));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(res.headers.get("Content-Security-Policy")).toBe("sandbox; default-src 'none'");
    expect(res.headers.get("Content-Disposition")).toBe("inline");
  });
});
