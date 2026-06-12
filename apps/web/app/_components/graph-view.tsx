"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { KnowledgeGraph, KnowledgeGraphArtifactNode, KnowledgeGraphNode } from "@/lib/catalog";

export function GraphView({ graph }: { graph: KnowledgeGraph }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const activeIds = useMemo(() => neighborhood(graph, hoveredId), [graph, hoveredId]);

  return (
    <div className="content-inner">
      <div className="page-head">
        <span className="page-eyebrow">Grafo · catálogo derivado</span>
        <h1 className="page-title">Grafo</h1>
        <p className="page-desc">
          Tags curadas e artefatos publicados, conectados por pertencimento e calculados a partir do
          catálogo MDX.
        </p>
      </div>

      <div className="graph-box">
        <div className="graph-legend">
          <span>
            <span className="sq" /> {graph.tagCount} {graph.tagCount === 1 ? "tag" : "tags"}
          </span>
          <span>
            <span className="ci" /> {graph.artifactCount}{" "}
            {graph.artifactCount === 1 ? "artefato" : "artefatos"}
          </span>
        </div>
        <svg aria-label="Grafo Tag para Artifact" className="graph" viewBox="0 0 1000 640">
          <title>Grafo Tag para Artifact</title>
          <g className="gedges">
            {graph.edges.map((edge) => (
              <line
                className={classNames("gedge", activeClass(edge.source, activeIds, hoveredId))}
                key={edge.id}
                x1={nodeById(graph, edge.source)?.x}
                x2={nodeById(graph, edge.target)?.x}
                y1={nodeById(graph, edge.source)?.y}
                y2={nodeById(graph, edge.target)?.y}
              />
            ))}
          </g>
          <g className="gnodes">
            {graph.nodes.map((node) =>
              node.kind === "artifact" ? (
                <ArtifactNode
                  activeIds={activeIds}
                  hoveredId={hoveredId}
                  key={node.id}
                  node={node}
                  setHoveredId={setHoveredId}
                />
              ) : (
                // biome-ignore lint/a11y/noStaticElementInteractions: SVG graph nodes need hover to light their edge neighborhood.
                <g
                  aria-label={node.label}
                  className={classNames(
                    "gnode tag-node",
                    activeClass(node.id, activeIds, hoveredId),
                  )}
                  key={node.id}
                  onMouseEnter={() => setHoveredId(node.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <rect height="16" width="16" x={node.x - 8} y={node.y - 8} />
                  <text x={node.x - 18} y={node.y + 4}>
                    {node.label}
                  </text>
                </g>
              ),
            )}
          </g>
        </svg>
      </div>
    </div>
  );
}

function ArtifactNode({
  activeIds,
  hoveredId,
  node,
  setHoveredId,
}: {
  activeIds: Set<string>;
  hoveredId: string | null;
  node: KnowledgeGraphArtifactNode;
  setHoveredId: (id: string | null) => void;
}) {
  return (
    <Link
      aria-label={node.label}
      className={classNames("gnode artifact-node", activeClass(node.id, activeIds, hoveredId))}
      href={node.href}
      onBlur={() => setHoveredId(null)}
      onFocus={() => setHoveredId(node.id)}
      onMouseEnter={() => setHoveredId(node.id)}
      onMouseLeave={() => setHoveredId(null)}
    >
      <circle cx={node.x} cy={node.y} r={node.radius} />
      <text x={node.x + node.radius + 10} y={node.y + 4}>
        {node.label}
      </text>
    </Link>
  );
}

function neighborhood(graph: KnowledgeGraph, hoveredId: string | null): Set<string> {
  const ids = new Set<string>();
  if (!hoveredId) return ids;

  ids.add(hoveredId);
  for (const edge of graph.edges) {
    if (edge.source === hoveredId) ids.add(edge.target);
    if (edge.target === hoveredId) ids.add(edge.source);
  }

  return ids;
}

function activeClass(id: string, activeIds: Set<string>, hoveredId: string | null): string {
  if (!hoveredId) return "";
  return activeIds.has(id) ? "active" : "dimmed";
}

function classNames(...parts: string[]): string {
  return parts.filter(Boolean).join(" ");
}

function nodeById(graph: KnowledgeGraph, id: string): KnowledgeGraphNode | undefined {
  return graph.nodes.find((node) => node.id === id);
}
