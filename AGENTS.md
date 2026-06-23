# AGENTS.md — Instruções para agentes de IA no ethitorial

Fonte única de instruções operacionais para qualquer agente de IA (Claude Code, Codex, Copilot, Cursor, Aider). `CLAUDE.md` e `.github/copilot-instructions.md` apontam para cá — não duplique conteúdo.

> **Mantenha este arquivo enxuto:** ele carrega em toda sessão. O detalhe operacional mora em `docs/agents/` e é lido **sob demanda**.

## O que é o ethitorial

Hub pessoal open source de aprendizado que centraliza artefatos intelectuais (posts de blog, notas de cursos, reviews de livros, anotações de certificações e apresentações técnicas) num espaço público de alto padrão visual. Identidade visual: **Direção A "Prensa"** as-built — editorial técnica (masthead tipográfico, hairlines de jornal, serif na prosa, acento laranja como tinta de destaque). Dark-first, leitura sem fricção, navegação por teclado.

## Orientação (ler antes de trabalho substantivo)

- **Visão / posicionamento** → [docs/VISION.md](docs/VISION.md)
- **Glossário + invariantes de domínio** → [docs/CONTEXT.md](docs/CONTEXT.md)
- **Sistema visual / tokens** → [docs/design/README.md](docs/design/README.md) (entrada de compatibilidade: [docs/DESIGN.md](docs/DESIGN.md))
- **Arquitetura** (monorepo + hexagonal) → [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Decisões registradas** → [docs/adr/](docs/adr/README.md)
- **Contrato visual as-built** → código vivo + [docs/design/](docs/design/README.md). O bundle congelado em `.claude/design/epistemix-redesenho-completo/` é origem creditada, não fonte-da-verdade.

## Instruções operacionais (`docs/agents/`, sob demanda)

- **Convenções de código e git** → [docs/agents/conventions.md](docs/agents/conventions.md)
- **Autonomia AFK + semáforo de ops MCP** → [docs/agents/afk-ops.md](docs/agents/afk-ops.md) (resumo de [ADR-0017](docs/adr/0017-desenvolvimento-autonomo-afk.md)) — **ler antes de operar MCPs**
- **Design system para agentes** → [docs/agents/design.md](docs/agents/design.md)
- **Setup de MCPs locais** → [docs/agents/mcps.md](docs/agents/mcps.md)
- **Fluxo de trabalho, issues e skills** → [docs/agents/workflow.md](docs/agents/workflow.md)

## Stack (decisões em ADRs)

Backend **Python 3.13 + FastAPI + SQLModel + Alembic** ([ADR-0002](docs/adr/0002-stack-fastapi-nextjs-postgres.md)). Frontend **Next.js 15** (App Router) + TypeScript + Tailwind 4 + shadcn/ui. **Postgres 17**. Monorepo com boundaries explícitos ([ADR-0001](docs/adr/0001-monorepo-and-boundaries.md)), hexagonal pragmática ([ADR-0004](docs/adr/0004-hexagonal-pragmatica.md)). Infra VPS Hostinger + Coolify + Cloudflare ([ADR-0003](docs/adr/0003-infra-hostinger-vps-coolify.md), [ADR-0006](docs/adr/0006-cloudflare-na-frente-da-vps.md)). Deploy em três portões ([ADR-0005](docs/adr/0005-deploy-checks-em-tres-portoes.md)).

A fundação (infra, CI, Lefthook, branch protection, esqueleto web+api) está **fechada e no ar**. O redesign da Direção A está implementado; trabalho visual futuro parte do contrato as-built em [docs/design/](docs/design/README.md).

## Como rodar

```bash
# Stack completa (web + api + postgres) via Docker
docker compose up --build           # → http://localhost:3000

# — ou local sem Docker —
cd apps/api && uv sync && uv run uvicorn ethitorial.main:app --reload   # API :8000
cd apps/web && pnpm install && pnpm dev                                 # web :3000 (lê ETHITORIAL_API_URL)
docker compose up -d postgres        # só o banco local
```

## Regras de ouro (não-negociáveis)

- **🔴 Não executar operação destrutiva/irreversível de MCP** (DNS destrutivo, firewall, destruir/recriar VM, restore, senhas, `delete*` de recurso, `stop_all_apps`, drop de DB) sem o operador — proponha e pare. Faixas 🟡/🟢 e exceções em [docs/agents/afk-ops.md](docs/agents/afk-ops.md). Squash-merge de PR próprio na `main` (CI verde, sem conflito) é exceção permitida.
- **Não commitar segredos.** Use `.env.example` / `.mcp.json.example`. CI roda `gitleaks`. O `.mcp.json` real é gitignored.
- **Não usar `--no-verify` / `--force`** nem desabilitar CI para fechar PR. Falha de hook = consertar a causa.
- **Não acoplar lógica cross-boundary** (`catalog`, `identity`, `engagement`, `narration`, `shared`, `platform`) — interfaces explícitas, nunca imports diretos.
- **Não introduzir features V2 do boundary `narration`** (voz/TTS + RAG/Q&A) sem ADR — seguem deferidas (CONTEXT.md). O foco visual corrente é preservar e estender o contrato as-built da Direção A.
- **Não criar dependência paga** sem registrar ADR justificando.
- **Antes de contradizer um ADR:** leia-o e proponha atualização explícita (ou novo ADR de revisão).

## Para Claude Code

Memórias auto-salvas locais (fora deste repo) contêm apenas perfil do usuário e feedback de colaboração — **nunca** decisões de projeto. Decisões de projeto vivem em `docs/`.
