# Tags e estados vazios

## Status

As-built.

## Propósito

Tags conectam descoberta, leitura, paleta e grafo. Estados vazios mantêm o
produto honesto sem esconder áreas planejadas.

## Fronteira de código

- Tag chip/link: `apps/web/app/_components/tag-link.tsx:4`
- Tag page: `apps/web/app/tags/[tag]/page.tsx:82`
- Empty CSS: `apps/web/app/globals.css:2172`
- Tag CSS: `apps/web/app/globals.css:653`, `2202`
- Tags curadas: `content/tags.yml`

## Estrutura / DOM

Tags aparecem em `.tagrow` como links `.tag`. Página de tag usa `.tag-page`,
`.tag-page-head`, `.tag-title` e listagem de artefatos. Empty state usa
`.empty-state` com título e parágrafo curto.

## Tokens usados

`--ln`, `--ac-line`, `--ac-text`, `--mut`, `--fnt`, `--ink`, `--mono`, `--serif`.

## Estados e interação

- Hover de tag troca borda/cor para acento.
- Tag inexistente deve cair em not found.
- Empty state não vira CTA de marketing; é curto e factual.

## Movimento

Somente transição de cor em 140ms.

## A11y

Tags são links com texto. Empty state não deve depender apenas de ícone; título e
parágrafo são obrigatórios.

## Invariantes

- Tags pertencem a conjunto curado fechado.
- Tag fora de `content/tags.yml` deve falhar build quando referenciada.
- Não use tag como categoria solta; categoria de topo é `Section`.

## Como editar

Nova tag entra em `content/tags.yml`; depois valide páginas, paleta e grafo.
Se criar novo empty state, use `.empty-state` antes de criar variação visual.
