import { AppShell } from "@/app/_components/app-shell";
import { GraphView } from "@/app/_components/graph-view";
import { getCatalog } from "@/lib/catalog";

export const metadata = { title: "Grafo · epistemix" };

export default function GraphPage() {
  const graph = getCatalog().getKnowledgeGraph();

  return (
    <AppShell>
      <GraphView graph={graph} />
    </AppShell>
  );
}
