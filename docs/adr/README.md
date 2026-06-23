# Architecture Decision Records (ADRs)

Decisões arquiteturais relevantes deste projeto. Formato: [MADR](https://adr.github.io/madr/) simplificado.

## Como criar um novo ADR

1. Copie o ADR mais recente como template
2. Numere sequencialmente: `NNNN-titulo-em-kebab.md`
3. Status inicial: `Proposed`. Mude para `Accepted` quando mergeado.
4. Inclua: contexto, opções consideradas, decisão, consequências (positivas e negativas)
5. Linke este ADR de onde for relevante (CONTEXT.md, ARCHITECTURE.md, AGENTS.md)

## Quando criar ADR vs documentar de outra forma

| Situação | Onde documentar |
|---|---|
| Mudança que afeta múltiplos boundaries ou tem tradeoff de longo prazo | **ADR** |
| Novo termo de domínio ou mudança em invariante | `CONTEXT.md` |
| Mudança no fluxo de build/deploy | `ARCHITECTURE.md` + ADR se for decisão alternável |
| Convenção de código ou comando local | `AGENTS.md` |
| Bug fix ou feature sem implicação arquitetural | Mensagem de commit + PR |

## Como revisar um ADR existente

Não edite o ADR original. Crie um novo ADR de revisão que referencia o anterior e muda seu status para `Superseded by NNNN`. Isso preserva a história.

## Lista

- [0001 — Monorepo e boundaries de domínio](0001-monorepo-and-boundaries.md)
- [0002 — Stack: FastAPI + Next.js + Postgres](0002-stack-fastapi-nextjs-postgres.md)
- [0003 — Infra: VPS Hostinger + Coolify](0003-infra-hostinger-vps-coolify.md)
- [0004 — Arquitetura hexagonal pragmática](0004-hexagonal-pragmatica.md)
- [0005 — Deploy em três portões](0005-deploy-checks-em-tres-portoes.md)
- [0006 — Cloudflare na frente da VPS](0006-cloudflare-na-frente-da-vps.md)
- [0007 — Publicar é um papel de User; sem entidade Author](0007-publicar-e-papel-de-user.md)
- [0008 — Tags curadas, não livres](0008-tags-curadas.md)
- [0009 — View como entidade persistida, com filtro de bots](0009-view-como-entidade-persistida.md)
- [0010 — Server Actions apenas para concerns do Next; mutations de domínio na FastAPI](0010-server-actions-apenas-para-concerns-do-next.md)
- [0011 — URL pública do publicador é `/authors/<username>`](0011-url-publica-do-publicador.md)
- [0012 — slide-kit: catálogo base + extensões locais + animação como primitiva](0012-slide-kit-base-plus-extensoes-locais.md)
- [0013 — Substrato de planejamento operado por agentes (GitHub Projects)](0013-substrato-de-planejamento-operado-por-agentes.md)
- [0014 — Substrato de planejamento via ROADMAP.md como single source, operado pela skill `solo-dev-assistant`](0014-roadmap-como-source-skill-solo-dev-assistant.md)
- [0015 — Modelo de domínio epistemix: Section, Source, Artifact](0015-epistemix-domain-model.md)
- [0016 — VPS agnóstica: infra desacoplada de um único projeto](0016-vps-agnostica-multi-projeto.md)
- [0017 — Desenvolvimento autônomo (AFK): HITL nas bordas, AFK no meio](0017-desenvolvimento-autonomo-afk.md)
- [0018 — Catálogo MDX-native no Next; API/Postgres entram com engagement](0018-catalogo-mdx-native-na-fase-1.md)
- [0019 — Redesenho: protótipo da Direção A como alvo absoluto, push feature-completo, fases aposentadas](0019-redesenho-prototipo-absoluto-push-feature-completo.md)
- [0020 — Autenticação com better-auth](0020-auth-better-auth.md)
- [0021 — Rebatismo epistemix → ethitorial e migração para ethitorial.panlabs.tech](0021-rebatismo-ethitorial-e-migracao-panlabs-tech.md)
