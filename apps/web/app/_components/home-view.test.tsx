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
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("epistemix");
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

  it("renders sections with name and count", () => {
    render(<HomeView featured={null} latest={[]} sections={SECTIONS} />);
    expect(screen.getByText("Cursos")).toBeInTheDocument();
    expect(screen.getByText("2 entradas")).toBeInTheDocument();
    expect(screen.getByText("1 entrada")).toBeInTheDocument();
  });

  it("renders without featured gracefully (no btn-read)", () => {
    render(<HomeView featured={null} latest={[]} sections={[]} />);
    expect(screen.queryByRole("link", { name: /Ler o post/ })).toBeNull();
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
