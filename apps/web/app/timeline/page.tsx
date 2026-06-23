import { AppShell } from "@/app/_components/app-shell";
import { TimelineView } from "@/app/_components/timeline-view";
import { getCatalog } from "@/lib/catalog";

export const metadata = { title: "Cronologia · ethitorial" };

export default function TimelinePage() {
  const catalog = getCatalog();
  const events = catalog.getTimelineEvents();

  return (
    <AppShell>
      <TimelineView events={events} />
    </AppShell>
  );
}
