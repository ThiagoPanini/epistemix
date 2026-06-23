# Autonomia dos agentes (AFK) — semáforo de ops + fluxo de feature

Resumo operacional de [ADR-0017](../adr/0017-desenvolvimento-autonomo-afk.md). **Ler antes de operar MCPs ou implementar feature.**

Princípio raiz — **HITL nas bordas, AFK no meio:** reversível e de baixo impacto → o agente faz sozinho; irreversível, destrutivo ou que toca produção de forma não-recuperável → o agente propõe e para. **Na dúvida, trate como 🔴.**

## Ops via MCP — semáforo

Classifique **pelo efeito**, não decorando a lista de tools (os catálogos mudam; o critério não).

- 🟢 **Verde — faz sempre, sozinho.** Leitura e diagnóstico: `get*`/`list*`/`*logs*`/`*metrics*`/`diagnose_*`/`search`. Sem efeito colateral.
- 🟡 **Amarelo — faz sozinho e registra no commit/PR que dispara a operação** (ver _Audit trail_ abaixo). Efeito reversível ou rotina de deploy:
  - Criar recurso no Coolify (banco Postgres/Redis, app, serviço) e provisionar com `instant_deploy`
  - Snapshot / backup pontual
  - Env vars de runtime, incluindo **segredo gerável por máquina** (senha de DB, session secret, token de API gerado via MCP) — gera, seta via MCP, **nunca commita**
  - `deploy`/`redeploy`/`restart` de app ou serviço existente
  - `alembic upgrade head` após deploy; `alembic downgrade` apenas uma revisão atrás se reverter PR ainda fresco
  - Purge de cache Cloudflare; atualizar `post_deployment_command`
  - Registro DNS **aditivo** em zona já-possuída (`panlabs.tech`) — emenda [ADR-0021](../adr/0021-rebatismo-ethitorial-e-migracao-panlabs-tech.md)
- 🔴 **Vermelho — propõe e espera o operador.** Irreversível/destrutivo: DNS/nameservers destrutivo, qualquer regra de firewall, recriar/destruir/comprar VM, restaurar backup por cima de produção, senhas root/panel, `delete*` de recurso persistente, `stop_all_apps`, `alembic downgrade` para revisão anterior ao deploy atual, **segredo emitido por terceiro** (`client_secret` OAuth, API key paga). Para segredo de terceiro: faça a parte sem o segredo e documente o comando exato para o operador — não trave a sessão.

### Audit trail

Operações 🟡 são registradas na **mensagem do commit/PR que as dispara** — o `git log` é a trilha auditável. (A antiga pasta `docs/ai-ops/` foi **aposentada**; ver emenda 2026-06-23 no [ADR-0017](../adr/0017-desenvolvimento-autonomo-afk.md). O histórico do diário permanece no git history.)

## Feature-dev — fluxo AFK

1. 🔴 **Alinhar** (`grill-me`/`grill-with-docs`) — o operador define o *o quê*; design visual parte do contrato as-built em `docs/design/`.
2. 🟡 **Fatiar** em **issues vertical-slice** (skill `to-issues`, label `agent-ready`) — cada issue atravessa schema→API→UI→testes→e2e, ancorada em `docs/design/` + `CONTEXT.md`.
3. 🟢 **Implementar** — cada issue num **git worktree** dedicado, com TDD, até **PR verde**. Pode encadear issues como PRs separados. **Não mergeia.**
4. 🟡 **Mergear** — CI verde, branch atualizada, sem conflito → squash-merge. Conflito → atualiza a branch, reroda CI e só mergeia no verde.

Merge na `main` é exceção operacional permitida (PR próprio, CI verde, squash, sem conflito, branch protection aprovando). Merge dispara deploy. Ver [ADR-0005](../adr/0005-deploy-checks-em-tres-portoes.md).
