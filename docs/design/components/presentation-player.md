# Talks e player de apresentações

## Status

Player as-built (componente próprio, sem pacote de motor de slides). Conteúdo produtivo de apresentações ainda pendente: não há `content/presentations/` no catálogo atual; existe fixture válida em `apps/web/lib/catalog/__fixtures__/valid/presentations/ethitorial-visao/presentation.yml`.

## Propósito

Renderizar `Presentation` como experiência fullscreen, navegável por teclado, sem virar editor de slides.

## Fronteira de código

- Página de apresentação: `apps/web/app/_components/presentation-page-view.tsx` (componente `PresentationPageView`)
- Player: `apps/web/app/_components/presentation-player.tsx` (componente `PresentationPlayer`)
- Rota de apresentação: `apps/web/app/talks/[presentation]/page.tsx`
- Listagem de palestras: `apps/web/app/talks/page.tsx` (componente `TalksPage`) — lista populada de `Link.art-row` (`art-date`, `art-t`, `art-x`, `art-side` com `{n} slides`), com page-head e contagem `deck`/`decks`; renderiza zero linhas enquanto não houver conteúdo
- Loader: `apps/web/lib/catalog/catalog.ts` (`loadPresentations`)
- CSS: `apps/web/app/globals.css`, bloco PLAYER DE SLIDES (`.player`)

## Estrutura / DOM

`PresentationPageView` mostra page-head e botão "Abrir slides". `PresentationPlayer` é `div.player[role="dialog"]`, com progresso no topo, palco, slide e barra de navegação inferior.

## Tokens usados

`--bg`, `--ac`, `--ln`, `--lns`, `--ink`, `--mut`, `--serif`, `--mono`. Literal consciente: fundo `#070605`.

## Estados e interação

- Resume por `localStorage` em chave `epx:player:<slug>`.
- `epx:player-state` informa o shell para fechar/bloquear paleta (`detail.open`).
- Setas, espaço, PageDown/PageUp navegam (ArrowRight/Space/PageDown avança; ArrowLeft/PageUp volta).
- Escape fecha.
- Botões anterior/próximo desabilitam nas extremidades.

## Movimento

Barra de progresso anima largura em 240ms (`.player-top i`, `transition: width 240ms`). Sem transição de slide as-built.

## A11y

Dialog tem `aria-label` com título da apresentação. Botões possuem labels. A experiência depende de teclado e deve preservar contraste alto.

## Invariantes

- `Presentation` pertence a Section `direct` no domínio (CONTEXT.md). Observação as-built: esse vínculo não é instanciado no código — `loadPresentations` carrega de diretório fixo `presentations` e atribui `sectionSlug: "presentations"` hardcoded em `domain.ts`, sem ler `kind` de `sections.yml`.
- Cada Presentation tem ao menos um Slide.
- Player não é editor; conteúdo vem do catálogo.

## Como editar

Ao introduzir `content/presentations/`, mantenha YAML conforme loader e adicione smoke de rota. Se mudar chrome do player, preserve z-index `110`, Escape e evento `epx:player-state`.
