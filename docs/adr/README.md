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
