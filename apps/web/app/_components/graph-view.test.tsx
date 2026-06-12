// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { KnowledgeGraph } from "@/lib/catalog";
import { GraphView } from "./graph-view";

const GRAPH: KnowledgeGraph = {
  tagCount: 1,
  artifactCount: 1,
  nodes: [
    { kind: "tag", id: "tag:ai", slug: "ai", label: "AI", x: 170, y: 320 },
    {
      kind: "artifact",
      id: "artifact:blog/post",
      slug: "post",
      sectionSlug: "blog",
      sourceSlug: "",
      label: "Post sobre AI",
      href: "/blog/post",
      x: 760,
      y: 320,
      radius: 10,
      reads: 0,
    },
  ],
  edges: [{ id: "edge:ai:blog/post", source: "tag:ai", target: "artifact:blog/post" }],
};

describe("GraphView", () => {
  it("renders a responsive SVG knowledge graph", () => {
    const { container } = render(<GraphView graph={GRAPH} />);

    expect(container.querySelector("svg.graph")).toHaveAttribute("viewBox", "0 0 1000 640");
    expect(screen.getByText("1 tag")).toBeInTheDocument();
    expect(screen.getByText("1 artefato")).toBeInTheDocument();
  });

  it("links artifact nodes to their reading route", () => {
    render(<GraphView graph={GRAPH} />);

    expect(screen.getByRole("link", { name: "Post sobre AI" })).toHaveAttribute(
      "href",
      "/blog/post",
    );
  });

  it("highlights the hovered node neighborhood", () => {
    const { container } = render(<GraphView graph={GRAPH} />);

    fireEvent.mouseEnter(screen.getByLabelText("AI"));

    expect(container.querySelector(".gedge.active")).toBeInTheDocument();
    expect(container.querySelectorAll(".gnode.active")).toHaveLength(2);
  });
});
