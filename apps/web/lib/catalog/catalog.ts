import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import yaml from "js-yaml";
import type {
  KnowledgeGraph,
  KnowledgeGraphArtifactNode,
  NowLearningItem,
  Post,
  Section,
  Source,
  Tag,
  TimelineEvent,
} from "./domain";
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
  getDirectPosts(sectionSlug: string): Post[];
  getDirectPost(sectionSlug: string, postSlug: string): Post | undefined;
  getTags(): Tag[];
  getNowLearning(): NowLearningItem[];
  getTimelineEvents(): TimelineEvent[];
  getKnowledgeGraph(): KnowledgeGraph;
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

function loadDirectPosts(rootDir: string, section: Section, knownTags: Set<string>): Post[] {
  if (section.kind !== "direct") return [];

  const dir = join(rootDir, section.slug);
  let files: string[];
  try {
    files = listMdx(dir);
  } catch {
    return [];
  }

  return files.map((file) => {
    const { data, content } = matter(readFileSync(join(dir, file), "utf8"));
    const frontmatter = postFrontmatterSchema.parse(data);

    const unknown = frontmatter.tags.filter((t) => !knownTags.has(t));
    if (unknown.length > 0) {
      const where = join(section.slug, file);
      throw new Error(
        `Tag(s) fora de tags.yml em ${where}: ${unknown.join(", ")} (ver invariante 9 / ADR-0008)`,
      );
    }

    return {
      slug: file.replace(/\.mdx$/, ""),
      sectionSlug: section.slug,
      sourceSlug: "",
      ...frontmatter,
      body: content,
    };
  });
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
      studyStatus: raw.study_status,
      startedAt: raw.started_at,
      lastActivity: raw.last_activity,
      progress: raw.progress,
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
  const directPosts = sections.flatMap((section) => loadDirectPosts(rootDir, section, knownTags));

  const publishedIn = (sectionSlug: string, sourceSlug: string) =>
    posts
      .filter(
        (p) =>
          p.status === "published" && p.sectionSlug === sectionSlug && p.sourceSlug === sourceSlug,
      )
      .sort((a, b) => b.date.localeCompare(a.date));

  const publishedDirect = (sectionSlug: string) =>
    directPosts
      .filter((p) => p.status === "published" && p.sectionSlug === sectionSlug)
      .sort((a, b) => b.date.localeCompare(a.date));

  const sectionTitle = (slug: string) =>
    sections.find((section) => section.slug === slug)?.title ?? slug;

  const timelineEvents = (): TimelineEvent[] =>
    [
      ...posts
        .filter((post) => post.status === "published")
        .map((post) => {
          const source = sources.find(
            (candidate) =>
              candidate.sectionSlug === post.sectionSlug && candidate.slug === post.sourceSlug,
          );
          return {
            id: `note:${post.sectionSlug}/${post.sourceSlug}/${post.slug}`,
            type: "note" as const,
            date: post.date,
            year: post.date.slice(0, 4),
            label: post.title,
            detail: source?.name ?? sectionTitle(post.sectionSlug),
            href: `/${post.sectionSlug}/${post.sourceSlug}/${post.slug}`,
            hot: false,
          };
        }),
      ...directPosts
        .filter((post) => post.status === "published")
        .map((post) => {
          const type: TimelineEvent["type"] =
            post.sectionSlug === "presentations" ? "lecture" : "publication";
          return {
            id: `${type}:${post.sectionSlug}/${post.slug}`,
            type,
            date: post.date,
            year: post.date.slice(0, 4),
            label: post.title,
            detail: sectionTitle(post.sectionSlug),
            href: `/${post.sectionSlug}/${post.slug}`,
            hot: true,
          };
        }),
      ...sources.flatMap((source) => {
        const events: TimelineEvent[] = [];
        if (source.startedAt) {
          events.push({
            id: `start:${source.sectionSlug}/${source.slug}`,
            type: "start",
            date: source.startedAt,
            year: source.startedAt.slice(0, 4),
            label: source.name,
            detail: sectionTitle(source.sectionSlug),
            href: `/${source.sectionSlug}/${source.slug}`,
            hot: false,
          });
        }
        if (source.studyStatus === "concluded") {
          const date = source.lastActivity ?? source.startedAt;
          if (date) {
            events.push({
              id: `conquest:${source.sectionSlug}/${source.slug}`,
              type: "conquest",
              date,
              year: date.slice(0, 4),
              label: source.name,
              detail: sectionTitle(source.sectionSlug),
              href: `/${source.sectionSlug}/${source.slug}`,
              hot: true,
            });
          }
        }
        return events;
      }),
    ].sort((a, b) => b.date.localeCompare(a.date));

  const allPublishedPosts = () =>
    [...directPosts, ...posts]
      .filter((post) => post.status === "published")
      .sort((a, b) => {
        const date = b.date.localeCompare(a.date);
        if (date !== 0) return date;
        return artifactKey(a).localeCompare(artifactKey(b));
      });

  const knowledgeGraph = (): KnowledgeGraph => {
    const artifacts = allPublishedPosts();
    const tagNodes = tags.map((tag, index) => ({
      kind: "tag" as const,
      id: `tag:${tag.slug}`,
      slug: tag.slug,
      label: tag.label,
      x: 170,
      y: spread(index, tags.length),
    }));
    const artifactNodes: KnowledgeGraphArtifactNode[] = artifacts.map((post, index) => ({
      kind: "artifact",
      id: `artifact:${artifactKey(post)}`,
      slug: post.slug,
      sectionSlug: post.sectionSlug,
      sourceSlug: post.sourceSlug,
      label: post.title,
      href: artifactHref(post),
      x: 760,
      y: spread(index, artifacts.length),
      reads: 0,
      radius: 10,
    }));
    const edges = artifacts.flatMap((post) =>
      post.tags.map((tag) => ({
        id: `edge:${tag}:${artifactKey(post)}`,
        source: `tag:${tag}`,
        target: `artifact:${artifactKey(post)}`,
      })),
    );

    return {
      nodes: [...tagNodes, ...artifactNodes],
      edges,
      tagCount: tagNodes.length,
      artifactCount: artifactNodes.length,
    };
  };

  return {
    getSections: () => sections,
    getSection: (slug) => sections.find((s) => s.slug === slug),
    getSources: (sectionSlug) => sources.filter((s) => s.sectionSlug === sectionSlug),
    getSource: (sectionSlug, sourceSlug) =>
      sources.find((s) => s.sectionSlug === sectionSlug && s.slug === sourceSlug),
    getPosts: publishedIn,
    getPost: (sectionSlug, sourceSlug, postSlug) =>
      publishedIn(sectionSlug, sourceSlug).find((p) => p.slug === postSlug),
    getDirectPosts: publishedDirect,
    getDirectPost: (sectionSlug, postSlug) =>
      publishedDirect(sectionSlug).find((p) => p.slug === postSlug),
    getTags: () => tags,
    getNowLearning: () =>
      sources
        .filter((s) => s.studyStatus === "ongoing")
        .sort((a, b) =>
          (b.lastActivity ?? b.startedAt ?? "").localeCompare(a.lastActivity ?? a.startedAt ?? ""),
        )
        .map((s) => ({
          kind: "source" as const,
          sectionSlug: s.sectionSlug,
          sourceSlug: s.slug,
          href: `/${s.sectionSlug}/${s.slug}`,
          title: s.name,
          detail: sections.find((sec) => sec.slug === s.sectionSlug)?.title ?? s.sectionSlug,
          lastActivity: s.lastActivity ?? s.startedAt ?? "",
          progress: s.progress,
        })),
    getTimelineEvents: timelineEvents,
    getKnowledgeGraph: knowledgeGraph,
  };
}

function artifactKey(post: Post): string {
  return post.sourceSlug
    ? `${post.sectionSlug}/${post.sourceSlug}/${post.slug}`
    : `${post.sectionSlug}/${post.slug}`;
}

function artifactHref(post: Post): string {
  return `/${artifactKey(post)}`;
}

function spread(index: number, total: number): number {
  if (total <= 1) return 320;
  return Math.round(80 + (index * 480) / (total - 1));
}
