import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadCatalog } from "./catalog";

const fixture = (name: string) => fileURLToPath(new URL(`./__fixtures__/${name}`, import.meta.url));

describe("loadCatalog — sections", () => {
  it("reads the declared sections ordered by `order`", () => {
    const catalog = loadCatalog(fixture("valid"));

    expect(catalog.getSections().map((s) => s.slug)).toEqual(["courses", "blog"]);

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

describe("loadCatalog — build-time validation", () => {
  it("throws when a post uses a tag outside tags.yml (invariante 9)", () => {
    expect(() => loadCatalog(fixture("invalid-tag"))).toThrow(/naoexiste/);
  });

  it("throws when a section slug collides with a reserved route word", () => {
    expect(() => loadCatalog(fixture("reserved-slug"))).toThrow(/about/);
  });
});
