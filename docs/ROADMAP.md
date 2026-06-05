# Roadmap — epistemix

Roadmap em fases sequenciais. Cada fase só começa quando a anterior está fechada (deploy em produção, não apenas "código pronto").

Para a visão de longo prazo, ver [VISION.md](VISION.md). Para decisões registradas, ver [adr/](adr/).

---

## Fase 0 — Fundação

Sem código de produto. Objetivo: base sólida de documentação, infra, automação e setup AI-first.

> **Progresso (atualizado 2026-06-05):** infra base da VPS, fundação documental, **borda Cloudflare** e **esqueleto de aplicação no ar concluídos** — `epistemix.dev` serve o `apps/web` real (landing Fase 0, card "API: online") consumindo `apps/api` via `api.epistemix.dev` atrás do Cloudflare; CI (3 portões), Lefthook e branch protection ativos. Cutover do placeholder + fiação web↔api em [ai-ops 0005](ai-ops/0005-deploy-cutover-coolify-e-api-publica.md). Restam só itens deferidos (backup Postgres → Fase 2, junto com a 1ª migration; CONTRIBUTING/etc). Trilha auditável em [docs/ai-ops/](ai-ops/), receitas reproduzíveis em [docs/guides/](guides/).
> **Estado de execução:** rastreado neste próprio ROADMAP como single source (markers `🚧`/`[x]`, sufixo `` `@human` ``/`` `@agent` `` na fase ativa) — board GitHub Projects deferido, ver [ADR-0014](adr/0014-roadmap-como-source-skill-solo-dev-assistant.md).

### Infra e borda

- [x] Provisionar VPS Hostinger (KVM 2) e endurecer (ssh keys, ufw, fail2ban, unattended-upgrades) — ver [ai-ops 0002](ai-ops/0002-hardening-talkingpres-prod.md)
- [x] Instalar Coolify (via template Hostinger; 4 containers saudáveis, Traefik como proxy) — ver [ai-ops 0001](ai-ops/0001-setup-inicial-talkingpres-prod.md)
- [x] Generalizar VPS: infra agnóstica `panini-vps` desacoplada de um único projeto (hostname, chave SSH, override unattended-upgrades, caderno de bootstrap, docs de infra) — ver [ADR-0016](adr/0016-vps-agnostica-multi-projeto.md) e [ai-ops 0003](ai-ops/0003-generalizar-vps-panini.md)
- [x] Borda Cloudflare — executada (guides [0002](guides/0002-configurar-cloudflare-r2-mcp.md) + [0003](guides/0003-publicar-epistemix-dev-em-producao.md)):
  - [x] Registrar domínio do produto: `epistemix.dev` (adquirido 2026-05-31)
  - [x] Trocar nameservers de `epistemix.dev` para a Cloudflare (zona multi-projeto — ADR-0016)
  - [x] Publicar Coolify em subdomínio proxied com TLS Full (strict) — `vps.thiagopanini.dev` (2026-05-31)
  - [x] Criar admin do Coolify (senha direto no gerenciador de segredos)
  - [x] Fechar a origem: via firewall **Hostinger** (UFW furado pelo Docker), só `22` + `80/443` dos ranges Cloudflare; `8000/6001/6002/8080` fechadas; validada por checagem externa tripla — ver [ai-ops 0004](ai-ops/0004-publicar-epistemix-dev.md)
- [ ] Backup do Postgres em R2 (bucket criado no [guide 0002](guides/0002-configurar-cloudflare-r2-mcp.md)) — **movido para a Fase 2** (Postgres só nasce com engagement; ver [ADR-0018](adr/0018-catalogo-mdx-native-na-fase-1.md))
- [ ] Runbook de restore mensal do Postgres (backup não testado não é backup) — **movido para a Fase 2**
- [x] Deploy "hello world" em produção respondendo em `epistemix.dev` — `nginxdemos/hello`, TLS Full (strict) — ver [ai-ops 0004](ai-ops/0004-publicar-epistemix-dev.md) e [guide 0003](guides/0003-publicar-epistemix-dev-em-producao.md)
- [x] Cutover para os apps reais: `epistemix.dev` → `apps/web`, `apps/api` em `api.epistemix.dev` (Cloudflare), card "API: online" — ver [ai-ops 0005](ai-ops/0005-deploy-cutover-coolify-e-api-publica.md) e [runbook 0003](runbooks/0003-deploy-cutover-coolify.md)

### CI/CD e qualidade

- [x] CI: GitHub Actions com lint + typecheck + testes em PR (`pr-checks.yml`, jobs web/api/security)
- [x] Branch protection na `main`: PR obrigatório, checks verdes, sem force-push, história linear, approvals=0 (ruleset; emenda solo no ADR-0005)
- [x] Secret scanning (`gitleaks`): pre-commit (Lefthook) + job `security` do `pr-checks.yml`
- [x] Portão 1 (Lefthook): pre-commit (gitleaks), commit-msg (commitlint), pre-push (ruff/pyright/biome/tsc/pytest)
- [x] Portão 3 (`deploy.yml`): build+push das imagens para GHCR no merge + redeploy no Coolify (guardado por `COOLIFY_TOKEN`) — ver [runbook 0003](runbooks/0003-deploy-cutover-coolify.md)

### Código e ambiente local

- [x] Skeleton monorepo: `apps/web` (Next.js) + `apps/api` (FastAPI), ambos com "hello world" rodando
- [x] Docker Compose local com Postgres

### Documentação e setup AI-first

- [x] AGENTS.md + CLAUDE.md (`@AGENTS.md`) + `.github/copilot-instructions.md`
- [x] docs/CONTEXT.md preenchido após sessão `grill-with-docs`
- [x] ADRs iniciais concluídos (0001–0012)
- [x] Sistema de documentação versionada: taxonomia ADR / lesson / guide / runbook / ai-ops, cada gênero com README e critério de uso
- [x] Skills de autoria (`write-a-guide`, `write-a-lesson`, `write-a-skill`) para manter o padrão dos docs
- [x] Skill `solo-dev-assistant` com comando `briefing` e hook PostToolUse de auto-commit do ROADMAP
- [ ] CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md

## Fase 1 — Hub público (read-only) 🚧

> **Arquitetura:** catálogo **MDX-native no Next** — Section/Source/Artifact vivem em `content/**/*.mdx` (modo "admin lo-fi"), lidos em RSC/build-time, **sem API nem Postgres**. O `catalog` REST e Alembic/Postgres entram na **Fase 2** (com engagement); a migração do catálogo MDX→Postgres é **Fase 3** (CMS). Ver [ADR-0018](adr/0018-catalogo-mdx-native-na-fase-1.md). Domínio: [ADR-0015](adr/0015-epistemix-domain-model.md) + [CONTEXT.md](CONTEXT.md).
> **Execução:** dirigida por specs em [docs/specs/](specs/) ([ADR-0017](adr/0017-desenvolvimento-autonomo-afk.md)). A ordem dos bullets é **cobertura, não cronograma** — as fatias seguem dependência (with_sources → direct → Presentation; render de Post antes de busca/landing).

- [ ] **Fatia 1 — cadeia `with_sources` ponta-a-ponta** (Courses → aihero.dev → Post): `content/` + parsing/validação (tags, palavras reservadas) + rotas `/courses`, `/courses/<source>`, `/courses/<source>/<slug>` + render de `Post` MDX + draft/404 — ver [spec 0001](specs/0001-cadeia-with-sources-aihero.md) `@agent`
- [ ] Section `direct` / blog: `Post` vinculado direto à Section (sem Source) `@agent`
- [ ] Player de slides para `Presentation` via `slide-kit` (base + extensões locais — ver [ADR-0012](adr/0012-slide-kit-base-plus-extensoes-locais.md)) `@agent`
- [ ] Landing page epistemix: hero, grid de artefatos em destaque, animações de scroll `@human` (direção de design)
- [ ] Busca + filtros por tag (curadas — ver [ADR-0008](adr/0008-tags-curadas.md)) `@agent`
- [ ] OG tags + structured data para compartilhamento social `@agent`
- [ ] Sitemap + robots.txt `@agent`
- [ ] **Marco V1:** cada Section com ao menos 1 Artifact publicado em produção

## Fase 2 — Engajamento

> Aqui entram **Postgres + Alembic + `apps/api`** pela primeira vez: engagement é o primeiro estado dinâmico real. `View`/`Vote`/`Comment` referenciam `Artifact` por slug (o catálogo segue MDX-native até a Fase 3). Ver [ADR-0018](adr/0018-catalogo-mdx-native-na-fase-1.md).

- [ ] Auth (Clerk ou better-auth — decidir via ADR)
- [ ] Primeira migration Alembic + Postgres no Coolify + backup `pg_dump` → R2 (deferido da Fase 0) + runbook de restore
- [ ] Modelo `View` (entidade persistida sobre `Artifact` — ver [ADR-0009](adr/0009-view-como-entidade-persistida.md) e [ADR-0015](adr/0015-epistemix-domain-model.md)), `Vote`, `Comment`
- [ ] Endpoints e UI otimista para votar e comentar (Server Actions apenas para concerns do Next — ver [ADR-0010](adr/0010-server-actions-apenas-para-concerns-do-next.md))
- [ ] Perfil de usuário básico com URL pública `/authors/<username>` (ver [ADR-0011](adr/0011-url-publica-do-publicador.md))
- [ ] Rate limiting (Redis no Coolify ou Upstash)
- [ ] Moderação manual em painel admin simples

## Fase 3 — Conteúdo dinâmico

- [ ] Catálogo migra de MDX-native para Postgres (troca do adapter de leitura — ver [ADR-0018](adr/0018-catalogo-mdx-native-na-fase-1.md)) + endpoints REST de catálogo (`apps/api` assume Section/Source/Artifact)
- [ ] CMS leve: upload de apresentação via UI admin
- [ ] Persistência das apresentações no Postgres + assets no R2/B2
- [ ] Geração assistida por AI: rascunho de apresentação a partir de prompt (Claude API)
- [ ] Editor MDX com preview lado a lado

## Fase 4 — Voz e RAG (V2)

Sem prazo. Decisão de iniciar fica congelada até Fase 3 estar em produção. Reavaliar estado do mercado e da tecnologia no momento.

- [ ] Voice cloning (ElevenLabs / Cartesia / XTTS — ADR no momento)
- [ ] Knowledge base por apresentação (RAG)
- [ ] Player com slide + voz sincronizados
- [ ] Q&A em tempo real durante reprodução
- [ ] Quotas e billing (Stripe + autumn.sh ou lago)

---

## Política de escopo

Qualquer ideia/feature fora da fase corrente vira issue com label `someday`. Não entra em sprint antes de a fase corrente fechar. Isso é contrato com o futuro-você.
