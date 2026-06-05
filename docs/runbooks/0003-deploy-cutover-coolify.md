# Runbook 0003 — Deploy e cutover do epistemix no Coolify

Referência operacional do **Portão 3** ([ADR-0005](../adr/0005-deploy-checks-em-tres-portoes.md)): como o `deploy.yml` publica as imagens e como conectar o Coolify para o deploy automático, incluindo o **cutover** do placeholder `hello-world` para o `apps/web` real em `epistemix.dev`.

> O workflow [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) já faz **build + push para GHCR** em todo merge na `main`. O job `deploy` fica **pulado** até os secrets do Coolify existirem (não falha). Este runbook é o setup único que liga essa última peça.

> **Healthcheck:** o Coolify roda o healthcheck *dentro* do container via `curl`/`wget`. As imagens `web` e `api` já trazem `curl` instalado nos seus Dockerfiles exatamente por isso — sem ele o container sobe mas é marcado `unhealthy` e sofre rollback. Se criar um app novo com healthcheck, garanta o `curl` na imagem.

## Estado de referência (2026-06)

- Server Coolify: `localhost` (uuid `xzika6refja7xc2j8sia6cp7`).
- Projeto: `epistemix` (uuid `uto7su3ktcloefuyhe2sq4de`).
- App atual em `epistemix.dev`: `hello-world` (uuid `pndz02nxdp550xy36koup2pw`) — placeholder a ser substituído.
- Imagens publicadas pelo CI: `ghcr.io/thiagopanini/epistemix-web` e `…-api` (tags `latest` + `sha-<curto>`).

## Pré-requisito: imagens no GHCR

As imagens nascem no primeiro run do `deploy.yml`. Force um run sem depender do merge:

```bash
gh workflow run deploy.yml --ref main
gh run watch
```

Confirme os pacotes em `ghcr.io/thiagopanini/epistemix-web` e `…-api`. Se forem **privados**, dê ao Coolify uma credencial de pull do GHCR (PAT `read:packages`) em *Coolify → Keys & Tokens → Registries*. O mais simples é torná-los **públicos** (Settings → Packages → Change visibility), já que não há segredo nas imagens.

## Tarefa A — criar o app `api` (interno)

1. Coolify → projeto `epistemix` → **+ New Resource → Docker Image**.
2. Imagem: `ghcr.io/thiagopanini/epistemix-api:latest`. Porta exposta: `8000`.
3. **Não** atribuir domínio público (fica interno). Anote o nome do serviço/host interno (ex.: `api`) — o `web` vai chamá-lo.
4. **Health check:** `GET /health`, porta 8000, intervalo 10s.
5. Deploy. Confirme `running:healthy`.

## Tarefa B — criar o app `web` (público) e cutover

1. Coolify → projeto `epistemix` → **+ New Resource → Docker Image**: `ghcr.io/thiagopanini/epistemix-web:latest`. Porta `3000`.
2. **Env var:** `EPISTEMIX_API_URL` = URL interna do app `api` (ex.: `http://api:8000`).
3. **Health check:** `GET /`, porta 3000.
4. **Cutover do domínio** (🔴 produção, reversível):
   - No app `hello-world`, **remover** os domínios `epistemix.dev` e `www.epistemix.dev`.
   - No app `web`, **adicionar** `https://epistemix.dev` e `https://www.epistemix.dev` (TLS Full strict já está na borda Cloudflare — [ai-ops 0004](../ai-ops/0004-publicar-epistemix-dev.md)).
   - Deploy do `web`. Confirme `https://epistemix.dev` mostrando a landing com **"API: online"**.
5. Quando estável, **parar/arquivar** o `hello-world` (não deletar de imediato — rollback rápido).

## Tarefa C — ligar o deploy automático (secrets do GitHub) 🔴

Gere um **API token** do Coolify (*Keys & Tokens → API tokens*, permissão de deploy) e pegue os UUIDs dos apps `web`/`api` (na URL do app no Coolify). Então:

```bash
gh secret set COOLIFY_URL      --body "https://vps.thiagopanini.dev"   # base do Coolify
gh secret set COOLIFY_TOKEN    --body "<api-token-do-coolify>"
gh secret set COOLIFY_WEB_UUID --body "<uuid-do-app-web>"
gh secret set COOLIFY_API_UUID --body "<uuid-do-app-api>"
```

A partir daí, todo merge na `main` dispara: build → GHCR → `POST /api/v1/deploy?uuid=…` (api e depois web) → smoke test em `epistemix.dev`.

## Operação cotidiana

```bash
# Forçar um deploy manual
gh workflow run deploy.yml --ref main

# Disparar redeploy direto (sem rebuild)
curl -fsSL -X POST -H "Authorization: Bearer $COOLIFY_TOKEN" \
  "$COOLIFY_URL/api/v1/deploy?uuid=<uuid>&force=true"
```

## Rollback

- **App não sobe / health falha:** o Coolify mantém o container anterior no rolling deploy; reverter via Coolify → app → Deployments → *Rollback* para o deploy verde anterior, ou apontar a tag para um `sha-<curto>` bom.
- **Cutover quebrou o domínio:** reatribuir `epistemix.dev` de volta ao `hello-world` (por isso ele só é parado, não deletado, até a estabilização).

## Pendências desta fase (deferidas, não bloqueiam)

- Backup do Postgres em R2 + runbook de restore (o Postgres de produção entra na Fase 1, com a 1ª migration).
- `deploy.yml` evoluir com rollback automático por smoke-test e marker de release no Sentry quando a observabilidade entrar.
