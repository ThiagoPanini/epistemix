import Link from "next/link";
import type { Post, Source } from "@/lib/catalog";
import { formatDate } from "@/lib/format";

export function SourceView({
  source,
  posts,
  sectionSlug,
}: {
  source: Source;
  posts: Post[];
  sectionSlug: string;
}) {
  const hostname = (() => {
    try {
      return new URL(source.externalUrl).hostname.replace(/^www\./, "");
    } catch {
      return source.externalUrl;
    }
  })();

  return (
    <div className="page wrap">
      <div className="page-head">
        <span className="kicker mono">{sectionSlug}</span>
        <h1>{source.name}</h1>
        <p className="desc">{source.description}</p>
        <div className="metaline">
          <span>por {source.author}</span>
          <span>·</span>
          <a
            href={source.externalUrl}
            target="_blank"
            rel="noreferrer"
            className="mono"
            style={{ fontSize: "11px", color: "var(--ac-text)", letterSpacing: "0.04em" }}
          >
            {hostname}
          </a>
        </div>
      </div>

      <div style={{ marginTop: "26px" }}>
        {posts.map((post, i) => (
          <Link
            key={post.slug}
            href={`/${sectionSlug}/${source.slug}/${post.slug}`}
            className="note-row"
          >
            <span className="note-idx">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <div className="art-t">{post.title}</div>
              {post.summary && <div className="art-x">{post.summary}</div>}
            </div>
            <span className="art-date">{formatDate(post.date)}</span>
          </Link>
        ))}
        {posts.length === 0 && (
          <p className="mono" style={{ fontSize: "13px", color: "var(--fnt)", padding: "26px 0" }}>
            Nenhuma nota publicada ainda.
          </p>
        )}
      </div>
    </div>
  );
}
