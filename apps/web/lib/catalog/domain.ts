// Modelo de domínio do catálogo materializado em TypeScript (ADR-0015 + ADR-0018).
// Na Fase 1 o catálogo é MDX-native: estes tipos são derivados de `content/`
// pelo content source (adapter de filesystem), não de uma API.

export type SectionKind = "direct" | "with_sources";

export interface Section {
  slug: string;
  title: string;
  kind: SectionKind;
  order: number;
  description: string;
}

export interface Source {
  slug: string;
  sectionSlug: string;
  name: string;
  externalUrl: string;
  author: string;
  description: string;
  cover?: string; // caminho relativo da capa em content/<section>/<source>/
  authorAvatar?: string; // caminho relativo do avatar do autor, idem
}

export interface Tag {
  slug: string;
  label: string;
}

export type PostStatus = "draft" | "published";

export interface Post {
  slug: string;
  sectionSlug: string;
  sourceSlug: string;
  title: string;
  date: string; // ISO YYYY-MM-DD
  status: PostStatus;
  tags: string[];
  summary: string;
  body: string; // prosa MDX crua, renderizada na rota
}
