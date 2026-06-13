import Link from "next/link";
import type { Post, Section, Tag } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { TagLink } from "./tag-link";

export function SectionDirectView({
  section,
  posts,
  tags = [],
}: {
  section: Section;
  posts: Post[];
  tags?: Tag[];
}) {
  const tagLabel = (slug: string) => tags.find((t) => t.slug === slug)?.label ?? slug;

  return (
    <div className="page wrap">
      <div className="page-head">
        <span className="kicker">Rubrica</span>
        <h1>{section.title}</h1>
        <p className="desc">{section.description}</p>
        <div className="metaline meta">
          <span>
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </span>
          {posts.length > 0 && <span>atualizada em {formatDate(posts[0].date)}</span>}
        </div>
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
                    <TagLink key={tag} slug={tag} label={tagLabel(tag)} />
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
        {posts.length === 0 && (
          <div className="empty-state">
            <h2>Sem posts publicados</h2>
            <p>Esta seção ainda não tem conteúdo publicado. Volte em breve.</p>
          </div>
        )}
      </div>
    </div>
  );
}
