# AGENTS.md — Instruções para agentes de IA neste repositório

Este arquivo é a fonte única de instruções operacionais para qualquer agente de IA (Claude Code, OpenAI Codex, GitHub Copilot, Cursor, Aider) trabalhando no `ethitorial`.

Outros arquivos esperados por agentes específicos (`CLAUDE.md`, `.github/copilot-instructions.md`) devem apontar para este. Evite duplicar conteúdo entre eles.

## O que é o ethitorial

Hub pessoal open source de aprendizado que centraliza artefatos intelectuais (posts de blog, notas de cursos, reviews de livros, anotações de certificações e apresentações técnicas) num espaço público de alto padrão visual. A identidade visual é o **protótipo da Direção A "Prensa"** — editorial técnica: masthead tipográfico, hairlines de jornal, serif na prosa, acento laranja como tinta de destaque. Dark-first, leitura sem fricção, navegação por teclado.

**Visão completa:** [docs/VISION.md](docs/VISION.md)
**Alvo de produto (absoluto):** o protótipo da Direção A em `.claude/design/epistemix-redesenho-completo/` — implementá-lo *exatamente* é a missão atual ([ADR-0019](docs/adr/0019-redesenho-prototipo-absoluto-push-feature-completo.md))
**Sistema visual / tokens:** [docs/DESIGN.md](docs/DESIGN.md)
**Glossário e invariantes de domínio:** [docs/CONTEXT.md](docs/CONTEXT.md)
**Arquitetura:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
**Decisões registradas:** [docs/adr/](docs/adr/)
**Execução:** issues do GitHub (fatias vertical-slice via skill `to-issues`, label `agent-ready`). O [docs/ROADMAP.md](docs/ROADMAP.md) faseado foi **aposentado** ([ADR-0019](docs/adr/0019-redesenho-prototipo-absoluto-push-feature-completo.md)) — fica só como histórico e runbook da infra no ar.
**Autonomia dos agentes (AFK):** [ADR-0017](docs/adr/0017-desenvolvimento-autonomo-afk.md) — ler antes de operar MCPs ou implementar feature

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
ethitorial/
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
│   ├── DESIGN.md                   # sistema visual (Direção A "Prensa")
│   ├── CONTEXT.md
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md                  # superseded (histórico) — ver ADR-0019
│   └── adr/
└── .claude/, .agents/              # skills, agents e settings de IA
```

A fundação (infra, CI, Lefthook, branch protection, esqueleto web+api) está **fechada e no ar**. O trabalho corrente é implementar o protótipo da Direção A num **push feature-completo** — ver [ADR-0019](docs/adr/0019-redesenho-prototipo-absoluto-push-feature-completo.md).

## Como rodar

```bash
# Stack completa (web + api + postgres) via Docker
docker compose up --build
# → http://localhost:3000 mostra o status do /health do apps/api

# — ou desenvolvimento local sem Docker —

# Backend (FastAPI em :8000; uv gerencia o Python 3.13)
cd apps/api && uv sync && uv run uvicorn ethitorial.main:app --reload

# Frontend (Next.js em :3000; lê ETHITORIAL_API_URL, default http://localhost:8000)
cd apps/web && pnpm install && pnpm dev

# Apenas o banco local
docker compose up -d postgres
```

## MCPs locais (Claude Code, Codex e Copilot)

- O token Hostinger vive no `.env`; o token Coolify fica inline somente nos três configs reais e gitignored.
- Configs reais são locais e gitignored: `.mcp.json` (Claude Code), `.codex/config.toml` (Codex) e `.vscode/mcp.json` (Copilot Chat local).
- Templates versionados: `.mcp.json.example`, `.codex/config.toml.example` e `.vscode/mcp.json.example`; contêm apenas placeholder para o token Coolify.
- O MCP Hostinger lê `.env` via dotenv; o Coolify recebe o token pelo campo `env` dos configs reais; Cloudflare autentica por OAuth separadamente em cada cliente.
- O Copilot cloud/coding agent não recebe estes MCPs de produção. Ele executa ferramentas autonomamente e não compartilha o ambiente local.
- Setup e validação: [guide 0007](docs/guides/0007-configurar-mcps-multiagente.md).

## Convenções de código

- **Python:** `ruff format` + `ruff check` + `pyright`. Async-first (FastAPI). `uv` para deps. SQLModel para modelos.
- **Arquitetura por boundary:** domain puro (sem framework), ports como `typing.Protocol`, use case por arquivo, mapping explícito apenas onde a tradução é real. DI via FastAPI `Depends`. Ver [ADR-0004](docs/adr/0004-hexagonal-pragmatica.md).
- **TypeScript:** `biome` para format/lint. App Router + RSC sempre que possível. Server Actions para mutations simples; rotas API só quando precisar de webhook ou client externo.
- **Banco:** toda mudança via migration Alembic. Nunca alterar schema direto. Migrations reversíveis sempre.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`). PRs pequenos (~300 LOC alvo).
- **Branches:** `main` protegida. Feature branches casam regex `^(feat|fix|chore|docs|refactor|test)/.+$`. Scope recomendado: nome do boundary (`feat/catalog-...`, `fix/engagement-...`). Push numa branch do padrão roda os checks (Portão 2) e, **quando ficam verdes, abre um PR para a main automaticamente** se ainda não houver um — push seguinte reusa o PR (no-op). Agente pode aplicar `gh pr merge <N> --squash` em PR próprio quando todos os checks requeridos estiverem verdes e não houver conflito; conflito exige atualizar a branch, rerodar CI e só então mergear. Ver [ADR-0005](docs/adr/0005-deploy-checks-em-tres-portoes.md) (emenda 2026-06-12).
- **Pre-push hooks:** Lefthook roda lint + typecheck + tests dos arquivos afetados. `--no-verify` é proibido sem justificativa.

## O que fazer

- Antes de codificar feature nova: ler [docs/CONTEXT.md](docs/CONTEXT.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) e ADRs relevantes.
- Antes de mexer no front: ler [docs/DESIGN.md](docs/DESIGN.md) e conferir a tela correspondente no **protótipo da Direção A** (`.claude/design/`) — ele é o alvo absoluto; divergência resolve a favor do protótipo ([ADR-0019](docs/adr/0019-redesenho-prototipo-absoluto-push-feature-completo.md)).
- Trabalho corrente chega como **issue do GitHub** (fatia vertical-slice, label `agent-ready`), ancorada na tela do protótipo + DESIGN.md/CONTEXT.md. Frente ainda não fatiada: alinhe com o operador e use a skill `to-issues` antes de codar.
- Decisão arquitetural nova: registre um ADR em `docs/adr/NNNN-titulo.md` antes de implementar.
- Mudança em invariante de domínio ou glossário: atualize `docs/CONTEXT.md` no mesmo PR.
- Mudança de comando, layout ou convenção: atualize este `AGENTS.md` no mesmo PR.
- Tests primeiro (TDD assistido) sempre que viável.
- Para validar UI/UX, rode o app de verdade no browser, não confie só em testes verdes.

## O que NÃO fazer

- Não introduzir features V2 do boundary `narration` (voz clonada/TTS + RAG/Q&A) sem ADR — seguem **deferidas** (marcadas *(V2)* no CONTEXT.md); o foco é fechar o protótipo da Direção A primeiro.
- Não acoplar lógica entre boundaries (`catalog`, `identity`, `engagement`, `narration`, `shared`, `platform`). Comunicação via interfaces explícitas, não imports diretos cross-domain.
- Não usar `--no-verify`, `--force` ou desabilitar CI para fechar PR. Falha no hook = consertar a causa.
- Não commitar segredos. Use `.env.example` / `.mcp.json.example`. CI roda `gitleaks` em todo PR. O `.mcp.json` real é gitignored.
- Não executar operação 🔴 de MCP (DNS, firewall, destruir/recriar VM, restore, senhas, deletar recursos, `stop_all_apps`, drop de database) sem o operador — proponha e pare. Merge na `main` é exceção operacional: permitido para PR com CI verde, squash-merge, sem conflito, e com branch protegida aprovando o merge. Ver [ADR-0017](docs/adr/0017-desenvolvimento-autonomo-afk.md).
- Não criar dependência paga adicional sem registrar ADR justificando.

## Skills disponíveis para uso (Claude Code)

Já configuradas em `.agents/skills/`:

- `find-skills` — descobre outras skills disponíveis
- `frontend-design` — apoio à parte visual (CodeWiki-like)
- `grill-me` — entrevistas para refinar planos
- `grill-with-docs` — grilling de plano contra a documentação versionada (atualiza CONTEXT.md/ADRs inline)
- `prompt-engineering-patterns` — padrões para escrever prompts e instruções
- `skill-creator` — criar, editar e avaliar skills
- `solo-dev-assistant` — wrapper de processo solo: `briefing` (digest de sessão), `start`, `cycle`
- `to-issues` — quebra um alinhamento/spec em issues vertical-slice no tracker (substrato de execução atual)
- `tdd` — implementação test-first (red-green-refactor) de cada fatia
- `eptmx` — autoria de conteúdo publicável do catálogo (Posts: blog, nota de curso, review, cert)

Skills nativas do Claude Code para usar regularmente: `init`, `verify`, `simplify`, `review`, `security-review`, `claude-api`, `update-config`.

## Board e fluxo dos agentes

O alvo de produto é o **protótipo da Direção A** (`.claude/design/`); o alvo durável vive em três âncoras — o protótipo, [docs/DESIGN.md](docs/DESIGN.md) (visual) e [docs/CONTEXT.md](docs/CONTEXT.md) (domínio). O **estado de execução vive nas issues do GitHub** — fatias vertical-slice geradas pela skill `to-issues`, com label de triagem `agent-ready`. Não há mais board nem ROADMAP faseado a sincronizar (ver [ADR-0019](docs/adr/0019-redesenho-prototipo-absoluto-push-feature-completo.md); o desenho anterior ROADMAP-as-source fica no [ADR-0014](docs/adr/0014-roadmap-como-source-skill-solo-dev-assistant.md) e o de GitHub Projects no [ADR-0013 R3](docs/adr/0013-substrato-de-planejamento-operado-por-agentes.md) como histórico). O trabalho acontece no VS Code com Claude Code, Copilot e Codex; o despacho é manual.

**Pegar trabalho:** escolha uma issue `agent-ready` sem bloqueio em aberto (respeite o `Blocked by`). O estado vive na própria issue (assignee/labels/comentário/PR com `Closes #N`), não em documento versionado.

**Dependências duras do push atual:** shell/tokens antes de tudo → catálogo antes dos derivados (now-learning, cronologia, grafo) e da busca → auth antes de voto/comentário → 1ª migration + Postgres antes de view/voto/comentário.

Princípios evergreen do desenho de planejamento (ainda úteis como história): [lesson 0002](docs/lessons/0002-harness-basico-em-github-projects.md).

## Autonomia dos agentes (AFK)

Modelo completo em [ADR-0017](docs/adr/0017-desenvolvimento-autonomo-afk.md). Resumo operacional — **HITL nas bordas, AFK no meio**.

Princípio raiz: **reversível e de baixo impacto → o agente faz sozinho; irreversível, destrutivo ou que toca produção de forma não-recuperável → o agente propõe e para. Na dúvida, trate como 🔴.**

### Ops via MCP (Hostinger / Coolify / Cloudflare) — semáforo

Classifique **pelo efeito**, não decorando a lista de tools:

- 🟢 **Verde — faz sempre, sozinho.** Leitura e diagnóstico: `get*`/`list*`/`*logs*`/`*metrics*`/`diagnose_*`/`search`. Sem efeito colateral.
- 🟡 **Amarelo — faz sozinho e registra em [docs/ai-ops/](docs/ai-ops/).** Efeito reversível ou rotina de deploy:
  - Criar recurso no Coolify (banco Postgres/Redis, app, serviço) e provisionar com `instant_deploy`
  - Snapshot / backup pontual
  - Env vars de runtime (incluindo **segredos geráveis por máquina**: senha de DB, session secret, token de API gerado via MCP) — gera, seta via MCP e registra no ai-ops; nunca commita
  - `deploy`/`redeploy`/`restart` de app ou serviço existente
  - Rodar `alembic upgrade head` (migration para frente) após deploy; emitir `alembic downgrade` apenas uma revisão atrás se reverter PR ainda fresco
  - Purge de cache Cloudflare
  - Atualizar `post_deployment_command` de uma app para automação de migrations
- 🔴 **Vermelho — propõe e espera o operador.** Irreversível/destrutivo: DNS/nameservers, regras de firewall, recriar/destruir/comprar VM, restaurar backup por cima de produção, senhas root/panel, `delete*` de recurso persistente, `stop_all_apps`, `alembic downgrade` para revisão anterior ao deploy atual (possível perda de dados), **segredo emitido por terceiro** (`client_secret` OAuth, API key paga externa). Para segredos de terceiro: faça a parte sem o segredo e **documente o comando exato** para o operador aplicar — não trave a sessão.

### Feature-dev — fluxo AFK

1. 🔴 **Alinhar** (`grill-me`/`grill-with-docs`) — o operador define o *o quê*; o protótipo da Direção A é o alvo absoluto.
2. 🟡 **Fatiar** em **issues vertical-slice** (skill `to-issues`, label `agent-ready`) — cada issue atravessa schema→API→UI→testes→e2e, ancorada na tela do protótipo + DESIGN.md/CONTEXT.md. (Spec em [docs/specs/](docs/specs/) só para frentes grandes que pedem detalhamento extra.)
3. 🟢 **Implementar** — cada issue num **git worktree** dedicado, com TDD, até **PR verde**. Pode encadear issues como PRs separados. **Não mergeia.**
4. 🟡 **Mergear** — se CI estiver verde, branch atualizada, sem conflito e o GitHub permitir, o agente aplica squash-merge. Se houver conflito, atualiza a branch, reroda CI e só mergeia verde.

> ✅ A fundação (skeleton + CI + Lefthook + branch protection) está **fechada e no ar**, então o AFK de feature é plenamente executável: cada fatia conta com o Portão 2 (checks no push) como portão real de auto-verificação.

## Para Claude Code, especificamente

- Memórias auto-salvas locais (fora deste repo) devem conter apenas perfil do usuário e feedback de colaboração — NUNCA decisões de projeto. Decisões de projeto vivem em `docs/`.
- Antes de propor algo que contradiz um ADR existente, leia o ADR e proponha uma atualização explícita do ADR (ou novo ADR de revisão).
