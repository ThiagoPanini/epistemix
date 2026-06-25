import { existsSync, statSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";
import { type Catalog, loadCatalog } from "./catalog";

export type { Catalog } from "./catalog";
export type {
  KnowledgeGraph,
  KnowledgeGraphArtifactNode,
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  KnowledgeGraphTagNode,
  NowLearningItem,
  Post,
  Presentation,
  PresentationSlide,
  Section,
  SectionKind,
  Source,
  StudyStatus,
  Tag,
  TimelineEvent,
  TimelineEventType,
} from "./domain";

// `content/` vive na raiz do monorepo. O Next roda (dev/build) com cwd em
// `apps/web`, então subimos dois níveis. Override via env para outros contextos.
const contentDir = process.env.ETHITORIAL_CONTENT_DIR ?? join(process.cwd(), "..", "..", "content");

let cached: Catalog | undefined;

// O catálogo é derivado de arquivos read-only (ADR-0001); ler uma vez por
// processo basta. A validação (tags, slugs reservados) roda aqui e quebra a
// build se o conteúdo for inválido.
export function getCatalog(): Catalog {
  if (!cached) cached = loadCatalog(contentDir);
  return cached;
}

// Extensões de imagem que o route handler de assets pode servir a partir de content/.
const IMAGE_EXTENSIONS = new Set([".webp", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".avif"]);

// Resolve um asset colocado dentro de content/ a partir dos segmentos da URL,
// barrando path traversal e tipos não-imagem. Retorna o caminho absoluto seguro
// ou null. Usado pelo route handler app/content-assets/[...segments]/route.ts.
export function resolveContentAssetPath(segments: string[]): string | null {
  if (segments.length === 0) return null;
  for (const segment of segments) {
    if (
      !segment ||
      segment === "." ||
      segment === ".." ||
      segment.includes("/") ||
      segment.includes("\\")
    ) {
      return null;
    }
  }
  if (!IMAGE_EXTENSIONS.has(extname(segments[segments.length - 1]).toLowerCase())) return null;

  const root = resolve(contentDir);
  const target = resolve(root, ...segments);
  if (target !== root && !target.startsWith(root + sep)) return null;
  if (!existsSync(target) || !statSync(target).isFile()) return null;
  return target;
}
