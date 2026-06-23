# Paleta de comandos

## Status

As-built.

## Propósito

Busca/navegação por teclado para posts, apresentações, tags e destinos globais.

## Fronteira de código

- UI: `apps/web/app/_components/command-palette.tsx:16`
- Abertura: `apps/web/app/_components/app-shell.tsx:28`
- Itens: `apps/web/lib/site/palette.ts:4`
- CSS: `apps/web/app/globals.css:1475`

## Estrutura / DOM

Scrim `.scrim` cobre viewport. Caixa `.pal` é `role="dialog"` com input, lista
agrupada, estado vazio e rodapé de atalhos.

## Tokens usados

`--bg2`, `--lns`, `--ink`, `--mut`, `--fnt`, `--ac-soft`, `--mono`, `--sans`.

## Estados e interação

- Query normaliza acentos.
- Setas mudam seleção.
- Enter navega.
- Escape fecha.
- Click no scrim fecha.
- Lista vazia mostra `Nenhum resultado encontrado.`

## Movimento

Sem animação de entrada. Hover/seleção troca background em 100ms.

## A11y

Foco inicial no input. Dialog usa `aria-modal`. Itens são botões para controlar
seleção e navegação.

## Invariantes

- A paleta fecha quando o player abre.
- Itens vêm de `buildPaletteItems`; não crie lista paralela em componente.

## Como editar

Para tornar nova superfície pesquisável, adicione item em
`apps/web/lib/site/palette.ts:4` e garanta `href`, `title`, `section`, `kind`.
