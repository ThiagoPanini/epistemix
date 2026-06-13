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

const SECTION_VOCAB: Record<string, string> = {
  courses: "NOTA DE CURSO",
  books: "REVIEW",
  certifications: "ANOTAÇÃO",
  blog: "BLOG",
  presentations: "APRESENTAÇÃO",
};

function buildKicker(post: HomePost): string {
  const vocab = SECTION_VOCAB[post.sectionSlug] ?? post.sectionSlug.toUpperCase();
  const parts = ["EM DESTAQUE", vocab];
  if (post.sourceName && ["courses", "books", "certifications"].includes(post.sectionSlug)) {
    parts.push(post.sourceName);
  }
  return parts.join(" · ");
}

export interface HomePost {
  slug: string;
  sectionSlug: string;
  sourceSlug: string;
  sourceName?: string;
  title: string;
  date: string;
  summary: string;
  readTime: string;
  reads?: number;
  votes?: number;
  comments?: number;
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
        <div className="nowl">
          <div className="nowl-label">
            <span className="live-dot" /> AGORA ESTUDANDO
          </div>
          <div className="nowl-items">
            {nowLearning.map((item) => (
              <Link key={item.href} href={item.href} className="nowl-item">
                <div className="nowl-kind">{item.sectionLabel}</div>
                <div className="nowl-title">{item.title}</div>
                <div className="nowl-det">
                  {item.detail && <>{item.detail} · </>}
                  <span className="ago">{recency(item.lastActivity)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {featured && (
        <div className="lead-grid">
          <div className="lead">
            <span className="kicker">{buildKicker(featured)}</span>
            <h2>
              <Link href={buildHref(featured)}>{featured.title}</Link>
            </h2>
            {featured.summary && <p className="standfirst">{featured.summary}</p>}
            <div className="metaline feat-meta">
              <span>{(featured.reads ?? 0).toLocaleString("pt-BR")} leituras</span>
              <span>·</span>
              <span>↑ {featured.votes ?? 0}</span>
              {(featured.comments ?? 0) > 0 && (
                <>
                  <span>·</span>
                  <span>
                    {featured.comments} comentário{featured.comments !== 1 ? "s" : ""}
                  </span>
                </>
              )}
            </div>
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
