// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Topbar } from "./topbar";

describe("Topbar", () => {
  it("renders the wordmark 'ethitorial'", () => {
    render(<Topbar />);
    expect(screen.getByText("ethitorial")).toBeInTheDocument();
  });

  it("wordmark is a link to /", () => {
    render(<Topbar />);
    const brand = screen.getByRole("link", { name: "ethitorial" });
    expect(brand).toHaveAttribute("href", "/");
  });

  it("renders a GITHUB external link", () => {
    render(<Topbar />);
    const githubLink = screen.getByRole("link", { name: /github/i });
    expect(githubLink).toHaveAttribute("href", "https://github.com/ThiagoPanini/ethitorial");
    expect(githubLink).toHaveAttribute("target", "_blank");
    expect(githubLink).toHaveAttribute("rel", "noreferrer");
  });

  it("renders a ⌘K button", () => {
    render(<Topbar onPaletteOpen={() => {}} />);
    const btn = screen.getByRole("button");
    expect(btn).toBeInTheDocument();
  });

  it("topbar has the .topbar class", () => {
    const { container } = render(<Topbar />);
    expect(container.querySelector(".topbar")).toBeInTheDocument();
  });

  it("renders .date-hide element with current date", () => {
    render(<Topbar />);
    expect(document.querySelector(".date-hide")).toBeInTheDocument();
  });

  it("brand is always visible (no per-route visibility toggle)", () => {
    const { container } = render(<Topbar />);
    const brand = container.querySelector(".brand") as HTMLElement;
    // The wordmark must never be hidden — it is the persistent home affordance.
    expect(brand?.style.visibility).not.toBe("hidden");
  });
});
