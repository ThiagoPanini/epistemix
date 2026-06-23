# Leitura e prosa MDX

## Status

As-built.

## Propósito

Entregar leitura longa sem fricção: heading editorial, standfirst, metadados,
engagement, prosa serifada, TOC sticky e discussão.

## Fronteira de código

- Direct post: `apps/web/app/[section]/[source]/page.tsx:80`
- Post sob source: `apps/web/app/[section]/[source]/[post]/page.tsx:59`
- TOC: `apps/web/app/_components/post-toc.tsx:11`
- Scroll spy: `apps/web/app/_components/toc-spy.tsx:10`
- Code block: `apps/web/app/_components/code-block.tsx:6`
- CSS: `apps/web/app/globals.css:752`, `770`, `827`, `1008`

## Estrutura / DOM

`.read-grid` contém `<article>` e `<aside className="toc">`. O article começa com
`.read-head`, segue por `.engage`, depois `.prose`, e fecha com `.disc`.

## Tokens usados

`--ln`, `--ln-heavy`, `--ink`, `--mut`, `--fnt`, `--ac`, `--ac-text`,
`--ac-line`, `--bg`, `--bg2`, `--serif`, `--mono`.

## Estados e interação

- TOC destaca heading ativo via `.on`.
- Tags são links.
- Code block pode receber botão de copiar.
- Engagement inclui voto, views e comentários.

## Movimento

TOC e prosa não têm animação própria. Mudanças de hover são cor/borda.

## A11y

- `<article>` é obrigatório.
- H1 vem antes da prosa.
- Headings MDX devem ser hierárquicos e ter `scroll-margin-top`.
- TOC some em telas menores, mas a leitura permanece linear.

## Invariantes

- Prosa usa serif; UI/metadados usam mono/sans.
- Standfirst é editorial, não resumo SEO inchado.
- Links e blockquotes usam acento com parcimônia.

## Como editar

Ao adicionar renderizador MDX, preserve `.prose` e registre CSS/literal novo em
`design-spec.md`. Se o renderizador introduzir interação client-side, documente
teclado e reduced-motion aqui.
