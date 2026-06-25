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
- Sem ambiente intermediário (`develop`/`staging`); `main` sempre deployável cobre o caso (preview por PR fica deferido).

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
| Unit tests Python (afetados) | `pytest -m "not integration"` |
| Segredos | `gitleaks git --staged` |
| Conventional commits (no commit-msg) | `commitlint` |

**Orquestrador: [Lefthook](https://github.com/evilmartians/lefthook).** Single binary Go, parallel-first, language-agnostic. Config em `lefthook.yml` na raiz.

Pre-push hooks são **conveniência, não segurança** — podem ser pulados com `--no-verify`. Por isso o portão 2 existe.

### Portão 2 — On PR / push to feature branch (minutos)

GitHub Actions workflow `pr-checks.yml`. **Esta é a gate real.**

```
pr-checks.yml (as-built)
├── web:      biome check + tsc --noEmit (typecheck)
├── api:      ruff format --check + ruff check + pyright --warnings + pytest -m "not integration"
├── security: gitleaks
└── open-pr:  needs[web, api, security] → abre PR para a main no verde (idempotente)
```

> **Deferido** (entra quando houver código que justifique, como o próprio `pr-checks.yml` registra): test-integration (Postgres em service container), test-e2e (Playwright), coverage gate, security-scan adicional (bandit/npm-audit) e preview-deploy por PR.

**Branch protection na `main`:**
- PR obrigatório
- Aprovações requeridas = **0** — a revisão humana é o próprio ato de mergear (ver [emenda 2026-06-04](#emenda-2026-06-04--review-na-realidade-solo))
- Todos os checks acima verdes
- Branch atualizada com `main` (rebase ou squash-merge)
- História linear (squash-merge)
- Sem `force push`

### Portão 3 — On merge to main (deploy)

GitHub Actions workflow `deploy.yml`.

```
deploy.yml (as-built)
├── build-images (matrix: web, api) → push GHCR
├── webhook → Coolify
│   ├── pull image
│   ├── rolling restart com health check
│   └── rollback automático se health falha
└── post-deploy-smoke-test (curl em ethitorial.panlabs.tech)
```

> **Deferido:** release marker no Sentry (sem integração Sentry no código hoje — ver [ARCHITECTURE.md](../ARCHITECTURE.md)).

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

## Emendas

### Emenda 2026-06-04 — "review" na realidade solo

A decisão original listava **"code owner review obrigatória"** na branch protection da `main`. Para um repositório de **dev solo**, isso é auto-bloqueante: o GitHub não permite que o autor aprove o próprio PR, então uma gate de aprovação requerida (`required approvals ≥ 1`) impede qualquer merge sem uma segunda identidade ou bypass de admin a cada merge.

**Reconciliação:** a branch protection passa a exigir `required approvals = 0`. A revisão humana separada **não é obrigatória** no fluxo solo; a defesa real é técnica: PR obrigatório, checks verdes, branch atualizada, sem force-push na `main` e história linear via squash. O operador pode revisar manualmente quando quiser, mas o agente também pode aplicar squash-merge quando esses portões estiverem satisfeitos (ver emenda 2026-06-12). Quando o projeto ganhar uma segunda pessoa revisando, reavaliar para `required approvals ≥ 1` + CODEOWNERS.

### Emenda 2026-06-07 — checks no push + PR automático para a main

A decisão original do Portão 2 já se chamava **"On PR / push to feature branch"**, mas a implementação (`pr-checks.yml`) disparava **só em `pull_request`**, e cada PR era aberto à mão. Duas mudanças fecham essa lacuna e tiram o passo manual:

1. **Checks rodam no `push`** das branches de trabalho (globs `feat|fix|chore|docs|refactor|test/**`), não mais em `pull_request`. Os contextos requeridos (`web`/`api`/`security`) são reportados no SHA; com o ruleset `strict`/up-to-date, isso satisfaz o PR — atualizar a branch re-roda os checks contra o estado efetivamente mergeado.
2. **PR automático para a main.** Um job `open-pr` (`needs: [web, api, security]`) abre um PR para a `main` **quando os checks ficam verdes**, se ainda não existir um para a branch. É **idempotente**: push seguinte reusa o PR (no-op). PR nasce *ready-for-review*; título = subject do último commit (Conventional Commits), que vira a mensagem do squash-merge.

**Por que a validação precisa viver no `push` (e não no PR):** um PR criado pela Action com o `GITHUB_TOKEN` padrão **não dispara** o evento `pull_request` (proteção anti-recursão do GitHub). Se os checks só rodassem em `pull_request`, o PR automático ficaria sem os checks requeridos e nunca mergeável. Rodando no `push`, os contextos já estão satisfeitos no SHA quando o PR nasce.

**O que esta emenda NÃO muda:** todas as proteções da `main` (PR obrigatório, checks verdes, linear/squash, sem force-push) permanecem.

### Emenda 2026-06-12 — merge autônomo de PR verde

O operador removeu a restrição de merge humano obrigatório. A partir desta emenda, agentes podem aplicar `gh pr merge <N> --squash` quando:

1. o PR não é draft;
2. todos os checks requeridos estão verdes;
3. a branch está atualizada com a `main` e sem conflito;
4. o merge é squash;
5. a branch protection permite o merge.

Se houver conflito, check pendente/falhando ou branch desatualizada, o agente atualiza a branch num worktree, resolve conflitos, reroda CI e só mergeia depois de verde. O Portão 3 segue existindo, mas a autoridade prática deixa de ser o clique humano e passa a ser a branch protection + CI.

**Trip-wire:** cobertura de **PR vindo de fork** (contribuidor externo, cujo push não dispara workflow nesta repo) fica deferida — quando surgir o primeiro contribuidor externo, adicionar um trigger `pull_request` guardado para PRs de fork.
