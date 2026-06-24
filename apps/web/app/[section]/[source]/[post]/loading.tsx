import { AppShell } from "../../../_components/app-shell";

// Instant feedback while the post route resolves. Mirrors the reading layout
// (.read-grid > article > .read-head / .engage / .prose) with hairline blocks
// so navigation never lands on a blank screen. Defense-in-depth: the route is
// statically generated, but this also covers slow client transitions.
export default function PostLoading() {
  return (
    <AppShell>
      <div className="wrap">
        <div className="read-grid">
          <article aria-busy="true" aria-label="Carregando publicação">
            <header className="read-head">
              <span className="skl skl-kicker" />
              <span className="skl skl-title" />
              <span className="skl skl-title skl-title--short" />
              <span className="skl skl-standfirst" />
              <span className="skl skl-meta" />
            </header>

            <div className="engage">
              <span className="skl skl-pill" />
              <span className="skl skl-stat" />
              <span className="skl skl-stat" />
            </div>

            <div className="prose">
              {Array.from({ length: 8 }).map((_, i) => (
                <span
                  className={`skl skl-line${i % 4 === 3 ? " skl-line--short" : ""}`}
                  // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
                  key={i}
                />
              ))}
            </div>
          </article>
        </div>
      </div>
    </AppShell>
  );
}
