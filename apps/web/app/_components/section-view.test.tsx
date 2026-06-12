// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Source } from "@/lib/catalog";
import { SectionWithSourcesView } from "./section-view";

const MOCK_SECTION = {
  slug: "courses",
  title: "Cursos",
  kind: "with_sources" as const,
  order: 1,
  description: "Cursos que estou fazendo.",
};

const MOCK_SOURCES: (Source & { postCount: number })[] = [
  {
    slug: "ai-hero",
    sectionSlug: "courses",
    name: "AI Hero",
    externalUrl: "https://aihero.dev",
    author: "Matt Pocock",
    description: "Curso sobre IA em produção.",
    postCount: 3,
  },
  {
    slug: "rust-course",
    sectionSlug: "courses",
    name: "The Rust Course",
    externalUrl: "https://example.com",
    author: "Jon Gjengset",
    description: "Curso de Rust avançado.",
    postCount: 5,
  },
];

describe("SectionWithSourcesView", () => {
  it("renders a source card for each source", () => {
    render(<SectionWithSourcesView section={MOCK_SECTION} sources={MOCK_SOURCES} />);
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("each card links to the correct source path", () => {
    render(<SectionWithSourcesView section={MOCK_SECTION} sources={MOCK_SOURCES} />);
    expect(screen.getByRole("link", { name: /AI Hero/ })).toHaveAttribute(
      "href",
      "/courses/ai-hero",
    );
    expect(screen.getByRole("link", { name: /The Rust Course/ })).toHaveAttribute(
      "href",
      "/courses/rust-course",
    );
  });

  it("shows source name and description on each card", () => {
    render(<SectionWithSourcesView section={MOCK_SECTION} sources={MOCK_SOURCES} />);
    expect(screen.getByText("AI Hero")).toBeInTheDocument();
    expect(screen.getByText("Curso sobre IA em produção.")).toBeInTheDocument();
    expect(screen.getByText("The Rust Course")).toBeInTheDocument();
  });

  it("shows note count on each card", () => {
    render(<SectionWithSourcesView section={MOCK_SECTION} sources={MOCK_SOURCES} />);
    expect(screen.getByText(/3 notas/)).toBeInTheDocument();
    expect(screen.getByText(/5 notas/)).toBeInTheDocument();
  });

  it("renders section page header with title", () => {
    const { container } = render(
      <SectionWithSourcesView section={MOCK_SECTION} sources={MOCK_SOURCES} />,
    );
    expect(container.querySelector(".page-head h1")).toHaveTextContent("Cursos");
  });
});
