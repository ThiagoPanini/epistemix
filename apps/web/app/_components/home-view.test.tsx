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
