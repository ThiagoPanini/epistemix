# Paleta de comandos

## Status

As-built.

## Propósito

Busca/navegação por teclado para posts, apresentações, tags e destinos globais.

## Fronteira de código

- UI: `apps/web/app/_components/command-palette.tsx` (componente `CommandPalette`)
- Abertura: `apps/web/app/_components/app-shell.tsx` (toggle `Meta/Ctrl+K`, guarda de player aberto)
- Itens: `apps/web/lib/site/palette.ts` (array `NAV_ITEMS` para navegação manual; função `buildPaletteItems` para itens derivados de dados)
- CSS: `apps/web/app/globals.css`, bloco COMMAND PALETTE (`.scrim`, `.pal`)

## Estrutura / DOM

Scrim `.scrim` cobre viewport. Caixa `.pal` é `role="dialog"` com input, lista agrupada, estado vazio e rodapé de atalhos.

## Tokens usados

`--bg2`, `--ln`, `--lns`, `--ink`, `--fnt`, `--ac-soft`, `--mono`, `--sans`.

## Estados e interação

- Query normaliza acentos.
- Setas mudam seleção.
- Enter navega.
- Escape fecha.
- Click no scrim fecha.
- Lista vazia mostra `Nenhum resultado encontrado.`

## Movimento

Sem animação de entrada. Hover/seleção troca background em 100ms (`.pal-item`, `transition: background 100ms`).

## A11y

Foco inicial no input. Dialog usa `aria-modal`. Itens são botões para controlar seleção e navegação.

## Invariantes

- A paleta fecha quando o player abre.
- Itens vêm de `buildPaletteItems`; não crie lista paralela em componente.

## Como editar

Para tornar nova superfície pesquisável, adicione item de navegação manual ao array `NAV_ITEMS` em `apps/web/lib/site/palette.ts`, ou derive a partir de dados na função `buildPaletteItems` no mesmo arquivo, e garanta `href`, `title`, `section`, `kind` (forma definida pela interface `PaletteItem`).
