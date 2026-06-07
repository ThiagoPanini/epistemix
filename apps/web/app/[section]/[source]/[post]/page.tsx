import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getCatalog } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { mdxComponents } from "@/lib/mdx-components";
import { getReadTime, getSiteModel, SITE_AUTHOR } from "@/lib/site/model";
import { slugify } from "@/lib/slug";
import { AppShell } from "../../../_components/app-shell";
import { PostToc, type TocHeading } from "../../../_components/post-toc";
import { Avatar, hueFromText, Icon } from "../../../_components/primitives";
import { Engagement } from "../../../_components/surfaces";

export const dynamicParams = false;

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

  const posts = catalog.getPosts(sectionSlug, sourceSlug);
  const index = posts.findIndex((candidate) => candidate.slug === post.slug);
  const previous = index > 0 ? posts[index - 1] : null;
  const next = index >= 0 && index < posts.length - 1 ? posts[index + 1] : null;
  const tagLabels = new Map(model.tags.map((tag) => [tag.slug, tag.label]));
  const headings = extractHeadings(post.body);

  return (
    <AppShell
      activeSection={section.slug}
      crumbs={[
        { href: "/", label: "epistemix" },
        { href: `/${section.slug}`, label: section.title },
        { href: `/${section.slug}/${source.slug}`, label: source.name },
        { label: post.title },
      ]}
      model={model}
      showFooter={false}
    >
      <div className="read-wrap">
        <article className="read-col">
          <Link className="read-back" href={`/${sectionSlug}/${sourceSlug}`}>
            <Icon name="chevronLeft" size={14} /> {source.name}
          </Link>

          <header className="read-head">
            <div className="meta-top">
              <Icon name="clock" size={14} />
              <span>{formatDate(post.date)}</span>
              <span className="meta-sep">·</span>
              <span>{getReadTime(post.body)} de leitura</span>
            </div>
            <h1>{post.title}</h1>
            <div className="chip-row read-tags">
              {post.tags.map((tag) => (
                <span className="chip" key={tag}>
                  {tagLabels.get(tag) ?? tag}
                </span>
              ))}
            </div>
            <div className="byline">
              <Avatar
                hue={hueFromText(SITE_AUTHOR.name)}
                name={SITE_AUTHOR.name}
                size={26}
                src={SITE_AUTHOR.avatar}
              />
              <div>
                <div className="nm">{SITE_AUTHOR.name}</div>
                <div className="rt">sobre o curso {source.name}</div>
              </div>
            </div>
          </header>

          <div className="prose">
            <MDXRemote
              components={mdxComponents}
              options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
              source={post.body}
            />
          </div>

          <Engagement />

          <div className="post-nav">
            {previous ? (
              <Link
                className="post-nav-card"
                href={`/${sectionSlug}/${sourceSlug}/${previous.slug}`}
              >
                <div className="pn-dir">← Anterior</div>
                <div className="pn-title">{previous.title}</div>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                className="post-nav-card next"
                href={`/${sectionSlug}/${sourceSlug}/${next.slug}`}
              >
                <div className="pn-dir">Próximo →</div>
                <div className="pn-title">{next.title}</div>
              </Link>
            ) : (
              <span />
            )}
          </div>
        </article>

        <PostToc headings={headings} />
      </div>
    </AppShell>
  );
}

function extractHeadings(body: string): TocHeading[] {
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
