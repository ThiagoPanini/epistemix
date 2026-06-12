import type { Catalog } from "@/lib/catalog";
import { getReadTime, type SiteModel } from "./model";

export interface PaletteItem {
  href: string;
  title: string;
  section: string;
  detail?: string;
  kind: "nav" | "post";
}

const NAV_ITEMS: PaletteItem[] = [
  { href: "/timeline", title: "Cronologia", section: "Navegação", kind: "nav" },
  { href: "/graph", title: "Grafo", section: "Navegação", kind: "nav" },
];

export function buildPaletteItems(model: SiteModel, catalog: Catalog): PaletteItem[] {
  const sectionLabel = new Map(model.sections.map((s) => [s.slug, s.title]));

  const withSourcesPosts: PaletteItem[] = model.posts.map((p) => ({
    href: `/${p.sectionSlug}/${p.sourceSlug}/${p.slug}`,
    title: p.title,
    section: sectionLabel.get(p.sectionSlug) ?? p.sectionSlug,
    detail: p.sourceName,
    kind: "post" as const,
  }));

  const directPosts: PaletteItem[] = catalog
    .getSections()
    .filter((s) => s.kind === "direct")
    .flatMap((s) =>
      catalog.getDirectPosts(s.slug).map((p) => ({
        href: `/${s.slug}/${p.slug}`,
        title: p.title,
        section: sectionLabel.get(s.slug) ?? s.title,
        detail: getReadTime(p.body),
        kind: "post" as const,
      })),
    );

  return [...NAV_ITEMS, ...withSourcesPosts, ...directPosts];
}
