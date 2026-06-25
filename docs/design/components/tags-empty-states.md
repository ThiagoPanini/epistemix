# Tags e estados vazios

## Status

As-built. Atenção: o chip de tag usa a classe `.tag`, que é estática — não há `:hover` nem `transition` no CSS as-built. Existe uma regra órfã `.tag-link`/`.tag-link:hover` em `globals.css`, mas a classe `tag-link` nunca é aplicada a nenhum elemento (`tag-link` é só o nome/import do componente React).

## Propósito

Tags conectam descoberta, leitura, paleta e grafo. Estados vazios mantêm o produto honesto sem esconder áreas planejadas.

## Fronteira de código

- Tag chip/link: `apps/web/app/_components/tag-link.tsx` (componente `TagLink`, renderiza `<Link className="tag">`)
- Tag page: `apps/web/app/tags/[tag]/page.tsx` (rota de tag; chips renderizados como `<span className="tag">`)
- Empty CSS: `apps/web/app/globals.css`, bloco `.empty-state`
- Tag CSS: `apps/web/app/globals.css`, bloco `.tag` e bloco `.tag-page`/`.tag-page-head`/`.tag-title`
- Tags curadas: `content/tags.yml`

## Estrutura / DOM

Tags aparecem em `.tagrow` com a classe `.tag` (na home/listagens via `TagLink`, que é `<Link>`; na leitura como `<span>` estático). Página de tag usa `.tag-page`, `.tag-page-head`, `.tag-title` e listagem de artefatos. Empty state usa `.empty-state` com título e parágrafo curto.

## Tokens usados

`--ln`, `--ac-line`, `--ac-text`, `--mut`, `--fnt`, `--ink`, `--mono`, `--serif`.

## Estados e interação

- O chip `.tag` é estático: não há regra `:hover` nem troca de borda/cor para acento no CSS as-built.
- Onde a tag é navegável, isso vem do elemento `<Link>` do `TagLink`, não de um estilo de hover do chip.
- Tag inexistente deve cair em not found (`notFound()` na rota de tag).
- Empty state não vira CTA de marketing; é curto e factual.

## Movimento

Nenhuma. A classe `.tag` não declara `transition` alguma; o chip não anima. (A única transição de cor 140ms relacionada vive na classe órfã `.tag-link`, nunca aplicada.)

## A11y

Onde a tag é link (`TagLink`), é link com texto. Empty state não deve depender apenas de ícone; título (`h2`) e parágrafo (`p`) são obrigatórios.

## Invariantes

- Tags pertencem a conjunto curado fechado.
- Tag fora de `content/tags.yml` deve falhar build quando referenciada.
- Não use tag como categoria solta; categoria de topo é `Section`.

## Como editar

Nova tag entra em `content/tags.yml`; depois valide páginas, paleta e grafo. Se criar novo empty state, use `.empty-state` antes de criar variação visual. Se quiser tornar o chip `.tag` interativo, decida entre aplicar a classe `tag-link` aos chips ou mover a regra `:hover`/`transition` para `.tag` — e atualize este contrato.
