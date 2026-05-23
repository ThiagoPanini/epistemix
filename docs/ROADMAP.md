# Roadmap — talkingpres

Roadmap em fases sequenciais. Cada fase só começa quando a anterior está fechada (deploy em produção, não apenas "código pronto").

Para a visão de longo prazo, ver [VISION.md](VISION.md). Para decisões registradas, ver [adr/](adr/).

---

## Fase 0 — Fundação

Sem código de produto. Objetivo: base sólida de documentação, infra, automação e setup AI-first.

- [ ] Provisionar VPS Hostinger (KVM 2), endurecer (ssh keys, ufw, fail2ban, updates automáticos)
- [ ] Instalar Coolify
- [ ] Configurar DNS no Cloudflare apontando para a VPS, com proxy ligado
- [ ] CI: GitHub Actions com lint + typecheck + testes em PR
- [ ] Branch protection na `main`: PR obrigatório, CI verde obrigatório, sem force-push
- [ ] Secret scanning no CI (`gitleaks`)
- [ ] Skeleton monorepo: `apps/web` (Next.js) + `apps/api` (FastAPI), ambos com "hello world" rodando
- [ ] Docker Compose local com Postgres
- [ ] AGENTS.md + CLAUDE.md (`@AGENTS.md`) + `.github/copilot-instructions.md`
- [ ] docs/CONTEXT.md preenchido após sessão `grill-with-docs`
- [ ] ADRs iniciais concluídos
- [ ] CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md
- [ ] Deploy "hello world" em produção respondendo em `talkingpres.com`

## Fase 1 — Catálogo público (read-only)

- [ ] Modelo de domínio: `Presentation`, `Slide`, `Tag`, `Author`
- [ ] Migrations Alembic iniciais
- [ ] Endpoints REST: list, filter, search, get-by-slug
- [ ] Player de slides renderizado a partir de MDX
- [ ] Landing page CodeWiki-style: hero, grid de destaques, animações de scroll
- [ ] Página de listagem com filtros por tag e busca
- [ ] Página individual de apresentação: player + descrição + metadata
- [ ] OG tags + structured data para compartilhamento social
- [ ] Sitemap + robots.txt
- [ ] Modo "admin lo-fi": apresentações vivem em `content/presentations/*.mdx` no repo
- [ ] **Marco V1:** 5 apresentações reais publicadas em produção

## Fase 2 — Engajamento

- [ ] Auth (Clerk ou better-auth — decidir via ADR)
- [ ] Modelo `View`, `Vote`, `Comment`
- [ ] Endpoints e UI otimista para votar e comentar
- [ ] Perfil de usuário básico
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
