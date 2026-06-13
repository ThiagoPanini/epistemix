import Link from "next/link";
import type { NowLearningItem } from "@/lib/catalog";
import { formatDate } from "@/lib/format";

function recency(iso: string): string {
  if (!iso) return "";
  const days = Math.floor((Date.now() - new Date(`${iso}T00:00:00Z`).getTime()) / 86_400_000);
  if (days === 0) return "hoje";
  if (days === 1) return "há 1 dia";
  return `há ${days} dias`;
}

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

      {nowLearning.length > 0 && (
        <div className="now-band">
          <span className="now-label mono">● AGORA ESTUDANDO</span>
          <div className="now-cards">
            {nowLearning.map((item) => (
              <Link key={item.href} href={item.href} className="now-card">
                <div className="now-kind mono">{item.sectionLabel}</div>
                <div className="now-title">{item.title}</div>
                {item.detail && <div className="now-detail">{item.detail}</div>}
                <div className="now-rec mono">{recency(item.lastActivity)}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

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
