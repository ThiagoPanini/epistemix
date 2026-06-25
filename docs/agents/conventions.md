# Convenções de código

Padrões de código e git para qualquer agente trabalhando no `ethitorial`. Carregado sob demanda pelo [AGENTS.md](../../AGENTS.md).

## Linguagens

- **Python** (`apps/api`): `ruff format` + `ruff check` + `pyright`. Async-first (FastAPI). `uv` para deps. SQLAlchemy 2.0 (async) para modelos e queries.
- **TypeScript** (`apps/web`): `biome` para format/lint. App Router + RSC sempre que possível. Server Actions só para concerns do Next; mutations de domínio vão na FastAPI ([ADR-0004](../adr/0004-hexagonal-pragmatica.md)). Rotas API só para webhook ou client externo.

## Arquitetura por boundary

- Domain puro (sem framework), ports como `typing.Protocol`, use case por arquivo, mapping explícito apenas onde a tradução é real. DI via FastAPI `Depends`. Granularidade proporcional à complexidade. Ver [ADR-0004](../adr/0004-hexagonal-pragmatica.md) e [ADR-0001](../adr/0001-monorepo-and-boundaries.md).
- Não acoplar lógica entre boundaries (`catalog`, `identity`, `engagement`, `narration`, `shared`, `platform`) — comunicação via interfaces explícitas, nunca imports diretos cross-domain.

## Banco

Toda mudança de schema via migration Alembic. Nunca alterar schema direto. Migrations reversíveis sempre.

## Git

- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`). PRs pequenos (~300 LOC alvo).
- **Branches:** `main` protegida. Feature branches casam `^(feat|fix|chore|docs|refactor|test)/.+$`. Scope recomendado: nome do boundary (`feat/catalog-...`, `fix/engagement-...`).
- **Portão 2:** push numa branch do padrão roda os checks e, no verde, abre um PR para a `main` automaticamente se ainda não houver um — push seguinte reusa o PR (no-op). Ver [ADR-0005](../adr/0005-deploy-checks-em-tres-portoes.md).
- **Pre-push (Lefthook):** lint + typecheck + tests dos arquivos afetados. `--no-verify` e `--force` proibidos sem justificativa.
