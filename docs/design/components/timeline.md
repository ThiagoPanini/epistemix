# Timeline

## Status

As-built.

## Propósito

Mostrar uma cronologia derivada do catálogo: publicações, notas, palestras, início de estudo e conquistas.

## Fronteira de código

- View: `apps/web/app/_components/timeline-view.tsx` (componente `TimelineView`, mapa de rótulos por tipo)
- Derivação: `apps/web/lib/catalog/catalog.ts` (read-model da timeline)
- CSS: `apps/web/app/globals.css`, bloco `.tl-year`/`.tl-row`/`.tl-date`/`.tl-type`/`.tl-t`

## Estrutura / DOM

`.page-head` introduz a superfície. Cada ano é `h2.tl-year`; cada evento é `a.tl-row` com `time.tl-date`, `.tl-type` e `.tl-t`.

## Tokens usados

`--ln`, `--bg2`, `--fnt`, `--mut`, `--ac-text`, `--mono`.

## Estados e interação

- Eventos linkam para Artifact/Source real.
- Tipo quente recebe `.hot`.
- Empty state aparece quando não há eventos.

## Movimento

`.tl-row:hover` muda o fundo da linha (`background`, 140ms); a cor muda apenas no título `.tl-t` (`color`, 140ms) via `.tl-row:hover .tl-t`. Data (`.tl-date`) e tipo (`.tl-type`) não trocam de cor no hover. Sem animação de timeline.

## A11y

Use `<time dateTime>`. Não esconda data em mobile (o `@media (max-width: 720px)` esconde apenas `.tl-type`). O link inteiro deve permanecer focável.

## Invariantes

Timeline é read-model derivado; não é conteúdo autorado. Para mudar a timeline, mude o catálogo ou a regra derivada.

## Como editar

Novo tipo de evento exige atualização de `TimelineEventType` em `apps/web/lib/catalog/domain.ts`, derivação em `catalog.ts` e rótulo no mapa de tipos em `timeline-view.tsx`.
