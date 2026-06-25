# Fluxo de trabalho, autonomia e skills

Como o trabalho é alinhado, despachado e executado no `ethitorial`. Carregado sob demanda pelo [AGENTS.md](../../AGENTS.md). É o resumo operacional vivo do [ADR-0010](../adr/0010-desenvolvimento-autonomo-afk.md) (autonomia) e do [ADR-0005](../adr/0005-deploy-checks-em-tres-portoes.md) (deploy/merge). **Ler antes de operar MCPs ou implementar.**

## Autonomia — a fronteira em uma tela

Portfólio **experimental, solo, baixo risco** ([ADR-0003](../adr/0003-infra-hostinger-vps-coolify.md)). O agente faz **sozinho e calado** tudo que é escopo do projeto: implementar, deploy, redeploy, restart, env vars, segredo gerável por máquina, migration up/down, criar/dropar recurso próprio no Coolify, DNS na zona própria, e **merge de PR verde**.

Para e chama o operador em **só quatro casos** ([ADR-0010](../adr/0010-desenvolvimento-autonomo-afk.md)):

1. **Te tranca pra fora** — senha root/painel, credencial do operador, regra de firewall, ou o token de infra que o próprio MCP usa.
2. **Recria a VM** — a camada abaixo de onde o agente opera.
3. **Exige segredo de terceiro** — `client_secret` OAuth, API key paga de console: faz o resto, documenta o passo, entrega.
4. **Toca outro projeto** no Coolify compartilhado — confirme que o recurso é do `ethitorial` antes de qualquer operação que muta; na ambiguidade, para.

Na dúvida sobre os quatro, para. Fora deles, faz. Classifique **pelo efeito**, não decorando tools — os catálogos de MCP mudam, o critério não.

## Fluxo de implementação

Quando o operador diz "implementa as issues" (ou equivalente), o default — **sem precisar repetir autonomia nem ferramenta**:

1. **Alinhar** *(borda HITL)* — o operador define o *quê* com `grill-with-docs` (ou `grill-me`). Julgamento mora aqui; design parte do contrato as-built em [docs/design/](../design/README.md).
2. **Fatiar** — `to-issues` quebra o alinhamento em **vertical slices** `agent-ready`, cada uma atravessando schema→API→UI→testes. Para feature grande, `to-prd` pode destilar um PRD antes de fatiar (opcional).
3. **Implementar** *(AFK)* — cada issue num **git worktree** dedicado, TDD, em **modo de economia de token**, até **PR verde**. Encadeia slices como PRs separados.
4. **Mergear** *(AFK)* — com CI verde, branch atualizada e sem conflito, aplica `gh pr merge <N> --squash`. Conflito ou check vermelho → atualiza a branch no worktree, resolve, reroda CI, mergeia no verde. Merge dispara deploy ([ADR-0005](../adr/0005-deploy-checks-em-tres-portoes.md)).

O agente **encadeia até as issues acabarem**, parando só se o operador pedir (ex.: para compactar contexto). Trabalho paralelo é particionado por boundary ([ADR-0001](../adr/0001-monorepo-and-boundaries.md)) — um worktree por boundary — para evitar conflito.

## Estado de execução

O **estado vive nas issues do GitHub** — vertical slices geradas por `to-issues`, label `agent-ready`. Não há board nem ROADMAP faseado a sincronizar. **Pegar trabalho:** escolha uma issue `agent-ready` sem bloqueio em aberto (respeite o `Blocked by`); o estado vive na própria issue (assignee/labels/comentário/PR com `Closes #N`).

## Antes de codar

- **Feature nova:** ler [CONTEXT.md](../CONTEXT.md), [ARCHITECTURE.md](../ARCHITECTURE.md) e os ADRs relevantes.
- **Mexer no front:** ler [docs/design/README.md](../design/README.md) e o componente em `docs/design/components/`. Divergência resolve a favor do código as-built.
- **Decisão arquitetural nova:** registrar um ADR em `docs/adr/NNNN-titulo.md` antes de implementar.
- **Mudança em invariante/glossário:** atualizar [CONTEXT.md](../CONTEXT.md) no mesmo PR.
- **Mudança de comando/convenção:** atualizar o [AGENTS.md](../../AGENTS.md) (ou o módulo em `docs/agents/`) no mesmo PR.
- Validar UI/UX rodando o app de verdade no browser, não só testes verdes.

## Skills

Skills vivem em `.agents/skills/` (symlinkadas em `.claude/skills/`); use `find-skills` para descobrir o conjunto atual. Centrais ao fluxo: `grill-me`/`grill-with-docs` (alinhamento), `to-issues`/`to-prd` (fatiar trabalho em vertical-slices), `tdd` (implementação), `frontend-design` (UI) e `write-as-me` (autoria de conteúdo do catálogo).
