# AGENTS.md — Instruções para agentes de IA neste repositório

Este arquivo é a fonte única de instruções operacionais para qualquer agente de IA (Claude Code, OpenAI Codex, GitHub Copilot, Cursor, Aider) trabalhando no `talkingpres`.

Outros arquivos esperados por agentes específicos (`CLAUDE.md`, `.github/copilot-instructions.md`) devem apontar para este. Evite duplicar conteúdo entre eles.

## O que é o talkingpres

SaaS open source que centraliza apresentações técnicas (software, AI, dados, SRE) num catálogo público com design refinado (referência: codewiki.google, dark first, gradientes leves, animações elegantes mas não extravagantes).

**Visão completa:** [docs/VISION.md](docs/VISION.md)
**Roadmap por fases:** [docs/ROADMAP.md](docs/ROADMAP.md)
**Glossário e invariantes de domínio:** [docs/CONTEXT.md](docs/CONTEXT.md)
**Arquitetura:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
**Decisões registradas:** [docs/adr/](docs/adr/)

## Stack (decisões registradas em ADRs)

- **Backend:** Python 3.13 + FastAPI + SQLAlchemy 2/SQLModel + Alembic + Pydantic v2 — ver [ADR-0002](docs/adr/0002-stack-fastapi-nextjs-postgres.md)
- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind 4 + shadcn/ui + Framer Motion
- **Banco:** PostgreSQL 17
- **Infra:** VPS Hostinger + Coolify + Cloudflare na frente — ver [ADR-0003](docs/adr/0003-infra-hostinger-vps-coolify.md) e [ADR-0006](docs/adr/0006-cloudflare-na-frente-da-vps.md)
- **Monorepo** com boundaries de domínio explícitos — ver [ADR-0001](docs/adr/0001-monorepo-and-boundaries.md)
- **Arquitetura interna:** hexagonal pragmática (ports & adapters) com granularidade proporcional à complexidade — ver [ADR-0004](docs/adr/0004-hexagonal-pragmatica.md)
- **Deploy:** três portões (pre-push local, on PR, on merge) — ver [ADR-0005](docs/adr/0005-deploy-checks-em-tres-portoes.md)

## Layout do repositório (alvo)

```
talkingpres/
├── AGENTS.md                       # este arquivo
├── CLAUDE.md                       # importa AGENTS.md
├── README.md
├── LICENSE
├── apps/
│   ├── web/                        # Next.js 15
│   └── api/                        # FastAPI
├── packages/
│   ├── ui/                         # componentes shadcn compartilhados
│   └── types/                      # tipos TS gerados via OpenAPI
├── docs/
│   ├── VISION.md
│   ├── ROADMAP.md
│   ├── CONTEXT.md
│   ├── ARCHITECTURE.md
│   └── adr/
└── .claude/, .agents/              # skills, agents e settings de IA
```

Estrutura atual ainda em construção — Fase 0 do roadmap está em andamento.

## Como rodar (placeholder — preencher na Fase 0)

```bash
# Backend
cd apps/api && uv sync && uv run uvicorn talkingpres.main:app --reload

# Frontend
cd apps/web && pnpm install && pnpm dev

# Banco local
docker compose up -d postgres
```

## Convenções de código

- **Python:** `ruff format` + `ruff check` + `pyright`. Async-first (FastAPI). `uv` para deps. SQLModel para modelos.
- **Arquitetura por boundary:** domain puro (sem framework), ports como `typing.Protocol`, use case por arquivo, mapping explícito apenas onde a tradução é real. DI via FastAPI `Depends`. Ver [ADR-0004](docs/adr/0004-hexagonal-pragmatica.md).
- **TypeScript:** `biome` para format/lint. App Router + RSC sempre que possível. Server Actions para mutations simples; rotas API só quando precisar de webhook ou client externo.
- **Banco:** toda mudança via migration Alembic. Nunca alterar schema direto. Migrations reversíveis sempre.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`). PRs pequenos (~300 LOC alvo).
- **Branches:** `main` protegida. Feature branches casam regex `^(feat|fix|chore|docs|refactor|test)/.+$`. Scope recomendado: nome do boundary (`feat/catalog-...`, `fix/engagement-...`). Ver [ADR-0005](docs/adr/0005-deploy-checks-em-tres-portoes.md).
- **Pre-push hooks:** Lefthook roda lint + typecheck + tests dos arquivos afetados. `--no-verify` é proibido sem justificativa.

## O que fazer

- Antes de codificar feature nova: ler [docs/CONTEXT.md](docs/CONTEXT.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) e ADRs relevantes.
- Decisão arquitetural nova: registre um ADR em `docs/adr/NNNN-titulo.md` antes de implementar.
- Mudança em invariante de domínio ou glossário: atualize `docs/CONTEXT.md` no mesmo PR.
- Mudança de comando, layout ou convenção: atualize este `AGENTS.md` no mesmo PR.
- Tests primeiro (TDD assistido) sempre que viável.
- Para validar UI/UX, rode o app de verdade no browser, não confie só em testes verdes.

## O que NÃO fazer

- Não introduzir features da Fase 4 (voz/RAG) antes da Fase 3 estar fechada. Veja [docs/ROADMAP.md](docs/ROADMAP.md).
- Não acoplar lógica entre boundaries (`catalog`, `identity`, `engagement`, `narration`, `shared`, `platform`). Comunicação via interfaces explícitas, não imports diretos cross-domain.
- Não usar `--no-verify`, `--force` ou desabilitar CI para fechar PR. Falha no hook = consertar a causa.
- Não commitar segredos. Use `.env.example`. CI roda `gitleaks` em todo PR.
- Não criar dependência paga adicional sem registrar ADR justificando.

## Skills disponíveis para uso (Claude Code)

Já configuradas em `.agents/skills/`:

- `find-skills` — descobre outras skills disponíveis
- `frontend-design` — apoio à parte visual (CodeWiki-like)
- `grill-me` — entrevistas para refinar planos
- `grill-with-docs` — grilling sobre documentação versionada
- `git-commit` — fluxo de commits

Skills nativas do Claude Code para usar regularmente: `init`, `verify`, `simplify`, `review`, `security-review`, `claude-api`, `update-config`.

## Board e fluxo dos agentes

O trabalho é rastreado num GitHub Projects (ver [ADR-0013](docs/adr/0013-substrato-de-planejamento-operado-por-agentes.md)). **Para operar o board — descobrir, reivindicar, executar, submeter ou bloquear tarefas — use a skill `operate-planning-board`** (`.agents/skills/`, lida por Claude Code, Codex e Copilot); não toque na API do board direto. O protocolo e os scripts vivem na skill (fonte única); a decisão e o porquê, no ADR-0013. Princípios evergreen do desenho: [lesson 0002](docs/lessons/0002-harness-basico-em-github-projects.md).

## Para Claude Code, especificamente

- Memórias auto-salvas locais (fora deste repo) devem conter apenas perfil do usuário e feedback de colaboração — NUNCA decisões de projeto. Decisões de projeto vivem em `docs/`.
- Antes de propor algo que contradiz um ADR existente, leia o ADR e proponha uma atualização explícita do ADR (ou novo ADR de revisão).
