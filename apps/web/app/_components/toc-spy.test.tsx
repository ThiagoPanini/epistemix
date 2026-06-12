// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TocSpy } from "./toc-spy";

const HEADINGS = [
  { id: "introducao", level: 2 as const, text: "Introdução" },
  { id: "contexto", level: 2 as const, text: "Contexto" },
  { id: "detalhes", level: 3 as const, text: "Detalhes" },
];

describe("TocSpy", () => {
  it("renders a link for each heading", () => {
    render(<TocSpy headings={HEADINGS} />);
    expect(screen.getByRole("link", { name: "Introdução" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Contexto" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Detalhes" })).toBeInTheDocument();
  });

  it("each link points to the heading anchor", () => {
    render(<TocSpy headings={HEADINGS} />);
    expect(screen.getByRole("link", { name: "Introdução" })).toHaveAttribute("href", "#introducao");
    expect(screen.getByRole("link", { name: "Detalhes" })).toHaveAttribute("href", "#detalhes");
  });

  it("renders h3 headings with deeper indentation class", () => {
    render(<TocSpy headings={HEADINGS} />);
    const h3Link = screen.getByRole("link", { name: "Detalhes" });
    expect(h3Link.dataset.level).toBe("3");
  });

  it("renders the CONTEÚDO label", () => {
    render(<TocSpy headings={HEADINGS} />);
    expect(screen.getByText("CONTEÚDO")).toBeInTheDocument();
  });
});
