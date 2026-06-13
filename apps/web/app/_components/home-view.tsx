import Link from "next/link";
import type { NowLearningItem } from "@/lib/catalog";
import { formatDate } from "@/lib/format";

export interface HomePost {
  slug: string;
  sectionSlug: string;
  sourceSlug: string;
  title: string;
  date: string;
  summary: string;
  readTime: string;
}

export interface HomeSection {
  slug: string;
  title: string;
  description: string;
  count: number;
}

interface Props {
  featured: HomePost | null;
  latest: HomePost[];
  sections: HomeSection[];
  nowLearning?: NowLearningItem[];
}

export function HomeView({ featured, latest, sections, nowLearning = [] }: Props) {
  return (
    <div className="wrap">
      <div className="mast">
        <h1>epistemix</h1>
        <div className="mast-rule">
          <span>ESPAÇO PESSOAL DE APRENDIZADO E ESTUDO · THIAGO PANINI</span>
        </div>
      </div>

      {featured && (
        <div className="lead-grid">
          <div className="lead">
            <span className="kicker">{featured.sectionSlug.toUpperCase()}</span>
            <h2>
              <Link href={buildHref(featured)}>{featured.title}</Link>
            </h2>
            {featured.summary && <p className="standfirst">{featured.summary}</p>}
            <div className="metaline">
              <span>{formatDate(featured.date)}</span>
              <span>·</span>
              <span>{featured.readTime} de leitura</span>
            </div>
            <Link href={buildHref(featured)} className="btn-read">
              Ler o post →
            </Link>
          </div>

          <div className="latest">
            <div className="colhead">
              <span>ÚLTIMAS ENTRADAS</span>
              <Link href="/timeline" className="more">
                cronologia →
              </Link>
            </div>
            {latest.map((post) => (
              <Link
                key={`${post.sectionSlug}/${post.sourceSlug}/${post.slug}`}
                href={buildHref(post)}
                className="lat-item"
              >
                <div className="lat-t">{post.title}</div>
                <div className="lat-m">
                  {formatDate(post.date)} · {post.sectionSlug.toUpperCase()}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {nowLearning.length > 0 && (
        <div className="now-learning">
          <div className="colhead">
            <span>NOW LEARNING</span>
          </div>
          {nowLearning.map((item) => (
            <Link key={item.href} href={item.href} className="nl-item">
              <div className="nl-t">{item.title}</div>
              <div className="nl-m">
                {item.detail}
                {item.progress !== undefined && (
                  <>
                    {" · "}
                    <span className="nl-prog">{item.progress}%</span>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="secs">
        {sections.map((sec) => (
          <Link key={sec.slug} href={`/${sec.slug}`} className="sec-col">
            <div className="sec-name">{sec.title}</div>
            <div className="sec-count">
              {sec.count} {sec.count === 1 ? "entrada" : "entradas"}
            </div>
            <div className="sec-desc">{sec.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function buildHref(post: HomePost): string {
  if (post.sourceSlug) {
    return `/${post.sectionSlug}/${post.sourceSlug}/${post.slug}`;
  }
  return `/${post.sectionSlug}/${post.slug}`;
}
