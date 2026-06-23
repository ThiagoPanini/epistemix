# Arquitetura — ethitorial

Documento vivo. Reflete a arquitetura **atual e pretendida**. Mudanças significativas devem vir acompanhadas de ADR.

## Visão de topo

```
                          ┌────────────────────┐
                          │   Cloudflare       │
                          │  DNS + CDN + WAF   │
                          └─────────┬──────────┘
                                    │
                          ┌─────────▼──────────┐
                          │  VPS Hostinger     │
                          │  (Ubuntu 24.04)    │
                          │                    │
                          │  ┌──────────────┐  │
                          │  │   Coolify    │  │
                          │  │ (Caddy + UI) │  │
                          │  └──────┬───────┘  │
                          │         │          │
                          │  ┌──────┴───────┐  │
                          │  │ apps/web     │  │
                          │  │ (Next.js 15) │  │
                          │  └──────┬───────┘  │
                          │         │          │
                          │  ┌──────▼───────┐  │
                          │  │ apps/api     │  │
                          │  │ (FastAPI)    │  │
                          │  └──────┬───────┘  │
                          │         │          │
                          │  ┌──────▼───────┐  │
                          │  │ Postgres 17  │  │
                          │  │   + volume   │  │
                          │  └──────────────┘  │
                          └─────────┬──────────┘
                                    │ pg_dump diário
                          ┌─────────▼──────────┐
                          │ Cloudflare R2      │
                          │ assets + backups   │
                          └────────────────────┘
```

## Camadas e responsabilidades

### `apps/web` (Next.js 15)

- Renderiza catálogo público (RSC + streaming)
- Renderiza player de slides (MDX → componentes React via `slide-kit`) — ver [ADR-0012](adr/0012-slide-kit-base-plus-extensoes-locais.md)
- Hospeda `slide-kit/` (catálogo base de primitivas, animações Framer Motion e chrome de player)
- UI de auth, perfil, votos, comentários
- Server Actions exclusivas para concerns do Next (revalidar cache, cookies funcionais, redirects) — ver [ADR-0010](adr/0010-server-actions-apenas-para-concerns-do-next.md)
- Consome `apps/api` via `fetch` para todas as operações **dinâmicas** de domínio (voto, comentário, perfil, upload). Cliente gerado a partir do OpenAPI.
- **Catálogo MDX-native — ver [ADR-0018](adr/0018-catalogo-mdx-native-na-fase-1.md):** o catálogo (Section/Source/Artifact) é **MDX-native** — lido direto de `content/**/*.mdx` em RSC/build-time, sem passar pela API. "Tudo via fetch da API" vale para as operações **dinâmicas** (engagement, auth, upload), que entram **agora** no push feature-completo ([ADR-0019](adr/0019-redesenho-prototipo-absoluto-push-feature-completo.md)). O `catalog` boundary Python + endpoints REST de catálogo ficam para a futura migração CMS (adapter MDX→Postgres atrás do mesmo port), sem amarração a número de fase.

### `apps/api` (FastAPI)

- API REST com OpenAPI gerado automaticamente
- Tipos TypeScript gerados a partir do OpenAPI (via `openapi-typescript`) e versionados em `packages/types`
- Estrutura interna em boundaries de domínio:

```
apps/api/src/ethitorial/
├── catalog/         # Section, Source, Artifact (Post, Presentation, Slide), Tag
├── identity/        # User, Session, Auth
├── engagement/      # View, Vote, Comment (apontam para Artifact)
├── narration/       # [V2] voice, RAG, Q&A (restrito a Presentation)
├── shared/          # value objects, erros base (Slug, UserId, ArtifactId)
├── platform/        # db, storage, observability adapters
└── main.py          # composition root: registra adapters via Depends
```

**Layout interno: hexagonal pragmática** (ports & adapters), formalizada em [ADR-0004](adr/0004-hexagonal-pragmatica.md). Layout completo para boundaries ricos (`catalog`, `narration`):

```
catalog/
├── domain/           # entities, value_objects, events, exceptions — ZERO framework
├── application/      # ports (typing.Protocol), use_cases, dtos
├── infrastructure/   # adapters: persistence, storage, clock
└── presentation/     # api (router, schemas, dependencies), events
```

Granularidade é proporcional à complexidade do boundary — `identity` é mínimo (delega para provedor externo); `engagement` é reduzido (CRUD com regras simples); `catalog` e `narration` usam o layout completo. Boundaries **não importam diretamente uns dos outros** — comunicação via ports.

Injeção de dependência: **FastAPI `Depends` puro** na composition root. Migrar para container externo só se necessário (ver ADR-0004).

### `packages/`

- **`ui`** — componentes shadcn customizados, reutilizáveis entre páginas
- **`types`** — tipos TypeScript gerados (build artifact versionado para facilitar code review e PRs)

### Persistência

- **Postgres 17** em container Coolify-managed
- Volume persistente local (não em network storage)
- Backups: `pg_dump` diário → Cloudflare R2 via job no Coolify
- Migrations: Alembic, sempre reversíveis, sempre revisadas no PR

### Assets de usuário

- **Cloudflare R2** (S3-compatible, zero egress)
- Estrutura: `r2://ethitorial-assets/{artifact_slug}/{slide_id}/{asset}`
- Upload assinado direto do cliente (presigned URL emitido pela API)

### Observabilidade

- **Sentry** — errors (free tier)
- **Logfire** — logs estruturados + traces (free tier, integra com Pydantic/FastAPI)
- **Uptime Kuma** — uptime self-hosted no Coolify
- **PostHog cloud** — analytics de produto

## Fluxo de deploy

Três portões em sequência, formalizados em [ADR-0005](adr/0005-deploy-checks-em-tres-portoes.md):

```
PORTÃO 1 — Pre-push local (segundos)
└── Lefthook
    ├── ruff format --check + ruff check
    ├── pyright --warnings
    ├── biome check + tsc --noEmit
    ├── pytest / vitest dos arquivos afetados
    ├── gitleaks protect --staged
    └── commitlint (commit-msg)

PORTÃO 2 — On push da branch (minutos) ← GATE REAL
└── GitHub Actions: pr-checks.yml
    ├── lint + typecheck (paralelo)
    ├── test-unit + test-integration + test-e2e
    ├── security-scan (gitleaks + bandit + npm audit)
    ├── coverage-check
    ├── preview-deploy → Coolify
    │   └── comenta no PR: pr-<n>.preview.ethitorial.panlabs.tech
    └── open-pr → abre PR para a main quando os checks ficam verdes
        (se ainda não existir; idempotente. Merge continua humano)

PORTÃO 3 — On merge to main (deploy)
└── GitHub Actions: deploy.yml
    ├── build-images (web + api, paralelo)
    ├── push-to-ghcr
    ├── webhook → Coolify (pull + rolling restart + health check)
    ├── rollback automático se health falha
    ├── post-deploy-smoke-tests
    └── notify-sentry (release marker)
```

**Branch protection na `main`:** PR obrigatório, `required approvals = 0` (dev solo — a revisão humana é o ato de mergear; ver [emenda do ADR-0005](adr/0005-deploy-checks-em-tres-portoes.md#emenda-2026-06-04--review-na-realidade-solo)), todos os checks verdes, branch atualizada com `main`, história linear, sem `force push`.

**Convenção de branches:** regex `^(feat|fix|chore|docs|refactor|test)/.+$` enforced via GitHub Ruleset. Scope (`catalog`, `identity`, etc.) recomendado mas não obrigatório no regex inicial. Detalhe completo no ADR-0005.

**Sem `develop`/`staging`:** preview por PR cobre o caso; `main` sempre deployável.

## Princípios

1. **Boundaries explícitos** > pastas técnicas (`models/`, `controllers/`). A organização espelha o domínio.
2. **Migrations são contratos.** Toda mudança de schema vai junto com a feature que a usa, no mesmo PR.
3. **OpenAPI é a fronteira** entre web e api. Não invente tipos no front que duplicam o back.
4. **Custo previsível** > escalabilidade infinita. Otimize para o caso "10k MAU em VPS única". Cross o ponte serverless quando provar gargalo real.
5. **Open source friendly.** Nada que dependa de SaaS pago para rodar local. Substituível por alternativa FOSS sempre que possível.

## Pontos abertos

- Cache de catálogo: Cloudflare cache padrão ou Redis dedicado? Decidir ao medir.
