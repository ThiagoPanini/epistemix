import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getCatalog } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { mdxComponents } from "@/lib/mdx-components";
import { articleJsonLd, buildPostUrl } from "@/lib/site/meta";
import { getReadTime, getSiteModel } from "@/lib/site/model";
import { slugify } from "@/lib/slug";
import { AppShell } from "../../_components/app-shell";
import { SourceView } from "../../_components/source-view";

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string; source: string }>;
}): Promise<Metadata> {
  const { section: sectionSlug, source: sourceSlug } = await params;
  const catalog = getCatalog();
  const model = getSiteModel();
  const section = model.sections.find((s) => s.slug === sectionSlug);
  if (!section) return {};

  if (section.kind === "with_sources") {
    const source = catalog.getSource(sectionSlug, sourceSlug);
    if (!source) return {};
    return {
      title: source.name,
      description: source.description,
      openGraph: { title: source.name, description: source.description },
    };
  }

  const post = catalog.getDirectPost(sectionSlug, sourceSlug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary || undefined,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.summary || undefined,
      publishedTime: post.date,
    },
  };
}

export function generateStaticParams() {
  const catalog = getCatalog();
  const withSourcesParams = catalog
    .getSections()
    .filter((s) => s.kind === "with_sources")
    .flatMap((section) =>
      catalog.getSources(section.slug).map((source) => ({
        section: section.slug,
        source: source.slug,
      })),
    );
  const directParams = catalog
    .getSections()
    .filter((s) => s.kind === "direct")
    .flatMap((section) =>
      catalog.getDirectPosts(section.slug).map((post) => ({
        section: section.slug,
        source: post.slug,
      })),
    );
  return [...withSourcesParams, ...directParams];
}

export default async function SourceOrDirectPostPage({
  params,
}: {
  params: Promise<{ section: string; source: string }>;
}) {
  const { section: sectionSlug, source: sourceSlug } = await params;
  const catalog = getCatalog();
  const model = getSiteModel();
  const section = model.sections.find((candidate) => candidate.slug === sectionSlug);
  if (!section) notFound();

  if (section.kind === "with_sources") {
    const source = catalog.getSource(sectionSlug, sourceSlug);
    if (!source) notFound();
    const posts = catalog.getPosts(sectionSlug, sourceSlug);
    return (
      <AppShell>
        <SourceView source={source} posts={posts} sectionSlug={sectionSlug} />
      </AppShell>
    );
  }

  // direct section — sourceSlug is actually the post slug
  const post = catalog.getDirectPost(sectionSlug, sourceSlug);
  if (!post) notFound();

  const allPosts = catalog.getDirectPosts(sectionSlug);
  const idx = allPosts.findIndex((p) => p.slug === sourceSlug);
  const prev = idx > 0 ? allPosts[idx - 1] : null;
  const next = idx < allPosts.length - 1 ? allPosts[idx + 1] : null;
  const tagLabels = new Map(model.tags.map((t) => [t.slug, t.label]));
  const headings = extractHeadings(post.body);
  const jsonLd = articleJsonLd({
    title: post.title,
    summary: post.summary,
    date: post.date,
    url: buildPostUrl(sectionSlug, "", sourceSlug),
  });

  return (
    <AppShell>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is safe structured data generated server-side */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div className="wrap">
        <div className="read-grid">
          <article>
            <header className="read-head">
              <span className="kicker mono">
                <Link href={`/${sectionSlug}`}>{section.title}</Link>
              </span>
              <h1>{post.title}</h1>
              {post.summary && <p className="standfirst">{post.summary}</p>}
              <div className="metaline">
                <span>{formatDate(post.date)}</span>
                <span>·</span>
                <span>{getReadTime(post.body)} de leitura</span>
              </div>
              {post.tags.length > 0 && (
                <div className="tagrow" style={{ marginTop: "14px" }}>
                  {post.tags.map((tag) => (
                    <span className="tag" key={tag}>
                      {tagLabels.get(tag) ?? tag}
                    </span>
                  ))}
                </div>
              )}
            </header>

            <div className="engage">
              <button type="button" className="up-btn">
                ▲ Upvote
              </button>
              <span className="eng-stat">0 leituras</span>
              <span className="eng-stat">0 comentários</span>
            </div>

            <div className="prose">
              <MDXRemote
                components={mdxComponents}
                options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
                source={post.body}
              />
            </div>

            {(prev || next) && (
              <nav
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginTop: "48px",
                  borderTop: "1px solid var(--ln)",
                  paddingTop: "24px",
                }}
              >
                {prev ? (
                  <Link href={`/${sectionSlug}/${prev.slug}`} style={{ fontSize: "13px" }}>
                    <div
                      className="mono"
                      style={{
                        fontSize: "10px",
                        color: "var(--fnt)",
                        letterSpacing: "0.1em",
                        marginBottom: "4px",
                      }}
                    >
                      ← ANTERIOR
                    </div>
                    <div style={{ fontWeight: 600 }}>{prev.title}</div>
                  </Link>
                ) : (
                  <span />
                )}
                {next ? (
                  <Link
                    href={`/${sectionSlug}/${next.slug}`}
                    style={{ fontSize: "13px", textAlign: "right" }}
                  >
                    <div
                      className="mono"
                      style={{
                        fontSize: "10px",
                        color: "var(--fnt)",
                        letterSpacing: "0.1em",
                        marginBottom: "4px",
                      }}
                    >
                      PRÓXIMO →
                    </div>
                    <div style={{ fontWeight: 600 }}>{next.title}</div>
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}

            <div className="disc">
              <h3 className="mono">DISCUSSÃO</h3>
              <p
                className="mono"
                style={{ fontSize: "12px", color: "var(--fnt)", marginTop: "14px" }}
              >
                Comentários em breve — autenticação implementada em E0a.
              </p>
            </div>
          </article>

          {headings.length > 0 && (
            <aside className="toc">
              <div className="toc-label">CONTEÚDO</div>
              {headings.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  style={{ paddingLeft: h.level === 3 ? "24px" : "12px" }}
                >
                  {h.text}
                </a>
              ))}
            </aside>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function extractHeadings(body: string): { id: string; level: 2 | 3; text: string }[] {
  const withoutCode = body.replace(/```[\s\S]*?```/g, "");
  return [...withoutCode.matchAll(/^(#{2,3})\s+(.+)$/gm)].map((match) => {
    const text = match[2].trim();
    return {
      id: slugify(text),
      level: match[1].length as 2 | 3,
      text,
    };
  });
}
