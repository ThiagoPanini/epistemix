import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/app/_components/app-shell";
import { Avatar, hueFromText } from "@/app/_components/primitives";
import { formatDate } from "@/lib/format";
import { getSiteModel, SITE_AUTHOR } from "@/lib/site/model";

interface AuthorProfile {
  name: string;
  username: string;
  image: string | null;
}

async function fetchAuthor(username: string): Promise<AuthorProfile | null> {
  const apiUrl = process.env.ETHITORIAL_API_URL ?? "http://localhost:8000";
  try {
    const res = await fetch(`${apiUrl}/api/authors/${username}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username}`,
  };
}

export default async function AuthorPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const author = await fetchAuthor(username);
  if (!author) notFound();

  const model = getSiteModel();
  const posts = model.posts;

  const isSiteAuthor = author.name === SITE_AUTHOR.name;
  const authorPosts = isSiteAuthor ? posts : [];

  return (
    <AppShell>
      <div className="author-page wrap">
        <div className="author-profile">
          <Avatar
            hue={hueFromText(author.name)}
            name={author.name}
            size={72}
            src={author.image ?? undefined}
          />
          <div className="author-meta">
            <h1 className="author-name">{author.name}</h1>
            <span className="author-handle">@{author.username}</span>
          </div>
        </div>

        <div className="author-section-head">
          <span className="author-section-label">Publicações</span>
          <span className="author-section-count">{authorPosts.length}</span>
        </div>

        {authorPosts.length === 0 ? (
          <p className="author-empty">Ainda não há publicações.</p>
        ) : (
          <ul className="author-posts">
            {authorPosts.map((post) => (
              <li key={`${post.sectionSlug}/${post.sourceSlug}/${post.slug}`}>
                <Link
                  className="art-row"
                  href={`/${post.sectionSlug}/${post.sourceSlug}/${post.slug}`}
                >
                  <span className="art-date">{formatDate(post.date)}</span>
                  <span>
                    <span className="art-t">{post.title}</span>
                    {post.summary && <p className="art-x">{post.summary}</p>}
                  </span>
                  <span className="art-side">
                    <span>{post.sourceName}</span>
                    <span>{post.readTime}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
