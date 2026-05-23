# ADR 0005 — Estratégia de deploy: checks em três portões

- **Status:** Accepted
- **Data:** 2026-05-23
- **Decisores:** Thiago Panini (solo)
- **Relacionado:** [ADR-0003](0003-infra-hostinger-vps-coolify.md)

## Contexto

O ADR-0003 define infra (VPS Hostinger + Coolify + Cloudflare). Falta definir o **fluxo de promoção de código até produção** e em que pontos rodam quais checks.

Princípios:

- Erro barato (lint, format, type, unit test) deve ser pego o mais cedo possível, no local do desenvolvedor.
- Erro caro (integration, e2e, segurança) deve ser pego antes do merge na `main`.
- `main` está sempre deployável; merge na `main` dispara deploy em produção automaticamente.
- Sem ambiente intermediário (`develop`/`staging`) na V1; preview environments por PR cobrem o caso.

## Decisão

**Três portões sequenciais**:

### Portão 1 — Pre-push local (segundos)

Roda na máquina do dev antes do push subir para o GitHub.

| Check | Ferramenta |
|---|---|
| Format Python | `ruff format --check` |
| Lint Python | `ruff check` |
| Types Python (modo rápido) | `pyright --warnings` |
| Format/lint TS | `biome check` |
| Types TS | `tsc --noEmit` |
| Unit tests **arquivos afetados** | `pytest -m "not integration"` + `vitest run --changed` |
| Segredos | `gitleaks protect --staged` |
| Conventional commits (no commit-msg) | `commitlint` |

**Orquestrador: [Lefthook](https://github.com/evilmartians/lefthook).** Single binary Go, parallel-first, language-agnostic. Config em `lefthook.yml` na raiz.

Pre-push hooks são **conveniência, não segurança** — podem ser pulados com `--no-verify`. Por isso o portão 2 existe.

### Portão 2 — On PR / push to feature branch (minutos)

GitHub Actions workflow `pr-checks.yml`. **Esta é a gate real.**

```
pr-checks.yml
├── lint-and-format (paralelo)
├── typecheck (paralelo)
├── test-unit (paralelo, com cobertura)
├── test-integration (Postgres em service container)
├── test-e2e (Playwright contra preview deploy)
├── security-scan (gitleaks + bandit + npm audit)
├── coverage-check (mínimo configurável, e.g., 80%)
└── preview-deploy → Coolify cria ambiente efêmero
    └── comenta no PR: https://pr-<n>.preview.talkingpres.com
```

**Branch protection na `main`:**
- PR obrigatório
- Code owner review obrigatória
- Todos os checks acima verdes
- Branch atualizada com `main` (rebase ou squash-merge)
- Sem `force push`

### Portão 3 — On merge to main (deploy)

GitHub Actions workflow `deploy.yml`.

```
deploy.yml
├── build-images (paralelo: web, api)
├── push-to-ghcr
├── webhook → Coolify
│   ├── pull image
│   ├── rolling restart com health check
│   └── rollback automático se health falha
├── post-deploy-smoke-tests
└── notify-sentry (release marker associando errors ao SHA)
```

### Convenção de branches

Regex obrigatório: `^(feat|fix|chore|docs|refactor|test)/(catalog|identity|engagement|narration|shared|platform|infra|ci|ux|web|api)?-?.+$`

| Prefixo | Quando |
|---|---|
| `feat/<scope>-<slug>` | Nova funcionalidade |
| `fix/<scope>-<slug>` | Bug fix |
| `chore/<slug>` | Manutenção, deps, configs |
| `docs/<slug>` | Só docs |
| `refactor/<scope>-<slug>` | Refactor sem mudança de comportamento |
| `test/<scope>-<slug>` | Só testes |

Convenção dá hook para automação futura (ex.: PRs `feat/catalog-*` solicitam review do agent `domain-modeler`). Enforcement via GitHub Ruleset.

### Conventional Commits

Obrigatório no commit-msg hook (Lefthook + `commitlint`). PRs com squash-merge consolidam mensagens limpas para `CHANGELOG`.

## Justificativa

**Lefthook vs alternativas:**

| Opção | Por quê |
|---|---|
| **Lefthook (escolhido)** | Single binary Go, parallel-first, YAML simples, language-agnostic — perfeito para monorepo Python+TS |
| pre-commit | Padrão Python, mas mais lento, mais opinativo, paralelismo limitado |
| Husky | Padrão JS, força Node como dep de hooks Python — ruim para polyglot |
| Hooks Git puros | Sem cache, manutenção alta, sem cross-platform |

**Sem `develop`/`staging`:** sobrecarga de manter ambiente intermediário não compensa em solo dev. Preview por PR resolve "ver antes de produção". `main` deployável a qualquer momento é objetivo, não obstáculo.

**Squash-merge como padrão:** história linear, fácil de bisectar, mensagens limpas. Merge commit só em casos excepcionais (release branches).

## Consequências

### Positivas
- Defesa em profundidade: 3 oportunidades de pegar erro antes de prod
- Feedback rápido local (segundos), não dependente de CI
- Preview por PR permite revisão visual antes do merge
- Convenção de branches/commits dá ganchos para automação futura
- Sem ambiente intermediário = uma coisa a menos para manter

### Negativas
- Setup inicial não-trivial (Lefthook + 2 workflows + branch protection + commitlint)
- Lefthook precisa ser instalado por cada dev (mitigado via `npm run prepare` ou script de bootstrap)
- E2E em CI é flake-prone (mitigar com retries + isolamento de DB por PR)

## Opções rejeitadas

- **Sem pre-push hooks:** transfere carga 100% para CI, feedback minutos depois, queima runner.
- **Com `develop`/`staging`:** custo de manter ambiente + risco de drift; sem benefício real para solo.
- **Trunk-based sem PR:** velocidade máxima, perde revisão e CI gate; ruim para projeto open source.
- **`pre-commit` em vez de Lefthook:** funcional mas mais lento e Python-centric; perde versatilidade do monorepo.
- **Deploy manual via SSH:** elimina automação que justifica Coolify; força ritual sujeito a erro.
