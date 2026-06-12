// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommandPalette } from "./command-palette";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));

const ITEMS = [
  { href: "/timeline", title: "Cronologia", section: "Navegação", kind: "nav" as const },
  { href: "/blog/meu-post", title: "Meu Post", section: "Blog", kind: "post" as const },
  {
    href: "/courses/c/aula",
    title: "Aula com acentuação",
    section: "Cursos",
    kind: "post" as const,
  },
];

describe("CommandPalette", () => {
  beforeEach(() => mockPush.mockClear());

  it("renders the search input", () => {
    render(<CommandPalette items={ITEMS} onClose={() => {}} />);
    expect(screen.getByRole("textbox", { name: "Buscar" })).toBeInTheDocument();
  });

  it("shows all items when query is empty", () => {
    render(<CommandPalette items={ITEMS} onClose={() => {}} />);
    expect(screen.getByText("Cronologia")).toBeInTheDocument();
    expect(screen.getByText("Meu Post")).toBeInTheDocument();
  });

  it("shows empty state when query matches nothing", () => {
    render(<CommandPalette items={ITEMS} onClose={() => {}} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "xyznotfound" } });
    expect(screen.getByText("Nenhum resultado encontrado.")).toBeInTheDocument();
  });

  it("filters by title with accent normalization", () => {
    render(<CommandPalette items={ITEMS} onClose={() => {}} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "acentuacao" } });
    expect(screen.getByText("Aula com acentuação")).toBeInTheDocument();
    expect(screen.queryByText("Cronologia")).toBeNull();
  });

  it("groups results by section", () => {
    render(<CommandPalette items={ITEMS} onClose={() => {}} />);
    expect(screen.getByText("Navegação")).toBeInTheDocument();
    expect(screen.getByText("Blog")).toBeInTheDocument();
  });

  it("calls onClose on Escape key in the input", () => {
    const onClose = vi.fn();
    render(<CommandPalette items={ITEMS} onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("navigates and closes on Enter", () => {
    const onClose = vi.fn();
    render(<CommandPalette items={ITEMS} onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(mockPush).toHaveBeenCalledWith(ITEMS[0].href);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("ArrowDown moves selection to next item", () => {
    render(<CommandPalette items={ITEMS} onClose={() => {}} />);
    const buttons = screen.getAllByRole("button").filter((b) => b.className.includes("pal-item"));
    expect(buttons[0]).toHaveClass("sel");
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "ArrowDown" });
    expect(buttons[1]).toHaveClass("sel");
    expect(buttons[0]).not.toHaveClass("sel");
  });

  it("hover sets item as selected", () => {
    render(<CommandPalette items={ITEMS} onClose={() => {}} />);
    const buttons = screen.getAllByRole("button").filter((b) => b.className.includes("pal-item"));
    fireEvent.mouseEnter(buttons[2]);
    expect(buttons[2]).toHaveClass("sel");
  });
});
