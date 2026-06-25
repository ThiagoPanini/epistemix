// Slugs de Section ocupam o topo do path (`/<section>`), então não podem
// colidir com rotas reservadas do app. Ver CONTEXT.md e ADR-0007 (/authors).
export const RESERVED_SECTION_SLUGS = new Set([
  "authors",
  "about",
  "api",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export function isReservedSectionSlug(slug: string): boolean {
  return RESERVED_SECTION_SLUGS.has(slug);
}
