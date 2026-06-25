# App shell e navegação

## Status

As-built.

## Propósito

Dar moldura editorial global: topbar, rubricas sticky, área de conteúdo, footer e paleta. O shell deve parecer uma publicação viva, não um dashboard.

## Fronteira de código

- `apps/web/app/_components/app-shell.tsx` (componente `AppShell`)
- `apps/web/app/_components/topbar.tsx` (componente `Topbar`)
- `apps/web/app/_components/rubrics.tsx` (componente `Rubrics`, array `NAV_ITEMS`)
- `apps/web/app/globals.css`: bloco TOPBAR (`.topbar`), bloco RUBRICAS (`.rubrics`), bloco FOOTER (`.foot`), bloco MOTION (`@keyframes viewin`)

## Estrutura / DOM

`AppShell` renderiza:

- `<Topbar />` com marca, data local, busca, GitHub e conta.
- `<Rubrics />` com `nav aria-label="Rubricas"`.
- `<div className="view">` para cada rota.
- `<footer className="foot">`.
- `<CommandPalette />` condicional.

Topbar usa `header.topbar > .topbar-in.wrap`. Rubrics usa barra sticky com scroll horizontal quando necessário.

## Tokens usados

`--bg`, `--sf`, `--ln`, `--lns`, `--ink`, `--mut`, `--fnt`, `--ac`, `--ac-text`, `--ac-soft`, `--mono`, `--sans`.

## Estados e interação

- `Meta/Ctrl+K` alterna paleta; Escape fecha.
- Rubrica ativa recebe classe `.on`.
- Topbar esconde data e GitHub em mobile estreito: `.date-hide` e `.gh-hide` somem no breakpoint `@media (max-width: 560px)` em `globals.css`.
- Conta reserva slot via skeleton enquanto sessão carrega.

## Movimento

`AppShell` define `data-motion="on"`. A entrada de `.view` (`animation: viewin 260ms ease-out`) só é aplicada dentro de `@media (prefers-reduced-motion: no-preference)` no bloco MOTION de `globals.css` — ou seja, é suprimida quando o usuário pede menos movimento.

## A11y

- Topbar busca tem `aria-label`.
- Rubrics usa `<nav aria-label="Rubricas">`.
- Skeleton de conta é `aria-hidden`.
- Não coloque links invisíveis só visuais; todo item de navegação precisa ser link real.

## Invariantes

- Marca exibida é `ethitorial`.
- Rubricas públicas seguem a linguagem de UI: Home, Blog, Cursos, Livros, Certificações, Apresentações, Cronologia, Grafo.
- Player aberto bloqueia abertura de paleta pelo shell.

## Como editar

Para novo item global, atualize o array `NAV_ITEMS` em `rubrics.tsx`, a paleta em `apps/web/lib/site/palette.ts` (array `NAV_ITEMS` para item de navegação pesquisável) se ele for pesquisável, e este contrato. Preserve altura compacta da topbar e z-index da rubrica (`20`).
