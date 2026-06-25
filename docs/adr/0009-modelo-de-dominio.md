# ADR 0009 — Artifact como abstração comum sobre Post e Presentation

**Status:** aceito
**Data:** 2026-05-31

## Contexto

O hub publica formatos heterogêneos: posts de blog, notas de curso, reviews de livro, anotações de certificação e apresentações em slides. O modelo de domínio completo (Section, Source, Artifact e seus subtipos) vive no glossário e nas invariantes de [CONTEXT.md](../CONTEXT.md). Este ADR registra apenas a decisão de modelagem que não é óbvia ao olhar o código: por que existe a abstração `Artifact`.

## Decisão

`Artifact` é a abstração comum publicável, com dois subtipos concretos — `Post` (prosa MDX) e `Presentation` (sequência ordenada de `Slide`s). `View`, `Vote` e `Comment` apontam para um `ArtifactId` polimórfico, nunca para o subtipo.

## Alternativas consideradas

- **A — `Post` e `Presentation` como entidades separadas, sem abstração comum.** Rejeitada: duplicaria o modelo de engajamento (View/Vote/Comment) por formato; cada novo formato exigiria novo conjunto de tabelas de engagement.
- **B — `Presentation` absorve tudo (um `Post` é uma `Presentation` de um slide longo).** Rejeitada: forçaria o conceito de `Slide` sobre conteúdo prosa, semanticamente incorreto.
- **C — Abstração comum `Artifact` com subtipos `Post` e `Presentation`.** ✓ Adotada.

## Consequências

As tabelas de engagement usam `artifact_id` (e não `presentation_id`): essa é a consequência direta e a razão de ser da decisão — engajamento uniforme sobre um único tipo, sem duplicar o modelo por formato nem impor `Slide` à prosa.
