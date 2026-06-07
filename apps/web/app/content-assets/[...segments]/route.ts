import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { resolveContentAssetPath } from "@/lib/catalog";

// Serve imagens (capa de Source, avatar de autor) colocadas junto ao conteúdo em
// content/<section>/<source>/. O catálogo é read-only no filesystem (ADR-0018) e
// o Next só serve public/ estático, então este handler é a ponte para o browser.
// A resolução de caminho (anti path-traversal, só imagens) vive em lib/catalog.
const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ segments: string[] }> },
) {
  const { segments } = await params;
  const absolutePath = resolveContentAssetPath(segments);
  if (!absolutePath) {
    return new Response("Not found", { status: 404 });
  }

  const data = await readFile(absolutePath);
  const contentType =
    CONTENT_TYPE_BY_EXT[extname(absolutePath).toLowerCase()] ?? "application/octet-stream";

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
