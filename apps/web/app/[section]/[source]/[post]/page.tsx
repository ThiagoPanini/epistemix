import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import { getCatalog } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { mdxComponents } from "@/lib/mdx-components";
import { articleJsonLd, buildPostUrl } from "@/lib/site/meta";
import { getReadTime, getSiteModel } from "@/lib/site/model";
import { slugify } from "@/lib/slug";
import { AppShell } from "../../../_components/app-shell";
import { CommentCount } from "../../../_components/comment-count";
import { CommentSection } from "../../../_components/comment-section";
import { TocSpy } from "../../../_components/toc-spy";
import { ViewTracker } from "../../../_components/view-tracker";
import { VoteButton } from "../../../_components/vote-button";

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ post: string; section: string; source: string }>;
}): Promise<Metadata> {
  const { section: sectionSlug, source: sourceSlug, post: postSlug } = await params;
  const post = getCatalog().getPost(sectionSlug, sourceSlug, postSlug);
  if (!post) return {};
  const url = buildPostUrl(sectionSlug, sourceSlug, postSlug);
  return {
    title: post.title,
    description: post.summary || undefined,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.summary || undefined,
      url,
      publishedTime: post.date,
      authors: ["Thiago Panini"],
    },
    twitter: { title: post.title, description: post.summary || undefined },
  };
}

export function generateStaticParams() {
  const catalog = getCatalog();
  return catalog.getSections().flatMap((section) =>
    catalog.getSources(section.slug).flatMap((source) =>
      catalog.getPosts(section.slug, source.slug).map((post) => ({
        section: section.slug,
        source: source.slug,
        post: post.slug,
      })),
    ),
  );
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ post: string; section: string; source: string }>;
}) {
  const { section: sectionSlug, source: sourceSlug, post: postSlug } = await params;
  const catalog = getCatalog();
  const model = getSiteModel();
  const section = model.sections.find((candidate) => candidate.slug === sectionSlug);
  const source = catalog.getSource(sectionSlug, sourceSlug);
  const post = catalog.getPost(sectionSlug, sourceSlug, postSlug);
  if (!section || !source || !post) notFound();

  const allPosts = catalog.getPosts(sectionSlug, sourceSlug);
  const idx = allPosts.findIndex((p) => p.slug === postSlug);
  const older = idx < allPosts.length - 1 ? allPosts[idx + 1] : null;
  const newer = idx > 0 ? allPosts[idx - 1] : null;
  const tagLabels = new Map(model.tags.map((t) => [t.slug, t.label]));
  const headings = extractHeadings(post.body);

  const jsonLd = articleJsonLd({
    title: post.title,
    summary: post.summary,
    date: post.date,
    url: buildPostUrl(sectionSlug, sourceSlug, postSlug),
  });

  const artifactId = `${sectionSlug}/${sourceSlug}/${postSlug}`;

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
                {" · "}
                <Link href={`/${sectionSlug}/${sourceSlug}`}>{source.name}</Link>
              </span>
              <h1>{post.title}</h1>
              {post.summary && <p className="standfirst">{post.summary}</p>}
              <div className="metaline">
                <span>
                  <b>{formatDate(post.date)}</b>
                </span>
                <span>{getReadTime(post.body)} de leitura</span>
                {source.author && <span>sobre obra de {source.author}</span>}
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
              <VoteButton artifactId={artifactId} />
              <ViewTracker artifactId={artifactId} />
              <CommentCount artifactId={artifactId} />
            </div>

            <div className="prose">
              <MDXRemote
                components={mdxComponents}
                options={{
                  mdxOptions: {
                    remarkPlugins: [remarkGfm],
                    rehypePlugins: [
                      [
                        rehypePrettyCode,
                        {
                          theme: { dark: "github-dark-dimmed", light: "github-light" },
                          keepBackground: false,
                        },
                      ],
                    ],
                  },
                }}
                source={post.body}
              />
            </div>

            {(older || newer) && (
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
                {older ? (
                  <Link
                    href={`/${sectionSlug}/${sourceSlug}/${older.slug}`}
                    style={{ fontSize: "13px" }}
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
                      ← ANTERIOR
                    </div>
                    <div style={{ fontWeight: 600 }}>{older.title}</div>
                  </Link>
                ) : (
                  <span />
                )}
                {newer ? (
                  <Link
                    href={`/${sectionSlug}/${sourceSlug}/${newer.slug}`}
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
                    <div style={{ fontWeight: 600 }}>{newer.title}</div>
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}

            <CommentSection artifactId={artifactId} initialComments={[]} />
          </article>

          {headings.length > 0 && <TocSpy headings={headings} />}
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
