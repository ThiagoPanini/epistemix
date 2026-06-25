# Leitura e prosa MDX

## Status

As-built.

## Propósito

Entregar leitura longa sem fricção: heading editorial, standfirst, metadados, engagement, prosa serifada, TOC sticky e discussão.

## Fronteira de código

- Direct post: `apps/web/app/[section]/[source]/page.tsx` (rota de post direto sob Section)
- Post sob source: `apps/web/app/[section]/[source]/[post]/page.tsx` (rota de post dentro de Source)
- TOC / scroll spy: `apps/web/app/_components/toc-spy.tsx` (componente `TocSpy`, único TOC usado pela leitura)
- Code block: `apps/web/app/_components/code-block.tsx` (componente `CodeBlock`)
- CSS: `apps/web/app/globals.css`, blocos `.read-grid`, `.read-head`, `.prose`, `.toc`

## Estrutura / DOM

`.read-grid` contém `<article>` e `<aside className="toc">` (renderizado por `TocSpy` quando há headings). O article começa com `.read-head`, segue por `.engage`, depois `.prose`, em seguida um `<nav>` de paginação anterior/próximo (renderizado inline com `style`, presente quando há post mais antigo ou mais novo), e fecha com `.disc`. A ordem real é read-head → engage → prose → nav(prev/next) → `.disc`.

## Tokens usados

`--ln`, `--ln-heavy`, `--ink`, `--mut`, `--fnt`, `--ac`, `--ac-text`, `--ac-line`, `--bg`, `--bg2`, `--serif`, `--mono`.

## Estados e interação

- TOC destaca heading ativo via `.on` (gerenciado por `TocSpy` com `IntersectionObserver`).
- Tags são spans estáticos `<span className="tag">`, não clicáveis na leitura. Os únicos links do read-head ficam no kicker (Section e, no post sob source, o Source).
- Code block sempre renderiza `CopyButton`: `CodeBlock` envolve cada bloco em `.code-wrap` com `<CopyButton/>` incondicional.
- Engagement inclui voto, views e comentários.

## Movimento

TOC e prosa não têm animação própria; mudanças de hover do TOC são cor/borda (`.toc a`, transição 140ms). O clique num item do TOC dispara scroll suave da página via `scrollIntoView({ behavior: "smooth" })` em `TocSpy` — movimento programático que não é coberto pela regra `@media (prefers-reduced-motion)` de `globals.css`.

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

Ao adicionar renderizador MDX, preserve `.prose` e registre CSS/literal novo em `design-spec.md`. Se o renderizador introduzir interação client-side, documente teclado e reduced-motion aqui.
