// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CopyButton } from "./copy-button";

describe("CopyButton", () => {
  it("renders a copy button", () => {
    render(<CopyButton getText={() => "code"} />);
    expect(screen.getByRole("button", { name: /cop/i })).toBeInTheDocument();
  });

  it("calls clipboard.writeText with the result of getText on click", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
    });
    render(<CopyButton getText={() => "const x = 1;"} />);
    fireEvent.click(screen.getByRole("button", { name: /cop/i }));
    expect(writeText).toHaveBeenCalledWith("const x = 1;");
  });

  it("shows a confirmation after copy", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
    });
    render(<CopyButton getText={() => "x"} />);
    fireEvent.click(screen.getByRole("button"));
    expect(await screen.findByText(/cop/i)).toBeInTheDocument();
  });
});
