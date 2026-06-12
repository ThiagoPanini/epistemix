import Link from "next/link";
import type { Post, Section } from "@/lib/catalog";
import { formatDate } from "@/lib/format";

export function SectionDirectView({ section, posts }: { section: Section; posts: Post[] }) {
  return (
    <div className="page wrap">
      <div className="page-head">
        <h1>{section.title}</h1>
        <p className="desc">{section.description}</p>
        <p
          className="meta mono"
          style={{ fontSize: "11px", color: "var(--fnt)", marginTop: "12px" }}
        >
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </p>
      </div>

      <div style={{ marginTop: "26px" }}>
        {posts.map((post) => (
          <Link key={post.slug} href={`/${section.slug}/${post.slug}`} className="art-row">
            <span className="art-date">{formatDate(post.date)}</span>
            <div>
              <div className="art-t">{post.title}</div>
              {post.summary && <div className="art-x">{post.summary}</div>}
              {post.tags.length > 0 && (
                <div className="tagrow" style={{ marginTop: "6px" }}>
                  {post.tags.map((tag) => (
                    <span className="tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
        {posts.length === 0 && (
          <p className="mono" style={{ fontSize: "13px", color: "var(--fnt)", padding: "26px 0" }}>
            Nenhum post publicado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
