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
- **Autonomia, fluxo de implementação, issues e skills** → [docs/agents/workflow.md](docs/agents/workflow.md) (resumo de [ADR-0010](docs/adr/0010-desenvolvimento-autonomo-afk.md)) — **ler antes de operar MCPs ou implementar**
- **Design system para agentes** → [docs/agents/design.md](docs/agents/design.md)
- **Setup de MCPs locais** → [docs/agents/mcps.md](docs/agents/mcps.md)

## Stack (decisões em ADRs)

Backend **Python 3.13 + FastAPI + SQLAlchemy 2.0 (async) + Alembic** ([ADR-0002](docs/adr/0002-stack-fastapi-nextjs-postgres.md)). Frontend **Next.js 15** (App Router) + React 19 + TypeScript + Tailwind 4; catálogo MDX-native (next-mdx-remote + Shiki). Auth via **better-auth** ([ADR-0011](docs/adr/0011-auth-better-auth.md)). **Postgres 17**. Monorepo com boundaries de domínio explícitos ([ADR-0001](docs/adr/0001-monorepo-and-boundaries.md)); estilo hexagonal pragmático como alvo interno ([ADR-0004](docs/adr/0004-hexagonal-pragmatica.md)). Infra VPS Hostinger + Coolify + Cloudflare ([ADR-0003](docs/adr/0003-infra-hostinger-vps-coolify.md), [ADR-0006](docs/adr/0006-cloudflare-na-frente-da-vps.md)). Deploy em três portões ([ADR-0005](docs/adr/0005-deploy-checks-em-tres-portoes.md)).

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

## Modo de implementação autônoma

Quando o operador disser "implementa as issues" (ou equivalente), o default — **sem precisar reafirmar autonomia nem ferramenta a cada vez**: pegar issues `agent-ready` sem bloqueio → um **git worktree** por issue → TDD em **modo de economia de token** → autonomia total até o **merge do PR verde** → encadear até as issues acabarem, **parando só se o operador pedir** (ex.: para compactar contexto). Fluxo detalhado em [docs/agents/workflow.md](docs/agents/workflow.md).

## Prompts entregáveis (convenção)

Sempre que o operador pedir "um prompt" (para outra sessão, outro repo ou uma tarefa futura), **salve-o como arquivo em `prompts/`** na convenção `AAAAMMDDHHMMSS_slug-kebab.md` (timestamp via `date +%Y%m%d%H%M%S`; corpo em pt-BR começando por `# Título`, sem frontmatter). Entregar só inline no chat não basta — o arquivo é o entregável.

## Regras de ouro (não-negociáveis)

- **Autonomia total no escopo do projeto — para só em 4 casos.** Implementar, deploy, redeploy, env, segredo gerável por máquina, migration, criar/dropar recurso próprio no Coolify e **merge de PR verde** são a norma: faça sozinho. Pare e chame o operador apenas se a operação (1) o **trancaria pra fora** (senha root/painel, firewall, token que o MCP usa), (2) **recriaria a VM**, (3) **exige segredo de terceiro** (OAuth/console), ou (4) **tocaria outro projeto** no Coolify compartilhado. Detalhe em [ADR-0010](docs/adr/0010-desenvolvimento-autonomo-afk.md) e [workflow.md](docs/agents/workflow.md).
- **Não commitar segredos.** Use `.env.example` / `.mcp.json.example`. CI roda `gitleaks`. O `.mcp.json` real é gitignored.
- **Não usar `--no-verify` / `--force`** nem desabilitar CI para fechar PR. Falha de hook = consertar a causa.
- **Não acoplar lógica cross-boundary** (`catalog`, `identity`, `engagement`, `narration`, `shared`, `platform`) — interfaces explícitas, nunca imports diretos.
- **Não introduzir features V2 do boundary `narration`** (voz/TTS + RAG/Q&A) sem ADR — seguem deferidas (CONTEXT.md). O foco visual corrente é preservar e estender o contrato as-built da Direção A.
- **Não criar dependência paga** sem registrar ADR justificando.
- **Antes de contradizer um ADR:** leia-o e proponha atualização explícita (ou novo ADR de revisão).

## Para Claude Code

No modo de implementação autônoma, "economia de token" = rodar a skill `caveman` em full mode por padrão (instanciação Claude do princípio; Codex/Copilot usam o equivalente de cada um).

Memórias auto-salvas locais (fora deste repo) contêm apenas perfil do usuário e feedback de colaboração — **nunca** decisões de projeto. Decisões de projeto vivem em `docs/`.
