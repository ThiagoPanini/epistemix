import { getCatalog, type Post, type SectionKind, type Source, type Tag } from "@/lib/catalog";

export type { Tag };

export type SectionIcon = "courses" | "books" | "certs" | "blog" | "present";

export interface SiteSection {
  slug: string;
  title: string;
  kind: SectionKind;
  order: number;
  description: string;
  icon: SectionIcon;
  ready: boolean;
}

export interface SiteSource extends Source {
  postCount: number;
}

export interface SitePost {
  slug: string;
  sectionSlug: string;
  sourceSlug: string;
  sourceName: string;
  title: string;
  date: string;
  tags: string[];
  summary: string;
  readTime: string;
}

export interface SiteModel {
  sections: SiteSection[];
  sources: SiteSource[];
  posts: SitePost[];
  tags: Tag[];
  repoUrl: string;
}

const REPO_URL = "https://github.com/ThiagoPanini/ethitorial";

// Autor do hub (single-author). Distinto do criador externo de um Source (ex.: o
// instrutor de um curso). É quem assina os Posts. O avatar é um asset de identidade
// servido direto de public/, não colocado junto a um Source específico.
export const SITE_AUTHOR = {
  name: "Thiago Panini",
  avatar: "/images/authors/thiago-panini.jpg",
};

const PLANNED_SECTIONS: SiteSection[] = [
  {
    slug: "books",
    title: "Books",
    kind: "with_sources",
    order: 2,
    icon: "books",
    ready: false,
    description: "Livros técnicos lidos, com resumos por capítulo e trechos que marquei.",
  },
  {
    slug: "certifications",
    title: "Certifications",
    kind: "with_sources",
    order: 3,
    icon: "certs",
    ready: false,
    description: "Certificações em andamento e concluídas, com o caminho de estudo.",
  },
  {
    slug: "blog",
    title: "Blog",
    kind: "direct",
    order: 4,
    icon: "blog",
    ready: false,
    description: "Posts soltos: ideias, experimentos e notas que não pertencem a um curso.",
  },
  {
    slug: "presentations",
    title: "Presentations",
    kind: "direct",
    order: 5,
    icon: "present",
    ready: false,
    description: "Palestras e decks, apresentados aqui mesmo pelo player de slides.",
  },
];

const ICON_BY_SLUG: Record<string, SectionIcon> = {
  courses: "courses",
  books: "books",
  certifications: "certs",
  blog: "blog",
  presentations: "present",
};

export function getPlannedSection(slug: string): SiteSection | undefined {
  return PLANNED_SECTIONS.find((section) => section.slug === slug);
}

export function getAllStaticSectionSlugs(): string[] {
  const catalog = getCatalog();
  return [
    ...catalog.getSections().map((section) => section.slug),
    ...PLANNED_SECTIONS.map((section) => section.slug),
    "about",
  ];
}

export function getReadTime(body: string): string {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 220));
  return `${minutes} min`;
}

export function getSiteModel(): SiteModel {
  const catalog = getCatalog();
  const realSections: SiteSection[] = catalog.getSections().map((section) => ({
    ...section,
    ready: true,
    icon: ICON_BY_SLUG[section.slug] ?? "blog",
  }));

  const sectionSlugs = new Set(realSections.map((section) => section.slug));
  const sections = [
    ...realSections,
    ...PLANNED_SECTIONS.filter((section) => !sectionSlugs.has(section.slug)),
  ].sort((a, b) => a.order - b.order);

  const sources = catalog.getSections().flatMap((section) =>
    catalog.getSources(section.slug).map((source) => ({
      ...source,
      postCount: catalog.getPosts(section.slug, source.slug).length,
    })),
  );

  const sourceByKey = new Map(
    sources.map((source) => [`${source.sectionSlug}/${source.slug}`, source]),
  );
  const posts: SitePost[] = catalog
    .getSections()
    .flatMap((section) =>
      catalog
        .getSources(section.slug)
        .flatMap((source) =>
          catalog.getPosts(section.slug, source.slug).map((post) => toSitePost(post, sourceByKey)),
        ),
    );

  return {
    sections,
    sources,
    posts,
    tags: catalog.getTags(),
    repoUrl: REPO_URL,
  };
}

function toSitePost(post: Post, sourceByKey: Map<string, SiteSource>): SitePost {
  const source = sourceByKey.get(`${post.sectionSlug}/${post.sourceSlug}`);
  return {
    slug: post.slug,
    sectionSlug: post.sectionSlug,
    sourceSlug: post.sourceSlug,
    sourceName: source?.name ?? post.sourceSlug,
    title: post.title,
    date: post.date,
    tags: post.tags,
    summary: post.summary,
    readTime: getReadTime(post.body),
  };
}
