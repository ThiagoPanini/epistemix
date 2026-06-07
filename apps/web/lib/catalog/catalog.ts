import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import yaml from "js-yaml";
import type { Post, Section, Source, Tag } from "./domain";
import { isReservedSectionSlug } from "./reserved";
import {
  postFrontmatterSchema,
  sectionsFileSchema,
  sourceFileSchema,
  tagsFileSchema,
} from "./schema";

export interface Catalog {
  getSections(): Section[];
  getSection(slug: string): Section | undefined;
  getSources(sectionSlug: string): Source[];
  getSource(sectionSlug: string, sourceSlug: string): Source | undefined;
  getPosts(sectionSlug: string, sourceSlug: string): Post[];
  getPost(sectionSlug: string, sourceSlug: string, postSlug: string): Post | undefined;
  getTags(): Tag[];
}

function readYaml(path: string): unknown {
  return yaml.load(readFileSync(path, "utf8"));
}

function listDirs(path: string): string[] {
  return readdirSync(path, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

function listMdx(path: string): string[] {
  return readdirSync(path, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".mdx"))
    .map((e) => e.name);
}

function loadSources(rootDir: string, section: Section): Source[] {
  if (section.kind !== "with_sources") return [];

  return listDirs(join(rootDir, section.slug)).map((slug) => {
    const raw = sourceFileSchema.parse(readYaml(join(rootDir, section.slug, slug, "source.yml")));
    return {
      slug,
      sectionSlug: section.slug,
      name: raw.name,
      externalUrl: raw.external_url,
      author: raw.author,
      description: raw.description,
      cover: raw.cover,
      authorAvatar: raw.author_avatar,
    };
  });
}

function loadPosts(rootDir: string, source: Source, knownTags: Set<string>): Post[] {
  const dir = join(rootDir, source.sectionSlug, source.slug);
  return listMdx(dir).map((file) => {
    const { data, content } = matter(readFileSync(join(dir, file), "utf8"));
    const frontmatter = postFrontmatterSchema.parse(data);

    // Invariante 9: tag fora do conjunto curado quebra a build.
    const unknown = frontmatter.tags.filter((t) => !knownTags.has(t));
    if (unknown.length > 0) {
      const where = join(source.sectionSlug, source.slug, file);
      throw new Error(
        `Tag(s) fora de tags.yml em ${where}: ${unknown.join(", ")} (ver invariante 9 / ADR-0008)`,
      );
    }

    return {
      slug: file.replace(/\.mdx$/, ""),
      sectionSlug: source.sectionSlug,
      sourceSlug: source.slug,
      ...frontmatter,
      body: content,
    };
  });
}

export function loadCatalog(rootDir: string): Catalog {
  const sections = sectionsFileSchema
    .parse(readYaml(join(rootDir, "sections.yml")))
    .sort((a, b) => a.order - b.order);

  for (const section of sections) {
    if (isReservedSectionSlug(section.slug)) {
      throw new Error(
        `Slug de Section reservado: "${section.slug}" colide com uma rota do app (ver spec 0001).`,
      );
    }
  }

  const tags: Tag[] = tagsFileSchema.parse(readYaml(join(rootDir, "tags.yml")));
  const knownTags = new Set(tags.map((t) => t.slug));

  const sources = sections.flatMap((section) => loadSources(rootDir, section));
  const posts = sources.flatMap((source) => loadPosts(rootDir, source, knownTags));

  const publishedIn = (sectionSlug: string, sourceSlug: string) =>
    posts
      .filter(
        (p) =>
          p.status === "published" && p.sectionSlug === sectionSlug && p.sourceSlug === sourceSlug,
      )
      .sort((a, b) => b.date.localeCompare(a.date));

  return {
    getSections: () => sections,
    getSection: (slug) => sections.find((s) => s.slug === slug),
    getSources: (sectionSlug) => sources.filter((s) => s.sectionSlug === sectionSlug),
    getSource: (sectionSlug, sourceSlug) =>
      sources.find((s) => s.sectionSlug === sectionSlug && s.slug === sourceSlug),
    getPosts: publishedIn,
    getPost: (sectionSlug, sourceSlug, postSlug) =>
      publishedIn(sectionSlug, sourceSlug).find((p) => p.slug === postSlug),
    getTags: () => tags,
  };
}
