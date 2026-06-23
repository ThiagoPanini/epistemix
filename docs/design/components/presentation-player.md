# Talks e player de apresentações

## Status

Player as-built. Conteúdo produtivo de apresentações ainda pendente: não há
`content/presentations/` no catálogo atual; existe fixture válida em
`apps/web/lib/catalog/__fixtures__/valid/presentations/ethitorial-visao/presentation.yml`.

## Propósito

Renderizar `Presentation` como experiência fullscreen, navegável por teclado, sem
virar editor de slides.

## Fronteira de código

- Página de apresentação: `apps/web/app/_components/presentation-page-view.tsx:9`
- Player: `apps/web/app/_components/presentation-player.tsx:7`
- Rota: `apps/web/app/talks/[presentation]/page.tsx:21`
- Talks vazio: `apps/web/app/talks/page.tsx:8`
- Loader: `apps/web/lib/catalog/catalog.ts:152`
- CSS: `apps/web/app/globals.css:1584`

## Estrutura / DOM

`PresentationPageView` mostra page-head e botão "Abrir slides". `PresentationPlayer`
é `div.player[role="dialog"]`, com progresso no topo, palco, slide e barra de
navegação inferior.

## Tokens usados

`--bg`, `--ac`, `--ln`, `--lns`, `--ink`, `--mut`, `--serif`, `--mono`.
Literal consciente: fundo `#070605`.

## Estados e interação

- Resume por `localStorage` em chave `epx:player:<slug>`.
- `epx:player-state` informa o shell para fechar/bloquear paleta.
- Setas, espaço, PageDown/PageUp navegam.
- Escape fecha.
- Botões anterior/próximo desabilitam nas extremidades.

## Movimento

Barra de progresso anima largura em 240ms. Sem transição de slide as-built.

## A11y

Dialog tem `aria-label` com título da apresentação. Botões possuem labels. A
experiência depende de teclado e deve preservar contraste alto.

## Invariantes

- `Presentation` pertence a Section `direct`.
- Cada Presentation tem ao menos um Slide.
- Player não é editor; conteúdo vem do catálogo.

## Como editar

Ao introduzir `content/presentations/`, mantenha YAML conforme loader e adicione
smoke de rota. Se mudar chrome do player, preserve z-index `110`, Escape e evento
`epx:player-state`.
