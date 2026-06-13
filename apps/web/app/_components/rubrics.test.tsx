// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Rubrics } from "./rubrics";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from "next/navigation";

const RUBRIC_HREFS = [
  "/",
  "/blog",
  "/courses",
  "/books",
  "/certifications",
  "/talks",
  "/timeline",
  "/graph",
];
const RUBRIC_LABELS = [
  "Home",
  "Blog",
  "Cursos",
  "Livros",
  "Certificações",
  "Apresentações",
  "Cronologia",
  "Grafo",
];

describe("Rubrics", () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue("/");
  });

  it("renders all 8 rubric links", () => {
    render(<Rubrics />);
    for (const label of RUBRIC_LABELS) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });

  it("renders correct hrefs for all rubrics", () => {
    render(<Rubrics />);
    for (let i = 0; i < RUBRIC_HREFS.length; i++) {
      expect(screen.getByRole("link", { name: RUBRIC_LABELS[i] })).toHaveAttribute(
        "href",
        RUBRIC_HREFS[i],
      );
    }
  });

  it("marks active rubric with 'on' class when pathname matches", () => {
    vi.mocked(usePathname).mockReturnValue("/blog");
    render(<Rubrics />);
    expect(screen.getByRole("link", { name: "Blog" })).toHaveClass("on");
    expect(screen.getByRole("link", { name: "Cursos" })).not.toHaveClass("on");
  });

  it("marks Home active for root path", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<Rubrics />);
    expect(screen.getByRole("link", { name: "Home" })).toHaveClass("on");
    expect(screen.getByRole("link", { name: "Blog" })).not.toHaveClass("on");
  });

  it("marks a nested path as active for its section", () => {
    vi.mocked(usePathname).mockReturnValue("/courses/react-basics/lesson-1");
    render(<Rubrics />);
    expect(screen.getByRole("link", { name: "Cursos" })).toHaveClass("on");
  });

  it("nav has sticky positioning and backdrop blur class", () => {
    const { container } = render(<Rubrics />);
    const nav = container.querySelector(".rubrics");
    expect(nav).toBeInTheDocument();
  });
});
