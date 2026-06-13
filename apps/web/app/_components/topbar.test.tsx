// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Topbar } from "./topbar";

describe("Topbar", () => {
  it("renders the wordmark 'epistemix'", () => {
    render(<Topbar />);
    expect(screen.getByText("epistemix")).toBeInTheDocument();
  });

  it("wordmark is a link to /", () => {
    render(<Topbar />);
    const brand = screen.getByRole("link", { name: "epistemix" });
    expect(brand).toHaveAttribute("href", "/");
  });

  it("renders a GITHUB external link", () => {
    render(<Topbar />);
    const githubLink = screen.getByRole("link", { name: /github/i });
    expect(githubLink).toHaveAttribute("href", "https://github.com/ThiagoPanini/epistemix");
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

  it("does not render a date in the topbar", () => {
    render(<Topbar />);
    const topbarIn = document.querySelector(".topbar-in");
    expect(topbarIn).toBeInTheDocument();
    // date-hide element should not exist
    expect(document.querySelector(".date-hide")).not.toBeInTheDocument();
  });
});
