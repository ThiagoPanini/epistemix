# Roadmap — epistemix

Roadmap em fases sequenciais. Cada fase só começa quando a anterior está fechada (deploy em produção, não apenas "código pronto").

Para a visão de longo prazo, ver [VISION.md](VISION.md). Para decisões registradas, ver [adr/](adr/).

---

## Fase 0 — Fundação

Sem código de produto. Objetivo: base sólida de documentação, infra, automação e setup AI-first.

> **Progresso (atualizado 2026-05-27):** infra base da VPS e fundação documental concluídas; borda Cloudflare e esqueleto de aplicação pendentes. Trilha auditável em [docs/ai-ops/](ai-ops/), receitas reproduzíveis em [docs/guides/](guides/).
> **Estado de execução:** rastreado neste próprio ROADMAP como single source (markers `🚧`/`[x]`, sufixo `` `@human` ``/`` `@agent` `` na fase ativa) — board GitHub Projects deferido, ver [ADR-0014](adr/0014-roadmap-como-source-skill-solo-dev-assistant.md).

### Infra e borda

- [x] Provisionar VPS Hostinger (KVM 2) e endurecer (ssh keys, ufw, fail2ban, unattended-upgrades) — ver [ai-ops 0002](ai-ops/0002-hardening-talkingpres-prod.md)
- [x] Instalar Coolify (via template Hostinger; 4 containers saudáveis, Traefik como proxy) — ver [ai-ops 0001](ai-ops/0001-setup-inicial-talkingpres-prod.md)
- [ ] Generalizar VPS: remover referências a `talkingpres` (usuário do sistema, chaves SSH, configs do Coolify, documentação de infra)
- [ ] Borda Cloudflare — receita pronta em [guide 0002](guides/0002-configurar-cloudflare-r2-mcp.md), execução pendente:
  - [ ] Registrar domínio `epistemix.*` e trocar nameservers para a Cloudflare
  - [ ] Publicar Coolify em subdomínio proxied com TLS Full (strict)
  - [ ] Criar admin do Coolify (senha direto no gerenciador de segredos)
  - [ ] Fechar a origem: restringir UFW aos ranges Cloudflare, fechar portas temporárias `8000/6001/6002`, validar com checagem externa tripla
- [ ] Backup do Postgres em R2 (bucket criado no [guide 0002](guides/0002-configurar-cloudflare-r2-mcp.md); credencial S3 + schedule no Coolify em guide futuro)
- [ ] Runbook de restore mensal do Postgres (backup não testado não é backup)
- [ ] Deploy "hello world" em produção respondendo em `epistemix.*`

### CI/CD e qualidade

- [ ] CI: GitHub Actions com lint + typecheck + testes em PR
- [ ] Branch protection na `main`: PR obrigatório, CI verde obrigatório, sem force-push
- [ ] Secret scanning no CI (`gitleaks`)

### Código e ambiente local

- [ ] Skeleton monorepo: `apps/web` (Next.js) + `apps/api` (FastAPI), ambos com "hello world" rodando
- [ ] Docker Compose local com Postgres

### Documentação e setup AI-first

- [x] AGENTS.md + CLAUDE.md (`@AGENTS.md`) + `.github/copilot-instructions.md`
- [x] docs/CONTEXT.md preenchido após sessão `grill-with-docs`
- [x] ADRs iniciais concluídos (0001–0012)
- [x] Sistema de documentação versionada: taxonomia ADR / lesson / guide / runbook / ai-ops, cada gênero com README e critério de uso
- [x] Skills de autoria (`write-a-guide`, `write-a-lesson`, `write-a-skill`) para manter o padrão dos docs
- [x] Skill `solo-dev-assistant` com comando `briefing` e hook PostToolUse de auto-commit do ROADMAP
- [ ] CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md

## Fase 1 — Hub público (read-only)

- [ ] Modelo de domínio: `Section`, `Source`, `Artifact` (`Post`, `Presentation`), `Slide`, `Tag` — ver [ADR-0015](adr/0015-epistemix-domain-model.md) e [ADR-0007](adr/0007-publicar-e-papel-de-user.md)
- [ ] Migrations Alembic iniciais
- [ ] Endpoints REST: sections list, sources by section, artifacts list/filter/search/get-by-slug
- [ ] Player de slides para `Presentation` via `slide-kit` (base + extensões locais — ver [ADR-0012](adr/0012-slide-kit-base-plus-extensoes-locais.md))
- [ ] Render de `Post` (texto prosa MDX)
- [ ] Landing page epistemix: hero, grid de artefatos em destaque, animações de scroll
- [ ] Páginas de Section: listagem de Sources (para `with_sources`) ou Artifacts (para `direct`) com filtros por tag (curadas — ver [ADR-0008](adr/0008-tags-curadas.md)) e busca
- [ ] Página de Source: listagem dos Posts vinculados + metadata da referência externa
- [ ] Página individual de Artifact: player (Presentation) ou texto (Post) + descrição + metadata
- [ ] OG tags + structured data para compartilhamento social
- [ ] Sitemap + robots.txt
- [ ] Modo "admin lo-fi": artefatos vivem em `content/<section>/*.mdx` no repo
- [ ] **Marco V1:** cada Section com ao menos 1 Artifact publicado em produção

## Fase 2 — Engajamento

- [ ] Auth (Clerk ou better-auth — decidir via ADR)
- [ ] Modelo `View` (entidade persistida sobre `Artifact` — ver [ADR-0009](adr/0009-view-como-entidade-persistida.md) e [ADR-0015](adr/0015-epistemix-domain-model.md)), `Vote`, `Comment`
- [ ] Endpoints e UI otimista para votar e comentar (Server Actions apenas para concerns do Next — ver [ADR-0010](adr/0010-server-actions-apenas-para-concerns-do-next.md))
- [ ] Perfil de usuário básico com URL pública `/authors/<username>` (ver [ADR-0011](adr/0011-url-publica-do-publicador.md))
- [ ] Rate limiting (Redis no Coolify ou Upstash)
- [ ] Moderação manual em painel admin simples

## Fase 3 — Conteúdo dinâmico

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
