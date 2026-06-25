# Arquitetura — ethitorial

Documento vivo. O corpo descreve **só o que roda hoje** (as-built); planos genuínos ainda não materializados ficam isolados na seção [Pretendido (não construído)](#pretendido-não-construído). Mudanças significativas vêm acompanhadas de ADR.

## Visão de topo

```
                          ┌────────────────────┐
                          │   Cloudflare       │
                          │  DNS + CDN + WAF   │
                          └─────────┬──────────┘
                                    │
                          ┌─────────▼──────────┐
                          │  VPS Hostinger     │
                          │                    │
                          │  ┌──────────────┐  │
                          │  │   Coolify    │  │
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
                          └────────────────────┘
```

Cloudflare na frente da VPS — ver [ADR-0006](adr/0006-cloudflare-na-frente-da-vps.md). Infra Hostinger + Coolify — ver [ADR-0003](adr/0003-infra-hostinger-vps-coolify.md).

## Camadas e responsabilidades

### `apps/web` (Next.js 15)

App Router em `apps/web/app/` e bibliotecas em `apps/web/lib/` — **não há diretório `src/`**.

- Renderiza o catálogo público (RSC).
- **Catálogo MDX-native — ver [ADR-0001](adr/0001-monorepo-and-boundaries.md):** o catálogo (Section/Source/Artifact/Tag) é lido direto de `content/**/*.mdx` (+ `sections.yml`/`tags.yml`) em RSC/build-time, **sem passar pela API**. A leitura, o schema e o domínio vivem em `apps/web/lib/catalog/` (`catalog.ts`, `schema.ts`, `domain.ts`, `reserved.ts`); o parse usa `gray-matter` + `js-yaml`, e a renderização MDX usa `next-mdx-remote` com `remark-gfm` e `rehype-pretty-code`/`shiki`.
- Auth via **better-auth** (`apps/web/lib/auth.ts`, `auth-client.ts`) com Postgres como store — ver [ADR-0011](adr/0011-auth-better-auth.md). UI de auth, perfil, votos e comentários.
- Operações **dinâmicas** de domínio (voto, comentário, view, sessão de auth) chegam à API por **route handlers de proxy** em `apps/web/app/api/{auth,comments,views,votes}/` — `fetch` manual para `apps/api`, sem cliente gerado.
- Assets de conteúdo locais são servidos por `apps/web/app/content-assets/`.

### `apps/api` (FastAPI)

API REST com OpenAPI gerado automaticamente pelo FastAPI. Dependências de runtime: `fastapi`, `uvicorn`, `sqlalchemy[asyncio]`, `asyncpg`, `alembic` (ver `apps/api/pyproject.toml`).

Estrutura interna (achatada, **sem** layout hexagonal de 4 pastas):

```
apps/api/src/ethitorial/
├── db.py            # engine + session async (SQLAlchemy 2.0, DeclarativeBase)
├── main.py          # FastAPI app: todos os endpoints + DI via Depends
├── identity/        # models.py (AuthUser/AuthSession), dependencies.py (Depends de auth)
└── engagement/      # models.py, votes.py, views.py, comments.py
```

Só existem dois boundaries: `identity` e `engagement`. Cada um é um punhado de arquivos planos — **não há subpastas `domain/`/`application/`/`infrastructure/`/`presentation/`**. Os endpoints HTTP moram todos em `main.py`; os casos de uso são funções nos módulos do boundary.

Persistência: **SQLAlchemy 2.0 async puro** (`DeclarativeBase`, `Mapped`/`mapped_column`, `AsyncSession`) — **não há SQLModel**. Pydantic aparece só como `BaseModel` de payload em `main.py` (via FastAPI), não como camada de modelo. `identity` mapeia as tabelas do better-auth (`auth_user`, `auth_session`, …); a app web e a API compartilham o mesmo Postgres.

Injeção de dependência: **FastAPI `Depends` puro** (`get_current_user`, `require_auth` em `identity/dependencies.py`). A hexagonal pragmática como rumo de evolução está em [ADR-0004](adr/0004-hexagonal-pragmatica.md) (que também absorve o uso restrito de Server Actions para concerns do Next).

> **Dívida conhecida:** `engagement` importa `from ethitorial.identity.models import AuthUser` direto (em `comments.py` e `main.py`) — acoplamento cross-boundary sem port, contra a regra de ouro do AGENTS.md. Aceitável enquanto a API é mínima; revisitar ao crescer.

### Persistência

- **Postgres 17** em container (Coolify em produção; `docker-compose.yml` localmente).
- Volume persistente local (`pgdata`).
- Migrations: **Alembic** (async), versionadas em `apps/api/alembic/versions/` e revisadas no PR. Hoje há três: schema de engagement, schema de auth (identity) e um fix de tipo de `user_id`.

## Fluxo de deploy

Três portões em sequência, formalizados em [ADR-0005](adr/0005-deploy-checks-em-tres-portoes.md). Descrição abaixo reflete os arquivos reais (`lefthook.yml`, `.github/workflows/pr-checks.yml`, `.github/workflows/deploy.yml`).

```
PORTÃO 1 — Pre-push local (Lefthook)
├── pre-commit:  gitleaks git --staged (segredos)
├── commit-msg:  commitlint
└── pre-push (paralelo):
    ├── api: ruff format --check, ruff check, pyright --warnings, pytest -m "not integration"
    └── web: biome check apps/web, tsc --noEmit (typecheck)

PORTÃO 2 — Push da branch de trabalho (GATE REAL) → pr-checks.yml
├── web:      biome check + typecheck (tsc)
├── api:      ruff format --check + ruff check + pyright --warnings + pytest -m "not integration"
├── security: gitleaks (apenas)
└── open-pr:  needs[web,api,security] → abre PR para a main se não existir (idempotente; o agente mergeia no verde)

PORTÃO 3 — Push na main → deploy.yml
├── build-push (matrix web+api): build das imagens → GHCR
└── deploy (coolify): guardado por COOLIFY_TOKEN → webhook de redeploy + smoke test (curl em ethitorial.panlabs.tech)
```

Não há, hoje, jobs de teste de integração/e2e, coverage gate, bandit/npm-audit, preview-deploy por PR, rollback automático nem release marker — o próprio `pr-checks.yml` registra que esses entram "quando houver código que os justifique".

**Branch protection na `main`:** PR obrigatório, `required approvals = 0` (dev solo — mergear é a revisão), checks verdes, branch atualizada, história linear, sem force push (ver [ADR-0005](adr/0005-deploy-checks-em-tres-portoes.md) e sua emenda). Abertura automática de PR e merge de PR verde são autônomos ([ADR-0010](adr/0010-desenvolvimento-autonomo-afk.md), [ADR-0005](adr/0005-deploy-checks-em-tres-portoes.md) emenda).

**Sem `develop`/`staging`:** `main` sempre deployável.

## Princípios

1. **Boundaries explícitos** > pastas técnicas. A organização espelha o domínio (modelo em [ADR-0009](adr/0009-modelo-de-dominio.md)).
2. **Migrations são contratos.** Mudança de schema vai junto com a feature, no mesmo PR.
3. **Catálogo é conteúdo, não dado dinâmico.** O catálogo nasce de MDX em build-time; só engagement/auth falam com a API.
4. **Custo previsível** > escalabilidade infinita. Otimize para "VPS única"; cruze a ponte serverless só ao provar gargalo real.
5. **Open source friendly.** Nada que dependa de SaaS pago para rodar local.

## Pretendido (não construído)

Itens abaixo são planos genuínos e **não existem no código hoje**. Só viram realidade com ADR/PR próprios.

- **`packages/`** — nenhum workspace de pacotes compartilhados existe. Pretende-se `packages/ui` (componentes shadcn reusáveis) e `packages/types` (tipos TS gerados do OpenAPI via `openapi-typescript`). Hoje o web fala com a API por proxy + `fetch` manual, sem cliente gerado.
- **Mais boundaries no `apps/api`** — `catalog` (adapter MDX→Postgres atrás de port, para a futura migração CMS), `narration` (voz/TTS + RAG/Q&A, V2 deferida — ver CONTEXT.md), além de `shared` (value objects/erros base) e `platform` (adapters de db/storage/observabilidade). Hoje só `identity` e `engagement`, com `db.py` no topo.
- **Layout hexagonal de 4 pastas** (`domain`/`application`/`infrastructure`/`presentation`) para boundaries ricos — rumo do [ADR-0004](adr/0004-hexagonal-pragmatica.md), ainda não aplicado a nenhum boundary.
- **Observabilidade** — Sentry (errors), Logfire (logs/traces), Uptime Kuma (uptime self-hosted), PostHog (analytics). Nenhuma integração no código (sem dependências correspondentes).
- **Assets de usuário via Cloudflare R2** (S3-compatible) com upload assinado direto do cliente (presigned URL emitido pela API). Não há cliente S3/R2 nem endpoint de presigned; assets de conteúdo são servidos localmente pelo web.
- **Backups** — `pg_dump` diário para armazenamento externo (ex.: R2) via job no Coolify.

## Pontos abertos

- Cache de catálogo: Cloudflare cache padrão ou Redis dedicado? Decidir ao medir.
