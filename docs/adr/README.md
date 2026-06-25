# Architecture Decision Records (ADRs)

Decisões arquiteturais relevantes deste projeto. Formato: [MADR](https://adr.github.io/madr/) simplificado.

Um ADR se justifica quando a decisão é **difícil de reverter**, **surpreende sem o contexto** e tem **trade-off real**. Regra de domínio sem trade-off vira invariante no [CONTEXT.md](../CONTEXT.md); convenção ou comando vai no [AGENTS.md](../../AGENTS.md).

## Como criar um novo ADR

1. Copie o ADR mais recente como template.
2. Numere sequencialmente: `NNNN-titulo-em-kebab.md`. O conjunto é contíguo, sem buracos.
3. Status inicial: `Proposed`. Mude para `Accepted` quando mergeado.
4. Inclua: contexto, opções consideradas, decisão, consequências (positivas e negativas).
5. Linke o ADR de onde for relevante (CONTEXT.md, ARCHITECTURE.md, AGENTS.md).

## Quando criar ADR vs documentar de outra forma

| Situação | Onde documentar |
|---|---|
| Mudança que afeta múltiplos boundaries ou tem tradeoff de longo prazo | **ADR** |
| Novo termo de domínio ou mudança em invariante | `CONTEXT.md` |
| Mudança no fluxo de build/deploy | `ARCHITECTURE.md` + ADR se for decisão alternável |
| Convenção de código ou comando local | `AGENTS.md` |
| Bug fix ou feature sem implicação arquitetural | Mensagem de commit + PR |

## Como revisar um ADR existente

Para um **refinamento** (a decisão segue válida, muda um detalhe), edite o ADR no lugar e registre a mudança inline com data e o quê/porquê. Para uma **reversão** de fundo, escreva um novo ADR que declare a decisão nova e marque o anterior como `Superseded by NNNN`. O git history é a trilha de auditoria — o conjunto na árvore fica enxuto e reflete o que vale hoje.

## Lista

- [0001 — Monorepo e boundaries de domínio](0001-monorepo-and-boundaries.md)
- [0002 — Stack: FastAPI + Next.js + Postgres](0002-stack-fastapi-nextjs-postgres.md)
- [0003 — Infra: VPS Hostinger + Coolify](0003-infra-hostinger-vps-coolify.md)
- [0004 — Arquitetura hexagonal pragmática](0004-hexagonal-pragmatica.md)
- [0005 — Deploy em três portões](0005-deploy-checks-em-tres-portoes.md)
- [0006 — Cloudflare na frente da VPS](0006-cloudflare-na-frente-da-vps.md)
- [0007 — Publicar é um papel de User; sem entidade Author](0007-publicar-e-papel-de-user.md)
- [0008 — View como entidade persistida, com filtro de bots](0008-view-como-entidade-persistida.md)
- [0009 — Artifact como abstração comum sobre Post e Presentation](0009-modelo-de-dominio.md)
- [0010 — Autonomia total dos agentes em portfólio experimental](0010-desenvolvimento-autonomo-afk.md)
- [0011 — Autenticação com better-auth](0011-auth-better-auth.md)
