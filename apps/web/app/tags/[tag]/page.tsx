import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { AppShell } from "../../_components/app-shell";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCatalog()
    .getTags()
    .map((tag) => ({ tag: tag.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag: tagSlug } = await params;
  const catalog = getCatalog();
  const tag = catalog.getTags().find((t) => t.slug === tagSlug);
  if (!tag) return {};
  return {
    title: `#${tag.label}`,
    description: `Todos os posts com a tag ${tag.label} no ethitorial.`,
  };
}

interface TagPost {
  href: string;
  title: string;
  date: string;
  summary: string;
  sectionLabel: string;
  sourceLabel: string;
  tags: string[];
}

function getPostsByTag(tagSlug: string): TagPost[] {
  const catalog = getCatalog();
  const results: TagPost[] = [];

  for (const section of catalog.getSections()) {
    if (section.kind === "with_sources") {
      for (const source of catalog.getSources(section.slug)) {
        for (const post of catalog.getPosts(section.slug, source.slug)) {
          if (post.tags.includes(tagSlug)) {
            results.push({
              href: `/${section.slug}/${source.slug}/${post.slug}`,
              title: post.title,
              date: post.date,
              summary: post.summary,
              sectionLabel: section.title,
              sourceLabel: source.name,
              tags: post.tags,
            });
          }
        }
      }
    } else if (section.kind === "direct") {
      for (const post of catalog.getDirectPosts(section.slug)) {
        if (post.tags.includes(tagSlug)) {
          results.push({
            href: `/${section.slug}/${post.slug}`,
            title: post.title,
            date: post.date,
            summary: post.summary,
            sectionLabel: section.title,
            sourceLabel: "",
            tags: post.tags,
          });
        }
      }
    }
  }

  return results.sort((a, b) => b.date.localeCompare(a.date));
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag: tagSlug } = await params;
  const catalog = getCatalog();
  const tag = catalog.getTags().find((t) => t.slug === tagSlug);
  if (!tag) notFound();

  const allTags = catalog.getTags();
  const tagLabel = (slug: string) => allTags.find((t) => t.slug === slug)?.label ?? slug;
  const posts = getPostsByTag(tagSlug);
  const n = posts.length;

  return (
    <AppShell>
      <div className="wrap tag-page">
        <div className="tag-page-head">
          <p className="tag-eyebrow mono">Tag</p>
          <h1 className="tag-title">#{tag.label}</h1>
          <p className="tag-count mono">
            {n} {n === 1 ? "post" : "posts"}
          </p>
        </div>

        {posts.length > 0 ? (
          <div style={{ marginTop: "26px" }}>
            {posts.map((post) => (
              <article key={post.href} className="art-row">
                <span className="art-date">{formatDate(post.date)}</span>
                <div>
                  <Link href={post.href} className="art-t">
                    {post.title}
                  </Link>
                  {post.summary && <div className="art-x">{post.summary}</div>}
                  <div className="art-x" style={{ marginTop: "4px", fontSize: "11px" }}>
                    {post.sectionLabel}
                    {post.sourceLabel && ` · ${post.sourceLabel}`}
                  </div>
                  {post.tags.length > 1 && (
                    <div className="tagrow" style={{ marginTop: "6px" }}>
                      {post.tags
                        .filter((t) => t !== tagSlug)
                        .map((t) => (
                          <Link key={t} href={`/tags/${t}`} className="tag">
                            {tagLabel(t)}
                          </Link>
                        ))}
                    </div>
                  )}
                </div>
                <div className="art-side">
                  <span>{formatDate(post.date)}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>Nenhum post com esta tag</h2>
            <p>Ainda não há posts publicados com a tag #{tag.label}.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
