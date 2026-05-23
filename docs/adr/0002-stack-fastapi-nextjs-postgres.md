# ADR 0002 — Stack: FastAPI + Next.js 15 + PostgreSQL

- **Status:** Accepted
- **Data:** 2026-05-23
- **Decisores:** Thiago Panini (solo)
- **Relacionado:** [ADR-0001](0001-monorepo-and-boundaries.md), [ADR-0003](0003-infra-hostinger-vps-coolify.md)

## Contexto

Precisamos escolher stack tecnológica para um SaaS open source de catálogo de apresentações com (V1) UI rica de catálogo + auth + engajamento, e (V2) features AI-heavy (voice cloning, RAG, Q&A em tempo real). Restrições:

- Solo dev com ambição comercial
- Open source desde o dia 1
- Setup AI-first é objetivo de primeira ordem (deve haver corpus farto de exemplos para agentes consumirem)
- SEO importa (catálogo público)
- Design impressionante importa (referência: codewiki.google)
- Voz/RAG é V2, mas a arquitetura não deve precisar ser rasgada para acomodá-lo depois

## Decisão

**Backend: Python 3.13 + FastAPI**
- ORM: SQLAlchemy 2 + SQLModel (reduz duplicação Pydantic ↔ ORM)
- Migrations: Alembic
- Package manager: `uv` (Astral)
- Lint/format: `ruff`
- Types: `pyright --strict`
- Validation: Pydantic v2
- Testes: `pytest` + `pytest-asyncio` + `httpx`
- Background jobs: a decidir (provavelmente Procrastinate para evitar Redis no início)

**Frontend: Next.js 15 (App Router) + TypeScript**
- Styling: Tailwind 4 + shadcn/ui
- Animação: Framer Motion (default), GSAP quando precisar de scroll-driven avançado
- Data: TanStack Query no cliente; RSC + Server Actions onde fizer sentido
- Forms: React Hook Form + Zod
- Lint: Biome
- Testes: Vitest + Playwright
- Tipos do contrato API: gerados via `openapi-typescript` e versionados em `packages/types`

**Banco: PostgreSQL 17** (confirmado pelo usuário)

## Justificativa

**Python/FastAPI:**
- Preferência explícita do usuário, alinhada ao perfil técnico (dados, AI, SRE)
- Ecossistema Python é o melhor do mundo para a Fase 4 (voice, RAG, embeddings, MLOps)
- FastAPI gera OpenAPI nativamente — alimenta type-safety no front sem ferramenta extra
- Async-first combina com workloads do V2 (streaming, long-polling)

**Next.js 15:**
- Maior corpus de exemplos no ecossistema AI-first (Claude e outros agentes acertam mais nesta stack que em alternativas)
- RSC + streaming + Server Actions reduzem bundle e permitem UX premium sem complexidade exótica
- SEO sólido por padrão (SSR + Metadata API)
- shadcn/ui é o padrão atual para SaaS com design refinado; o código fica no repositório, não em dependência
- Framer Motion + GSAP cobrem o vocabulário visual desejado (CodeWiki-like)

**PostgreSQL:**
- Preferência explícita do usuário
- Único banco que cobre relacional + JSON + full-text search + pgvector (relevante para Fase 4 sem novo banco)
- Excelente suporte no ecossistema Python e Node

**`uv` + `ruff` + `pyright`:**
- Ferramental Python moderno; ordens de magnitude mais rápido que pip/poetry/black/flake8
- `uv` suporta workspaces, encaixa em monorepo

**Biome:**
- Substitui ESLint + Prettier por uma ferramenta única e dramaticamente mais rápida
- Reduz config burocrática que distrai

## Consequências

### Positivas
- Stack alinhada à expertise do usuário e ao ecossistema AI-first
- OpenAPI elimina drift entre front e back
- Mesmo banco cobre V1 → V4 sem migrar de tecnologia
- Ferramental moderno (`uv`, `ruff`, `biome`) reduz fricção de manutenção

### Negativas
- Dois runtimes (Node + Python) — duas pipelines de build, dois `package`/`lock`
- Next.js tem ritmo de release agressivo; quebras menores entre majors são comuns
- shadcn-style "código no repo" significa atualizar componentes manualmente quando upstream evolui

## Opções rejeitadas

- **Astro + Hono em vez de Next.js:** mais rápido para conteúdo estático mas menos exemplos para Fase 4; trade-off não compensa.
- **Next.js full-stack (sem FastAPI):** mata a preferência por Python e o ecossistema da Fase 4.
- **Django/DRF em vez de FastAPI:** mais batteries-included mas mais opinativo, async-second, OpenAPI menos polido.
- **Supabase como BaaS:** acelera Fase 1 mas acopla domínio a Postgres "via Supabase patterns"; perde controle quando o Coolify entra em jogo.
- **MongoDB:** sem benefício para o domínio (que é claramente relacional), perde pgvector e full-text search nativos.
