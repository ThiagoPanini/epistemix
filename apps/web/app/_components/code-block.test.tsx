// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CodeBlock } from "./code-block";

describe("CodeBlock", () => {
  it("renders children inside a pre element", () => {
    const { container } = render(
      <CodeBlock>
        <code>const x = 1;</code>
      </CodeBlock>,
    );
    expect(container.querySelector("pre")).toBeInTheDocument();
    expect(container.querySelector("code")).toBeInTheDocument();
  });

  it("renders a copy button", () => {
    render(
      <CodeBlock>
        <code>const x = 1;</code>
      </CodeBlock>,
    );
    expect(screen.getByRole("button", { name: /cop/i })).toBeInTheDocument();
  });

  it("copy button copies code text", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
    });
    render(
      <CodeBlock>
        <code>const answer = 42;</code>
      </CodeBlock>,
    );
    fireEvent.click(screen.getByRole("button", { name: /cop/i }));
    expect(writeText).toHaveBeenCalledWith("const answer = 42;");
  });
});
