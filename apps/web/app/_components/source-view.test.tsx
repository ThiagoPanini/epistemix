// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Post, Source } from "@/lib/catalog";
import { SourceView } from "./source-view";

const MOCK_SOURCE: Source = {
  slug: "ai-hero",
  sectionSlug: "courses",
  name: "AI Hero",
  externalUrl: "https://aihero.dev",
  author: "Matt Pocock",
  description: "Curso sobre IA em produção.",
};

const MOCK_POSTS: Post[] = [
  {
    slug: "primeiras-impressoes",
    sectionSlug: "courses",
    sourceSlug: "ai-hero",
    title: "Primeiras impressões",
    date: "2026-06-01",
    status: "published",
    tags: ["ai"],
    summary: "Resumo do primeiro módulo.",
    body: "# Conteúdo",
  },
  {
    slug: "janela-de-contexto",
    sectionSlug: "courses",
    sourceSlug: "ai-hero",
    title: "Janela de contexto",
    date: "2026-06-05",
    status: "published",
    tags: ["ai"],
    summary: "Sobre a janela de contexto dos LLMs.",
    body: "# Contexto",
  },
];

describe("SourceView", () => {
  it("renders the source name as heading", () => {
    render(<SourceView source={MOCK_SOURCE} posts={MOCK_POSTS} sectionSlug="courses" />);
    expect(screen.getByRole("heading", { name: "AI Hero" })).toBeInTheDocument();
  });

  it("renders the author name", () => {
    render(<SourceView source={MOCK_SOURCE} posts={MOCK_POSTS} sectionSlug="courses" />);
    expect(screen.getByText(/Matt Pocock/)).toBeInTheDocument();
  });

  it("renders a note-row for each post", () => {
    const { container } = render(
      <SourceView source={MOCK_SOURCE} posts={MOCK_POSTS} sectionSlug="courses" />,
    );
    expect(container.querySelectorAll(".note-row")).toHaveLength(2);
  });

  it("each note-row links to the correct post path", () => {
    render(<SourceView source={MOCK_SOURCE} posts={MOCK_POSTS} sectionSlug="courses" />);
    expect(screen.getByRole("link", { name: /Primeiras impressões/ })).toHaveAttribute(
      "href",
      "/courses/ai-hero/primeiras-impressoes",
    );
    expect(screen.getByRole("link", { name: /Janela de contexto/ })).toHaveAttribute(
      "href",
      "/courses/ai-hero/janela-de-contexto",
    );
  });

  it("shows numbered index for each note", () => {
    const { container } = render(
      <SourceView source={MOCK_SOURCE} posts={MOCK_POSTS} sectionSlug="courses" />,
    );
    const indices = container.querySelectorAll(".note-idx");
    expect(indices).toHaveLength(2);
    expect(indices[0]).toHaveTextContent("01");
    expect(indices[1]).toHaveTextContent("02");
  });

  it("links to external source url", () => {
    render(<SourceView source={MOCK_SOURCE} posts={MOCK_POSTS} sectionSlug="courses" />);
    const externalLink = screen.getByRole("link", { name: /aihero\.dev/i });
    expect(externalLink).toHaveAttribute("href", "https://aihero.dev");
    expect(externalLink).toHaveAttribute("target", "_blank");
  });
});
