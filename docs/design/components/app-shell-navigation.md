# App shell e navegação

## Status

As-built.

## Propósito

Dar moldura editorial global: topbar, rubricas sticky, área de conteúdo, footer e
paleta. O shell deve parecer uma publicação viva, não um dashboard.

## Fronteira de código

- `apps/web/app/_components/app-shell.tsx:23`
- `apps/web/app/_components/topbar.tsx:33`
- `apps/web/app/_components/rubrics.tsx:22`
- `apps/web/app/globals.css:101`, `183`, `2124`

## Estrutura / DOM

`AppShell` renderiza:

- `<Topbar />` com marca, data local, busca, GitHub e conta.
- `<Rubrics />` com `nav aria-label="Rubricas"`.
- `<div className="view">` para cada rota.
- `<footer className="foot">`.
- `<CommandPalette />` condicional.

Topbar usa `header.topbar > .topbar-in.wrap`. Rubrics usa barra sticky com
scroll horizontal quando necessário.

## Tokens usados

`--bg`, `--sf`, `--ln`, `--lns`, `--ink`, `--mut`, `--fnt`, `--ac`,
`--ac-text`, `--ac-soft`, `--mono`, `--sans`.

## Estados e interação

- `Meta/Ctrl+K` alterna paleta; Escape fecha.
- Rubrica ativa recebe classe `.on`.
- Topbar esconde data e GitHub em mobile estreito.
- Conta reserva slot via skeleton enquanto sessão carrega.

## Movimento

`AppShell` define `data-motion="on"`. Entrada de `.view` é global e reduzível em
`apps/web/app/globals.css:2154`.

## A11y

- Topbar busca tem `aria-label`.
- Rubrics usa `<nav aria-label="Rubricas">`.
- Skeleton de conta é `aria-hidden`.
- Não coloque links invisíveis só visuais; todo item de navegação precisa ser link real.

## Invariantes

- Marca exibida é `ethitorial`.
- Rubricas públicas seguem a linguagem de UI: Home, Blog, Cursos, Livros,
  Certificações, Apresentações, Cronologia, Grafo.
- Player aberto bloqueia abertura de paleta pelo shell.

## Como editar

Para novo item global, atualize `NAV_ITEMS` em `rubrics.tsx:6`, a paleta em
`apps/web/lib/site/palette.ts:4` se ele for pesquisável, e este contrato. Preserve
altura compacta da topbar e z-index da rubrica (`20`).
