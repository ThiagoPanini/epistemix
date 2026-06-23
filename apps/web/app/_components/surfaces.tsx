import Link from "next/link";
import { sourceAuthorAvatarUrl } from "@/lib/content-assets";
import { formatDate } from "@/lib/format";
import type { SitePost, SiteSection, SiteSource, Tag } from "@/lib/site/model";
import { OpenPlayerButton } from "./open-player-button";
import { Avatar, hueFromText, Icon, SourceCover } from "./primitives";

export function Aurora() {
  return (
    <div aria-hidden="true" className="aurora">
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />
    </div>
  );
}

export function SectionGrid({ section, sources }: { section: SiteSection; sources: SiteSource[] }) {
  const totalPosts = sources.reduce((total, source) => total + source.postCount, 0);

  return (
    <div className="content-inner">
      <div className="page-head">
        <span className="page-eyebrow">
          <Icon name={section.icon} size={14} /> Section · {section.kind}
        </span>
        <h1 className="page-title">{section.title}</h1>
        <p className="page-desc">{section.description}</p>
        <div className="section-meta">
          <span className="mi">
            <Icon name="layers" size={13} /> {sources.length} source
            {sources.length === 1 ? "" : "s"}
          </span>
          <span className="mi">
            <Icon name="doc" size={13} /> {totalPosts} post{totalPosts === 1 ? "" : "s"}
          </span>
          <span className="mi wip" title="Fase 2">
            <Icon name="eye" size={13} /> views em breve
          </span>
        </div>
      </div>

      {sources.length > 0 ? (
        <div className="grid-sources">
          {sources.map((source) => (
            <SourceCard key={source.slug} source={source} />
          ))}
        </div>
      ) : (
        <EmptyState
          body="Ainda não há Sources publicados nesta Section. Quando entrarem no catálogo MDX, os cards aparecem aqui."
          title="Nada publicado por aqui ainda"
        />
      )}
    </div>
  );
}

export function SourceCard({ source }: { source: SiteSource }) {
  return (
    <Link className="src-card" href={`/${source.sectionSlug}/${source.slug}`}>
      <SourceCover source={source} />
      <div className="src-body">
        <span className="src-name">{source.name}</span>
        <span className="src-author">
          <Avatar
            hue={hueFromText(source.author)}
            name={source.author}
            src={sourceAuthorAvatarUrl(source)}
          />
          {source.author}
        </span>
        <span className="src-desc">{source.description}</span>
        <div className="src-foot">
          <span className="stat">
            <Icon name="doc" size={12} /> {source.postCount} post
            {source.postCount === 1 ? "" : "s"}
          </span>
          <span className="sdot">·</span>
          <span className="stat wip" title="Contadores chegam na Fase 2">
            <Icon name="eye" size={12} /> 0 views
          </span>
          <span className="sdot">·</span>
          <span className="stat wip" title="Contadores chegam na Fase 2">
            <Icon name="vote" size={12} /> 0 votes
          </span>
        </div>
      </div>
    </Link>
  );
}

export function SourcePageView({
  posts,
  source,
  tags,
}: {
  posts: SitePost[];
  source: SiteSource;
  tags: Tag[];
}) {
  return (
    <div className="content-inner">
      <div className="source-hero">
        <SourceCover className="source-cover" source={source} />
        <div className="source-info">
          <span className="page-eyebrow">
            <Icon name="courses" size={14} /> Course · Source
          </span>
          <h1>{source.name}</h1>
          <div className="source-byline">
            <Avatar
              hue={hueFromText(source.author)}
              name={source.author}
              size={22}
              src={sourceAuthorAvatarUrl(source)}
            />
            {source.author}
          </div>
          <p className="src-long">{source.description}</p>
          <a className="ext-link" href={source.externalUrl} rel="noreferrer" target="_blank">
            <Icon name="external" size={14} /> Link para o Curso
          </a>
        </div>
      </div>

      <div className="posts-head">
        <h2>Posts</h2>
        <span className="cnt">
          {posts.length} publicado{posts.length === 1 ? "" : "s"}
        </span>
      </div>
      {posts.length > 0 ? (
        <div className="post-list">
          {posts.map((post, index) => (
            <Link
              className="post-row"
              href={`/${post.sectionSlug}/${post.sourceSlug}/${post.slug}`}
              key={post.slug}
            >
              <span className="pr-idx">{String(index + 1).padStart(2, "0")}</span>
              <span className="pr-main">
                <span className="pr-title">
                  {post.title} <Icon name="arrowRight" size={13} />
                </span>
                <span className="pr-sum">{post.summary}</span>
                <span className="chip-row">
                  {post.tags.map((tag) => (
                    <span className="chip" key={tag}>
                      {tagLabel(tags, tag)}
                    </span>
                  ))}
                </span>
              </span>
              <span className="pr-meta">
                <span className="pr-date">{formatDate(post.date)}</span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          body="Este Source ainda não tem posts publicados."
          title="Sem posts publicados"
        />
      )}
    </div>
  );
}

export function WipTemplate({ section }: { section?: SiteSection | null }) {
  const isAbout = !section;
  const title = isAbout ? "Sobre o ethitorial" : section.title;
  const description = isAbout
    ? "Um hub pessoal e open source para registrar o que estou aprendendo em público."
    : "Estou construindo isto. A Section já está desenhada — o conteúdo entra nas próximas fatias da Fase 1.";
  const teaser = isAbout
    ? {
        body: "Estudar deixando rastro: notas, código e o raciocínio por trás de cada decisão, num lugar só, crawlável e sem login.",
        title: "Por que existe",
      }
    : {
        body: section.description,
        title: `O que vem em ${section.title}`,
      };

  return (
    <div className="center-stage">
      <Aurora />
      <div className="center-stage-inner">
        <div className="wip-icon">
          <Icon name={isAbout ? "info" : section.icon} size={28} />
        </div>
        <h1>{title}</h1>
        <p className="cs-desc">{description}</p>
        {!isAbout && <p className="cs-code">/{section.slug}</p>}
        <div className="cs-actions">
          {!isAbout && section.slug === "presentations" && <OpenPlayerButton />}
          <Link
            className={`btn ${section?.slug === "presentations" ? "btn-ghost" : "btn-primary"}`}
            href="/courses"
          >
            <Icon name="courses" size={14} /> Ir para Courses
          </Link>
          <Link className="btn btn-ghost" href="/">
            Voltar ao início
          </Link>
        </div>
        <div className="wip-teaser">
          <span className="wt-ic">
            <Icon name="sparkle" size={16} />
          </span>
          <div>
            <div className="wt-title">{teaser.title}</div>
            <div className="wt-body">{teaser.body}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotFoundView({ what = "Página não encontrada" }: { what?: string }) {
  return (
    <div className="center-stage">
      <Aurora />
      <div className="center-stage-inner">
        <div className="wip-icon">
          <Icon name="hash" size={26} />
        </div>
        <h1>{what}</h1>
        <p className="cs-desc">
          Este endereço não existe, ou o Post ainda é um rascunho e não foi publicado.
        </p>
        <p className="cs-code">HTTP 404</p>
        <div className="cs-actions">
          <Link className="btn btn-primary" href="/courses">
            <Icon name="courses" size={14} /> Ir para Courses
          </Link>
          <Link className="btn btn-ghost" href="/">
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

export function Engagement() {
  return (
    <div className="engage">
      <div className="engage-bar engage-overlay">
        <button className="vote-btn" disabled type="button">
          <Icon name="vote" size={15} /> Votar <span className="vn">·</span> <span>0</span>
        </button>
        <button className="vote-btn" disabled type="button">
          <Icon name="comment" size={15} /> Comentários <span>0</span>
        </button>
      </div>
      <div className="engage-bar engage-note">
        <span className="soon-inline">
          <Icon name="lock" size={13} />
          Votos e comentários chegam na Fase 2 — por enquanto, só leitura.
        </span>
      </div>
      <div className="comments-soon">
        <Icon name="comment" size={22} />
        <div>
          Comentários <strong>flat</strong> com avatar, nome e menções <code>@usuario</code>.
        </div>
        <div className="soon-code">em breve</div>
      </div>
    </div>
  );
}

function EmptyState({ body, title }: { body: string; title: string }) {
  return (
    <div className="empty-state">
      <Icon name="doc" size={22} />
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}

function tagLabel(tags: Tag[], slug: string) {
  return tags.find((tag) => tag.slug === slug)?.label ?? slug;
}
