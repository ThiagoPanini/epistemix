import Link from "next/link";
import type { Post, Source, Tag } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { TagLink } from "./tag-link";

const STATUS_LABEL: Record<string, string> = {
  ongoing: "em andamento",
  concluded: "concluído",
};

export function SourceView({
  source,
  posts,
  sectionSlug,
  sectionTitle,
  tags = [],
}: {
  source: Source;
  posts: Post[];
  sectionSlug: string;
  sectionTitle: string;
  tags?: Tag[];
}) {
  const tagLabel = (slug: string) => tags.find((t) => t.slug === slug)?.label ?? slug;

  return (
    <div className="page wrap">
      <div className="page-head">
        <span className="kicker">
          <Link href={`/${sectionSlug}`}>{sectionTitle}</Link>
        </span>
        <h1>{source.name}</h1>
        <p className="desc">{source.description}</p>
        <div className="metaline meta">
          <span>
            <b>por {source.author}</b>
          </span>
          {source.studyStatus && (
            <span className="status-chip">
              {STATUS_LABEL[source.studyStatus] ?? source.studyStatus}
            </span>
          )}
          <span>
            {posts.length} {posts.length === 1 ? "nota" : "notas"}
          </span>
        </div>
      </div>

      <div className="colhead" style={{ marginTop: 30 }}>
        NOTAS DO CURSO
      </div>

      <div>
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
              {post.tags.length > 0 && (
                <div className="tagrow" style={{ marginTop: "6px" }}>
                  {post.tags.map((tag) => (
                    <TagLink key={tag} slug={tag} label={tagLabel(tag)} />
                  ))}
                </div>
              )}
            </div>
            <span className="art-date">{formatDate(post.date)}</span>
          </Link>
        ))}
        {posts.length === 0 && (
          <div className="empty-state">
            <h2>Sem notas publicadas</h2>
            <p>Este source ainda não tem notas publicadas. Em breve.</p>
          </div>
        )}
      </div>
    </div>
  );
}
