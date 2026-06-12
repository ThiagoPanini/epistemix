import Link from "next/link";
import type { Section, Source } from "@/lib/catalog";

interface SourceWithCount extends Source {
  postCount: number;
}

export function SectionWithSourcesView({
  section,
  sources,
}: {
  section: Section;
  sources: SourceWithCount[];
}) {
  return (
    <div className="page wrap">
      <div className="page-head">
        <h1>{section.title}</h1>
        <p className="desc">{section.description}</p>
        <p
          className="meta mono"
          style={{ fontSize: "11px", color: "var(--fnt)", marginTop: "12px" }}
        >
          {sources.length} {sources.length === 1 ? "fonte" : "fontes"}
        </p>
      </div>

      {sources.map((source) => (
        <Link key={source.slug} href={`/${section.slug}/${source.slug}`} className="src-card">
          <div className="kicker mono">{source.author}</div>
          <div className="src-name">{source.name}</div>
          <div className="src-by">por {source.author}</div>
          {source.description && <p className="src-desc">{source.description}</p>}
          <div
            className="mono"
            style={{
              fontSize: "10.5px",
              color: "var(--fnt)",
              marginTop: "12px",
              letterSpacing: "0.06em",
            }}
          >
            {source.postCount} {source.postCount === 1 ? "nota" : "notas"}
          </div>
        </Link>
      ))}
    </div>
  );
}
