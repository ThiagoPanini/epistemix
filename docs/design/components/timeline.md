# Timeline

## Status

As-built.

## Propósito

Mostrar uma cronologia derivada do catálogo: publicações, notas, palestras, início
de estudo e conquistas.

## Fronteira de código

- View: `apps/web/app/_components/timeline-view.tsx:13`
- Derivação: `apps/web/lib/catalog/catalog.ts:226`
- CSS: `apps/web/app/globals.css:1290`

## Estrutura / DOM

`.page-head` introduz a superfície. Cada ano é `h2.tl-year`; cada evento é
`a.tl-row` com `time.tl-date`, `.tl-type` e `.tl-t`.

## Tokens usados

`--ln`, `--bg2`, `--fnt`, `--mut`, `--ac-text`, `--mono`, `--sans`.

## Estados e interação

- Eventos linkam para Artifact/Source real.
- Tipo quente recebe `.hot`.
- Empty state aparece quando não há eventos.

## Movimento

Hover troca fundo e cor em 140ms. Sem animação de timeline.

## A11y

Use `<time dateTime>`. Não esconda data em mobile. O link inteiro deve permanecer
focável.

## Invariantes

Timeline é read-model derivado; não é conteúdo autorado. Para mudar a timeline,
mude o catálogo ou a regra derivada.

## Como editar

Novo tipo de evento exige atualização de `TimelineEventType` em
`apps/web/lib/catalog/domain.ts:46`, derivação em `catalog.ts` e rótulo em
`timeline-view.tsx:5`.
