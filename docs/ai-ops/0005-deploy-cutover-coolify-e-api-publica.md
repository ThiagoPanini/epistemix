---
data: 2026-06-05
operacao: cutover do epistemix.dev (placeholder → apps reais) no Coolify + publicar api.epistemix.dev atrás do Cloudflare (runbook 0003, Tarefas A/B/C)
maquina: panini-vps (Hostinger KVM 2, Ubuntu 24.04 LTS) — VM id 1700377, IP 2.24.125.180
operador: Thiago Panini
agente: Claude Code
resultado: success
dividas:
  - api.epistemix.dev está PÚBLICO (proxied Cloudflare). O runbook 0003 previa o api interno; a rede interna do Coolify (container-a-container :8000) não funcionou por aqui e o hairpin pelo IP público é barrado pelo firewall CF-only. Fechar com Cloudflare Access/WAF ou Zero Trust no api.epistemix.dev quando entrar auth. Reavaliar networking interno (toggle "Connect To Predefined Network" via UI) numa próxima.
  - healthcheck do web ficou folgado (timeout 30s, start_period 15s, retries 5) como contorno enquanto o fetch ao api pendurava. Com o api alcançável o `/` renderiza rápido; apertar de volta (timeout ~10s) depois do PR #28 (timeout no fetch) mergear.
  - PRs #27 (curl nas imagens) e #28 (timeout no fetch da landing) — confirmar merge; #28 ainda aberto na escrita deste registro.
  - cert LE de api.epistemix.dev: mesma dívida de renovação do epistemix.dev (porta 80 CF-only, ACME via Cloudflare proxied). Cobertos juntos.
referencias:
  runbook: ../runbooks/0003-deploy-cutover-coolify.md
  adr: ../adr/0005-deploy-checks-em-tres-portoes.md
  setup_anterior: 0004-publicar-epistemix-dev.md
  prs: "#22-#25 (skeleton/CI/Lefthook/deploy), #27 (curl), #28 (fetch timeout)"
---

> **Nota-ponte (2026-06-22):** o produto foi rebatizado para **ethitorial** e migrou para `ethitorial.panlabs.tech` (API internalizada, sem FQDN público) — ver [ADR-0021](../adr/0021-rebatismo-ethitorial-e-migracao-panlabs-tech.md). Este registro preserva os nomes e domínios `epistemix.dev`/`api.epistemix.dev` da época.

# 20260605 — Cutover do epistemix.dev e api.epistemix.dev pública

Fechamento do **Portão 3** ([ADR-0005](../adr/0005-deploy-checks-em-tres-portoes.md)): subir `apps/web` + `apps/api` reais no Coolify a partir das imagens GHCR, fazer o **cutover** de `epistemix.dev` (do placeholder `hello-world` para o `web`) e ligar a fiação `web → api`. Continuação direta de [0004](0004-publicar-epistemix-dev.md).

## Cenário herdado

- `hello-world` (`nginxdemos/hello`) servindo `epistemix.dev` + `www` atrás do Cloudflare (Full strict).
- Firewall Hostinger `epistemix-cloudflare-only` (id 303233): default deny-all; aceita só `22/any` e `80,443` dos ranges Cloudflare.
- Imagens `ghcr.io/thiagopanini/epistemix-{web,api}:latest` publicadas pelo `deploy.yml`, **públicas** (pull anônimo OK).
- Server Coolify `localhost` (`xzika6refja7xc2j8sia6cp7`), Project `epistemix` (`uto7su3ktcloefuyhe2sq4de`) / env `production` (`tzb89djn4nwe7q5s20c4t4ho`).

## Execução (o que ficou de pé)

- **Apps criados** (Docker Image, rede destino `coolify`):
  - `epistemix-api` (`y1iaroyitv1k9f46t4dssowt`), porta 8000, healthcheck `GET /health`.
  - `epistemix-web` (`kd4niwj9bzp2m7cwz0579ktk`), porta 3000, healthcheck `GET /`, env `EPISTEMIX_API_URL`.
- **Cutover:** removido `epistemix.dev`+`www` do `hello-world` (fqdn esvaziado + `stop`); adicionado `https://epistemix.dev,https://www.epistemix.dev` no `web`; redeploy. `epistemix.dev` passou a servir a landing real ("Fase 0 — esqueleto no ar"). `hello-world` mantido parado (rollback rápido).
- **Fiação web→api via Cloudflare:** DNS `api.epistemix.dev` (A → 2.24.125.180, proxied) na zona `epistemix.dev` (`7b274dd5d0d7a6e4190f9d2c95486542`); `api` recebeu `https://api.epistemix.dev`; `web` aponta `EPISTEMIX_API_URL=https://api.epistemix.dev`. Card "API: online" verde.

## Obstáculos e resoluções (as surpresas)

- **Healthcheck do Coolify exige curl/wget NA imagem.** O Coolify roda o check dentro do container via `curl`/`wget`; `python:3.13-slim` (api) e `node:24-alpine` (web) não traziam nenhum → container sobe saudável (`uvicorn ... Application startup complete`) mas é marcado `unhealthy` → rollback. O deploy nunca estabilizava. **Correção:** `curl` nas duas imagens (PR #27 — `apt-get install curl` / `apk add curl`). Validado com build local das duas imagens.

- **Env var DUPLICADA derrubava o web.** Duas entradas idênticas `EPISTEMIX_API_URL` foram concatenadas pelo Coolify numa URL malformada (`http://host:8000\nhttp://host:8000`), fazendo o `fetch` da landing pendurar → `GET /` estourava o healthcheck de 5s → rollback. **Correção:** deletar a duplicata (sobrou 1). Lição: conferir `env_vars list` antes de deployar.

- **Networking interno container-a-container NÃO funcionou.** Testado por env (sem rebuild): `http://<uuid>:8000` resolve mas **trava no connect** (~10s); `http://epistemix-api:8000` nem resolve (NXDOMAIN); `https://<uuid>.sslip.io` (Traefik) trava — o hairpin pelo IP público 2.24.125.180:443 é **dropado pelo firewall CF-only** (origem não-Cloudflare). O MCP do Coolify não expõe network-alias nem o toggle "Connect To Predefined Network". **Decisão (com o operador):** rota arquiteturalmente coerente — `api.epistemix.dev` atrás do Cloudflare. O `web` chama `https://api.epistemix.dev` → Cloudflare → VPS:443 (origem Cloudflare = liberada) → Traefik → `api`. Zero mudança de firewall, TLS válido.

- **Cutover exige liberar o domínio do app antigo ANTES.** O update do fqdn no `web` deu `Domain conflicts detected` enquanto o `hello-world` ainda tinha `epistemix.dev` no banco (mesmo parado). **Correção:** esvaziar o fqdn do `hello-world` primeiro, depois aplicar no `web`.

- **Healthcheck apertado vs. landing que faz fetch.** A `/` é RSC e fazia `fetch` da API sem timeout; com a API inalcançável o render pendura e o healthcheck de 5s estoura. Contorno imediato: afrouxar o healthcheck do web (timeout 30s). Correção durável: `AbortSignal.timeout(2000)` no fetch (PR #28) — desacopla a saúde do web da saúde da API.

## Dívidas

Ver frontmatter. Destaque: **api.epistemix.dev está público** — fechar com Cloudflare Access quando entrar auth; e reapertar o healthcheck do web após #28.
