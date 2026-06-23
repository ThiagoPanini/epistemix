// @vitest-environment happy-dom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn().mockReturnValue("/"),
  useRouter: vi.fn().mockReturnValue({ push: vi.fn() }),
}));

import { AppShell } from "./app-shell";

describe("AppShell", () => {
  it("renders children content", () => {
    render(
      <AppShell>
        <main>Hello world</main>
      </AppShell>,
    );
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders the topbar with ethitorial wordmark", () => {
    render(
      <AppShell>
        <div />
      </AppShell>,
    );
    expect(screen.getByText("ethitorial")).toBeInTheDocument();
  });

  it("renders the rubrics nav with all 8 sections", () => {
    render(
      <AppShell>
        <div />
      </AppShell>,
    );
    expect(screen.getByRole("link", { name: "Blog" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cursos" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Grafo" })).toBeInTheDocument();
  });

  it("renders the footer", () => {
    const { container } = render(
      <AppShell>
        <div />
      </AppShell>,
    );
    expect(container.querySelector(".foot")).toBeInTheDocument();
  });

  it("passes motion attribute to body wrapper", () => {
    const { container } = render(
      <AppShell>
        <div />
      </AppShell>,
    );
    const wrapper = container.querySelector("[data-motion]");
    expect(wrapper).toBeInTheDocument();
  });

  it("does not open command palette while player is open", () => {
    render(
      <AppShell>
        <div />
      </AppShell>,
    );

    act(() => {
      window.dispatchEvent(new CustomEvent("epx:player-state", { detail: { open: true } }));
    });
    fireEvent.keyDown(window, { key: "k", metaKey: true });

    expect(screen.queryByRole("dialog", { name: "Paleta de comandos" })).not.toBeInTheDocument();
  });
});
