import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadCatalog } from "./catalog";

const fixture = (name: string) => fileURLToPath(new URL(`./__fixtures__/${name}`, import.meta.url));

describe("loadCatalog — sections", () => {
  it("reads the declared sections ordered by `order`", () => {
    const catalog = loadCatalog(fixture("valid"));

    expect(catalog.getSections().map((s) => s.slug)).toEqual([
      "courses",
      "blog",
      "books",
      "certifications",
    ]);

    const courses = catalog.getSection("courses");
    expect(courses).toMatchObject({
      slug: "courses",
      title: "Courses",
      kind: "with_sources",
      order: 1,
    });
  });
});

describe("loadCatalog — sources", () => {
  it("reads a Source under a `with_sources` section", () => {
    const catalog = loadCatalog(fixture("valid"));

    expect(catalog.getSources("courses").map((s) => s.slug)).toEqual(["aihero"]);

    const aihero = catalog.getSource("courses", "aihero");
    expect(aihero).toMatchObject({
      slug: "aihero",
      sectionSlug: "courses",
      name: "AI Hero",
      externalUrl: "https://aihero.dev",
      author: "Matt Pocock",
      description: "Curso sobre construir aplicações de IA em produção.",
      cover: "cover.webp",
      authorAvatar: "matt.webp",
    });
  });
});

describe("loadCatalog — posts", () => {
  it("lists published posts ordered by date desc", () => {
    const catalog = loadCatalog(fixture("valid"));

    expect(catalog.getPosts("courses", "aihero").map((p) => p.slug)).toEqual([
      "primeiras-impressoes",
      "setup-inicial",
    ]);
  });

  it("uses slug as deterministic tiebreaker for posts with the same date", () => {
    const root = mkdtempSync(join(tmpdir(), "ethitorial-catalog-order-"));
    try {
      writeFileSync(
        join(root, "sections.yml"),
        `- slug: courses
  title: Courses
  kind: with_sources
  order: 1
  description: "Cursos."
`,
      );
      writeFileSync(
        join(root, "tags.yml"),
        `- slug: ai
  label: "AI"
`,
      );
      mkdirSync(join(root, "courses", "aihero"), { recursive: true });
      writeFileSync(
        join(root, "courses", "aihero", "source.yml"),
        `name: "AI Hero"
external_url: "https://aihero.dev"
author: "Matt Pocock"
description: "Curso."
`,
      );
      writeFileSync(
        join(root, "courses", "aihero", "b-post.mdx"),
        `---
title: "B Post"
date: 2026-06-13
status: published
tags: [ai]
summary: "Segundo no desempate."
---

B.
`,
      );
      writeFileSync(
        join(root, "courses", "aihero", "a-post.mdx"),
        `---
title: "A Post"
date: 2026-06-13
status: published
tags: [ai]
summary: "Primeiro no desempate."
---

A.
`,
      );

      const catalog = loadCatalog(root);

      expect(catalog.getPosts("courses", "aihero").map((p) => p.slug)).toEqual([
        "a-post",
        "b-post",
      ]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("honors the Source post_order over date for reading sequence", () => {
    const root = mkdtempSync(join(tmpdir(), "ethitorial-catalog-postorder-"));
    try {
      writeFileSync(
        join(root, "sections.yml"),
        `- slug: courses
  title: Courses
  kind: with_sources
  order: 1
  description: "Cursos."
`,
      );
      writeFileSync(join(root, "tags.yml"), `- slug: ai\n  label: "AI"\n`);
      mkdirSync(join(root, "courses", "aihero"), { recursive: true });
      // Os três Posts compartilham a mesma data real de escrita; a sequência de
      // leitura vem só do post_order, não de datas forçadas.
      writeFileSync(
        join(root, "courses", "aihero", "source.yml"),
        `name: "AI Hero"
external_url: "https://aihero.dev"
author: "Matt Pocock"
description: "Curso."
post_order:
  - intro
  - meio
  - fim
`,
      );
      for (const slug of ["fim", "intro", "meio"]) {
        writeFileSync(
          join(root, "courses", "aihero", `${slug}.mdx`),
          `---\ntitle: "${slug}"\ndate: 2026-06-22\nstatus: published\ntags: [ai]\nsummary: "Mesmo dia."\n---\n\n${slug}.\n`,
        );
      }

      const catalog = loadCatalog(root);

      // Listagem newest-first: o último da sequência de leitura aparece primeiro.
      expect(catalog.getPosts("courses", "aihero").map((p) => p.slug)).toEqual([
        "fim",
        "meio",
        "intro",
      ]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("excludes draft posts from the listing (invariante 6)", () => {
    const catalog = loadCatalog(fixture("valid"));

    expect(catalog.getPosts("courses", "aihero").map((p) => p.slug)).not.toContain("rascunho");
  });

  it("returns a published post with frontmatter and raw MDX body", () => {
    const catalog = loadCatalog(fixture("valid"));

    const post = catalog.getPost("courses", "aihero", "primeiras-impressoes");
    expect(post).toMatchObject({
      slug: "primeiras-impressoes",
      title: "Primeiras impressões",
      date: "2026-06-05",
      status: "published",
      tags: ["ai", "typescript"],
    });
    expect(post?.body).toContain("AI Hero");
  });

  it("returns undefined for a draft post slug (route should 404)", () => {
    const catalog = loadCatalog(fixture("valid"));

    expect(catalog.getPost("courses", "aihero", "rascunho")).toBeUndefined();
  });
});

describe("loadCatalog — direct posts", () => {
  it("lists published direct posts ordered by date desc", () => {
    const catalog = loadCatalog(fixture("valid"));

    const posts = catalog.getDirectPosts("blog");
    expect(posts.map((p) => p.slug)).toEqual(["primeiro-post", "segundo-post"]);
  });

  it("excludes draft direct posts (invariante 6)", () => {
    const catalog = loadCatalog(fixture("valid"));

    const posts = catalog.getDirectPosts("blog");
    expect(posts.map((p) => p.slug)).not.toContain("rascunho-blog");
  });

  it("returns a direct post by slug", () => {
    const catalog = loadCatalog(fixture("valid"));

    const post = catalog.getDirectPost("blog", "primeiro-post");
    expect(post).toMatchObject({
      slug: "primeiro-post",
      sectionSlug: "blog",
      sourceSlug: "",
      title: "Primeiro Post do Blog",
      status: "published",
    });
  });

  it("returns undefined for unknown direct post slug", () => {
    const catalog = loadCatalog(fixture("valid"));

    expect(catalog.getDirectPost("blog", "nao-existe")).toBeUndefined();
  });
});

describe("loadCatalog — books and certifications (with_sources, invariante 16)", () => {
  it("loads a book Source with no posts (Source sem Post é válido)", () => {
    const catalog = loadCatalog(fixture("valid"));

    const sources = catalog.getSources("books");
    expect(sources.map((s) => s.slug)).toEqual(["ddia"]);
    expect(sources[0]).toMatchObject({ slug: "ddia", sectionSlug: "books" });
    expect(catalog.getPosts("books", "ddia")).toEqual([]);
  });

  it("loads a certification Source with no posts", () => {
    const catalog = loadCatalog(fixture("valid"));

    const sources = catalog.getSources("certifications");
    expect(sources.map((s) => s.slug)).toEqual(["aws-saa-c03"]);
    expect(sources[0]).toMatchObject({ slug: "aws-saa-c03", sectionSlug: "certifications" });
    expect(catalog.getPosts("certifications", "aws-saa-c03")).toEqual([]);
  });
});

describe("loadCatalog — study_status / Now Learning (D1)", () => {
  it("loads study_status, startedAt, lastActivity from source.yml (no numeric progress)", () => {
    const catalog = loadCatalog(fixture("valid"));
    const aihero = catalog.getSource("courses", "aihero");
    expect(aihero).toMatchObject({
      studyStatus: "ongoing",
      startedAt: "2026-01-15",
      lastActivity: "2026-06-01",
    });
    // progress field must not exist in domain
    expect((aihero as unknown as Record<string, unknown>)?.progress).toBeUndefined();
  });

  it("getNowLearning returns ongoing sources ordered by derived lastActivity desc", () => {
    const catalog = loadCatalog(fixture("valid"));
    const items = catalog.getNowLearning();
    expect(items.map((i) => i.sourceSlug)).toEqual(["aihero", "ddia"]);
  });

  it("getNowLearning items have sectionLabel, no progress, lastActivity from most recent post", () => {
    const catalog = loadCatalog(fixture("valid"));
    const [first] = catalog.getNowLearning();
    expect(first).toMatchObject({
      kind: "source",
      href: "/courses/aihero",
      title: "AI Hero",
      sectionLabel: "Courses",
      // lastActivity derived from most recent published post (primeiras-impressoes: 2026-06-05)
      lastActivity: "2026-06-05",
    });
    expect((first as unknown as Record<string, unknown>)?.progress).toBeUndefined();
  });

  it("getNowLearning: source with no posts falls back to source.lastActivity", () => {
    const catalog = loadCatalog(fixture("valid"));
    const items = catalog.getNowLearning();
    const ddia = items.find((i) => i.sourceSlug === "ddia");
    expect(ddia?.lastActivity).toBe("2026-05-10");
  });

  it("getNowLearning excludes sources with no study_status or concluded", () => {
    const catalog = loadCatalog(fixture("valid"));
    const slugs = catalog.getNowLearning().map((i) => i.sourceSlug);
    expect(slugs).not.toContain("aws-saa-c03");
  });
});

describe("loadCatalog — Timeline (D2)", () => {
  it("derives publication, note, start, and conquest events ordered newest first", () => {
    const catalog = loadCatalog(fixture("valid"));

    expect(catalog.getTimelineEvents().map((event) => `${event.type}:${event.label}`)).toEqual([
      "publication:Primeiro Post do Blog",
      "note:Primeiras impressões",
      "publication:Segundo Post do Blog",
      "note:Setup inicial",
      "start:Designing Data-Intensive Applications",
      "conquest:AWS Solutions Architect Associate (SAA-C03)",
      "start:AI Hero",
    ]);
  });
});

describe("loadCatalog — presentations (C5)", () => {
  it("loads published Presentations with stable slide order", () => {
    const catalog = loadCatalog(fixture("valid"));
    const [presentation] = catalog.getPresentations();

    expect(presentation).toMatchObject({
      slug: "ethitorial-visao",
      sectionSlug: "presentations",
      title: "ethitorial — visão e arquitetura",
      status: "published",
    });
    expect(presentation.slides.map((slide) => slide.order)).toEqual([1, 2]);
    expect(presentation.slides[0]?.title).toBe("ethitorial");
  });

  it("returns a presentation by slug", () => {
    const catalog = loadCatalog(fixture("valid"));

    expect(catalog.getPresentation("ethitorial-visao")?.slides).toHaveLength(2);
  });
});

describe("loadCatalog — Knowledge Graph (D3)", () => {
  it("derives tag and published artifact nodes with membership edges", () => {
    const catalog = loadCatalog(fixture("valid"));
    const graph = catalog.getKnowledgeGraph();

    expect(graph.nodes.filter((node) => node.kind === "tag").map((node) => node.id)).toEqual([
      "tag:ai",
      "tag:typescript",
    ]);
    expect(graph.nodes.filter((node) => node.kind === "artifact").map((node) => node.id)).toEqual([
      "artifact:blog/primeiro-post",
      "artifact:blog/segundo-post",
      "artifact:courses/aihero/primeiras-impressoes",
      "artifact:courses/aihero/setup-inicial",
    ]);
    expect(graph.edges.map((edge) => `${edge.source}->${edge.target}`)).toEqual([
      "tag:ai->artifact:blog/primeiro-post",
      "tag:ai->artifact:blog/segundo-post",
      "tag:ai->artifact:courses/aihero/primeiras-impressoes",
      "tag:typescript->artifact:courses/aihero/primeiras-impressoes",
      "tag:ai->artifact:courses/aihero/setup-inicial",
    ]);
  });

  it("uses deterministic coordinates for the same catalog input", () => {
    const graphA = loadCatalog(fixture("valid")).getKnowledgeGraph();
    const graphB = loadCatalog(fixture("valid")).getKnowledgeGraph();

    expect(graphA.nodes.map(({ id, x, y }) => ({ id, x, y }))).toEqual(
      graphB.nodes.map(({ id, x, y }) => ({ id, x, y })),
    );
  });
});

describe("loadCatalog — missing content directories", () => {
  it("returns empty list when a with_sources section directory does not exist", () => {
    const catalog = loadCatalog(fixture("missing-dir"));
    expect(catalog.getSources("courses")).toEqual([]);
  });

  it("returns empty list when a direct section directory does not exist", () => {
    const catalog = loadCatalog(fixture("missing-dir"));
    expect(catalog.getDirectPosts("blog")).toEqual([]);
  });

  it("does not throw when loading catalog with missing content directories", () => {
    expect(() => loadCatalog(fixture("missing-dir"))).not.toThrow();
  });
});

describe("loadCatalog — build-time validation", () => {
  it("throws when a post uses a tag outside tags.yml (invariante 9)", () => {
    expect(() => loadCatalog(fixture("invalid-tag"))).toThrow(/naoexiste/);
  });

  it("throws when a section slug collides with a reserved route word", () => {
    expect(() => loadCatalog(fixture("reserved-slug"))).toThrow(/about/);
  });
});
