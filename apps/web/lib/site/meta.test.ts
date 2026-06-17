import { describe, expect, it } from "vitest";
import { articleJsonLd, buildPostUrl, buildSectionUrl, buildSourceUrl, SITE_URL } from "./meta";

describe("buildPostUrl", () => {
  it("builds nested path for with_sources post", () => {
    expect(buildPostUrl("courses", "meu-curso", "aula-1")).toBe(
      `${SITE_URL}/courses/meu-curso/aula-1`,
    );
  });

  it("builds flat path for direct post (sourceSlug empty)", () => {
    expect(buildPostUrl("blog", "", "meu-post")).toBe(`${SITE_URL}/blog/meu-post`);
  });
});

describe("buildSourceUrl", () => {
  it("builds section/source path", () => {
    expect(buildSourceUrl("books", "ddia")).toBe(`${SITE_URL}/books/ddia`);
  });
});

describe("buildSectionUrl", () => {
  it("builds section path", () => {
    expect(buildSectionUrl("blog")).toBe(`${SITE_URL}/blog`);
  });
});

describe("articleJsonLd", () => {
  it("returns parseable JSON with required schema fields", () => {
    const json = articleJsonLd({
      title: "Meu Post",
      summary: "Resumo do post.",
      date: "2026-06-10",
      url: `${SITE_URL}/blog/meu-post`,
    });
    const parsed = JSON.parse(json);
    expect(parsed["@type"]).toBe("Article");
    expect(parsed.headline).toBe("Meu Post");
    expect(parsed.description).toBe("Resumo do post.");
    expect(parsed.datePublished).toBe("2026-06-10");
    expect(parsed.author["@type"]).toBe("Person");
  });

  it("omits description when summary is empty", () => {
    const json = articleJsonLd({ title: "Post", summary: "", date: "2026-06-10", url: "x" });
    const parsed = JSON.parse(json);
    expect("description" in parsed).toBe(false);
  });

  it("SEC-4: escapes < so </script> in title cannot break the JSON-LD script tag", () => {
    const json = articleJsonLd({
      title: "XSS </script><script>alert(1)</script>",
      summary: "",
      date: "2026-06-10",
      url: "x",
    });
    expect(json).not.toContain("</script>");
    // must still be parseable and round-trip correctly
    const parsed = JSON.parse(json);
    expect(parsed.headline).toBe("XSS </script><script>alert(1)</script>");
  });
});
