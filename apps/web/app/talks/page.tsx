import Link from "next/link";
import { AppShell } from "@/app/_components/app-shell";
import { getCatalog } from "@/lib/catalog";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Palestras · ethitorial" };

export default function TalksPage() {
  const presentations = getCatalog().getPresentations();

  return (
    <AppShell>
      <div className="page wrap">
        <div className="page-head">
          <h1>Palestras</h1>
          <p className="desc">Decks técnicos renderizados pelo player de slides.</p>
          <p className="meta mono">
            {presentations.length} {presentations.length === 1 ? "deck" : "decks"}
          </p>
        </div>
        <div style={{ marginTop: "26px" }}>
          {presentations.map((presentation) => (
            <Link className="art-row" href={`/talks/${presentation.slug}`} key={presentation.slug}>
              <span className="art-date">{formatDate(presentation.date)}</span>
              <div>
                <div className="art-t">{presentation.title}</div>
                <div className="art-x">{presentation.summary}</div>
              </div>
              <span className="art-side">{presentation.slides.length} slides</span>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
