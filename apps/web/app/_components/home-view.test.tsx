// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeView } from "./home-view";

const DIRECT_POST = {
  slug: "meu-post",
  sectionSlug: "blog",
  sourceSlug: "",
  title: "Meu Post Incrível",
  date: "2026-06-10",
  summary: "Um resumo do post.",
  readTime: "2 min",
};

const COURSE_POST = {
  slug: "aula-1",
  sectionSlug: "courses",
  sourceSlug: "meu-curso",
  sourceName: "AI CODING FOR REAL ENGINEERS",
  title: "Aula 1 — Introdução",
  date: "2026-06-08",
  summary: "Resumo da aula.",
  readTime: "3 min",
};

const SOURCE_POST = {
  slug: "aula-1",
  sectionSlug: "courses",
  sourceSlug: "meu-curso",
  title: "Aula 1 — Introdução",
  date: "2026-06-08",
  summary: "",
  readTime: "3 min",
};

const SECTIONS = [
  { slug: "courses", title: "Cursos", description: "Notas de cursos.", count: 2 },
  { slug: "blog", title: "Blog", description: "Posts soltos.", count: 1 },
];

describe("HomeView", () => {
  it("renders the masthead wordmark as h1", () => {
    render(<HomeView featured={null} latest={[]} sections={[]} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("ethitorial");
  });

  it("renders featured post title with link to direct path", () => {
    render(<HomeView featured={DIRECT_POST} latest={[]} sections={[]} />);
    const link = screen.getByRole("link", { name: "Meu Post Incrível" });
    expect(link).toHaveAttribute("href", "/blog/meu-post");
  });

  it("renders featured with_sources post link to nested path", () => {
    render(<HomeView featured={SOURCE_POST} latest={[]} sections={[]} />);
    const link = screen.getByRole("link", { name: "Aula 1 — Introdução" });
    expect(link).toHaveAttribute("href", "/courses/meu-curso/aula-1");
  });

  it("renders featured post summary as standfirst", () => {
    render(<HomeView featured={DIRECT_POST} latest={[]} sections={[]} />);
    expect(screen.getByText("Um resumo do post.")).toBeInTheDocument();
  });

  it("renders latest entries list", () => {
    render(<HomeView featured={DIRECT_POST} latest={[SOURCE_POST]} sections={[]} />);
    expect(screen.getByText("Aula 1 — Introdução")).toBeInTheDocument();
  });

  it("renders sections with zero-padded UPPERCASE count", () => {
    render(<HomeView featured={null} latest={[]} sections={SECTIONS} />);
    expect(screen.getByText("Cursos")).toBeInTheDocument();
    expect(screen.getByText("02 ENTRADAS")).toBeInTheDocument();
    expect(screen.getByText("01 ENTRADA")).toBeInTheDocument();
  });

  it("renders .ed span in mast-rule with month and year", () => {
    render(<HomeView featured={null} latest={[]} sections={[]} />);
    const ed = document.querySelector(".mast-rule .ed");
    expect(ed).toBeInTheDocument();
    expect(ed?.textContent).toMatch(/\d{4}/);
  });

  it("lat-m shows section before date", () => {
    render(<HomeView featured={DIRECT_POST} latest={[DIRECT_POST]} sections={[]} />);
    const latM = document.querySelector(".lat-m");
    expect(latM?.textContent).toMatch(/^BLOG/);
  });

  it("renders without featured gracefully (no btn-read)", () => {
    render(<HomeView featured={null} latest={[]} sections={[]} />);
    expect(screen.queryByRole("link", { name: /Ler o post/ })).toBeNull();
  });
});

describe("HomeView — kicker de domínio", () => {
  it("courses kicker shows EM DESTAQUE · NOTA DE CURSO · <source>", () => {
    render(<HomeView featured={COURSE_POST} latest={[]} sections={[]} />);
    expect(screen.getByText(/NOTA DE CURSO/)).toBeInTheDocument();
    expect(screen.getByText(/AI CODING FOR REAL ENGINEERS/)).toBeInTheDocument();
  });

  it("blog kicker shows EM DESTAQUE · BLOG", () => {
    render(<HomeView featured={DIRECT_POST} latest={[]} sections={[]} />);
    expect(screen.getByText(/EM DESTAQUE · BLOG/)).toBeInTheDocument();
  });

  it("kicker uses 'REVIEW' for books section", () => {
    const bookPost = { ...COURSE_POST, sectionSlug: "books", sourceName: "DDIA" };
    render(<HomeView featured={bookPost} latest={[]} sections={[]} />);
    expect(screen.getByText(/REVIEW/)).toBeInTheDocument();
  });

  it("kicker uses 'ANOTAÇÃO' for certifications section", () => {
    const certPost = { ...COURSE_POST, sectionSlug: "certifications", sourceName: "AWS SAA" };
    render(<HomeView featured={certPost} latest={[]} sections={[]} />);
    expect(screen.getByText(/ANOTAÇÃO/)).toBeInTheDocument();
  });
});

describe("HomeView — MetaLine no destaque", () => {
  it("renders MetaLine with reads and votes", () => {
    render(<HomeView featured={COURSE_POST} latest={[]} sections={[]} />);
    expect(screen.getByText(/leituras/)).toBeInTheDocument();
    expect(screen.getByText(/↑/)).toBeInTheDocument();
  });

  it("omits 0 comments from MetaLine", () => {
    render(<HomeView featured={COURSE_POST} latest={[]} sections={[]} />);
    expect(screen.queryByText(/comentário/)).toBeNull();
  });

  it("keeps date, reading time, reads and votes on a single metaline row", () => {
    render(<HomeView featured={COURSE_POST} latest={[]} sections={[]} />);
    // A single .metaline carries every indicator (no second stacked row).
    const metalines = document.querySelectorAll(".lead .metaline");
    expect(metalines).toHaveLength(1);
    const text = metalines[0]?.textContent ?? "";
    expect(text).toMatch(/de leitura/);
    expect(text).toMatch(/leituras/);
    expect(text).toMatch(/↑/);
  });

  it("renders the featured tags as a tagrow before the read button", () => {
    const tagged = {
      ...COURSE_POST,
      tags: [
        { slug: "ai", label: "IA" },
        { slug: "typescript", label: "TypeScript" },
      ],
    };
    render(<HomeView featured={tagged} latest={[]} sections={[]} />);
    const tagrow = document.querySelector(".lead .tagrow");
    expect(tagrow).toBeInTheDocument();
    const ia = screen.getByRole("link", { name: "IA" });
    expect(ia).toHaveAttribute("href", "/tags/ai");
    expect(screen.getByRole("link", { name: "TypeScript" })).toHaveAttribute(
      "href",
      "/tags/typescript",
    );
  });
});

const NOW_LEARNING = [
  {
    kind: "source" as const,
    sectionSlug: "courses",
    sourceSlug: "aihero",
    href: "/courses/aihero",
    title: "AI Hero",
    sectionLabel: "Courses",
    detail: "Foco em streaming e tool use",
    lastActivity: "2026-06-05",
  },
  {
    kind: "source" as const,
    sectionSlug: "books",
    sourceSlug: "ddia",
    href: "/books/ddia",
    title: "Designing Data-Intensive Applications",
    sectionLabel: "Livros",
    detail: undefined,
    lastActivity: "2026-05-10",
  },
];

describe("HomeView — Agora Estudando", () => {
  it("renders AGORA ESTUDANDO header when items provided", () => {
    render(<HomeView featured={null} latest={[]} sections={[]} nowLearning={NOW_LEARNING} />);
    expect(screen.getByText(/AGORA ESTUDANDO/i)).toBeInTheDocument();
  });

  it("renders each item with title as link", () => {
    render(<HomeView featured={null} latest={[]} sections={[]} nowLearning={NOW_LEARNING} />);
    const link = screen.getByRole("link", { name: /AI Hero/ });
    expect(link).toHaveAttribute("href", "/courses/aihero");
  });

  it("renders sectionLabel in the card", () => {
    render(<HomeView featured={null} latest={[]} sections={[]} nowLearning={NOW_LEARNING} />);
    expect(screen.getByText(/Courses/)).toBeInTheDocument();
  });

  it("renders optional detail when provided", () => {
    render(<HomeView featured={null} latest={[]} sections={[]} nowLearning={NOW_LEARNING} />);
    expect(screen.getByText(/Foco em streaming e tool use/)).toBeInTheDocument();
  });

  it("does not render numeric progress anywhere", () => {
    render(<HomeView featured={null} latest={[]} sections={[]} nowLearning={NOW_LEARNING} />);
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it("hides Agora Estudando section when empty", () => {
    render(<HomeView featured={null} latest={[]} sections={[]} nowLearning={[]} />);
    expect(screen.queryByText(/AGORA ESTUDANDO/i)).toBeNull();
  });

  it("hides Agora Estudando section when prop is omitted", () => {
    render(<HomeView featured={null} latest={[]} sections={[]} />);
    expect(screen.queryByText(/AGORA ESTUDANDO/i)).toBeNull();
  });
});
