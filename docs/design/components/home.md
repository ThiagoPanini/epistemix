# Home, masthead e descoberta

## Status

As-built.

## Propósito

Apresentar a edição viva do hub: masthead, estudo atual, destaque, últimas entradas e rubricas. A home é mais jornal do que landing page.

## Fronteira de código

- `apps/web/app/_components/home-view.tsx` (componente `HomeView`)
- `apps/web/lib/site/model.ts` (read-model da home)
- `apps/web/lib/catalog/catalog.ts` (derivação do catálogo)
- `apps/web/app/globals.css`: blocos `.mast`, `.nowl`, `.lead-grid`, `.secs`

## Estrutura / DOM

- `.mast`: wordmark gigante `ethitorial`, régua e linha editorial.
- `.nowl`: bloco "AGORA ESTUDANDO", cards roláveis.
- `.lead-grid`: post destacado e coluna de últimas entradas.
- `.secs`: grid das rubricas com contagem e descrição (filhos `.sec-col`, `.sec-name`, `.sec-count`, `.sec-desc`).

## Tokens usados

`--ln-heavy`, `--ln`, `--sf`, `--bg2`, `--ink`, `--mut`, `--fnt`, `--ac`, `--ac-text`, `--row-pad`, `--serif`, `--mono`.

## Estados e interação

- Se `nowLearning` vier vazio, o bloco não renderiza.
- Destaque é `featured`; últimas entradas vêm de `latest`.
- Seções vazias continuam visíveis com contagem `0`.
- Tags são links por `TagLink`, não chips mortos.

## Movimento

O ponto de "AGORA ESTUDANDO" (`.live-dot`) pulsa apenas quando o usuário permite motion — regra gateada por `[data-motion="on"]` + `@media (prefers-reduced-motion: no-preference)` no bloco `.live-dot` de `globals.css`.

## A11y

Masthead é H1 único da home. Cards principais são links reais. Evite inserir texto explicativo de uso dentro da home.

## Invariantes

- A tagline corrente é `ESPAÇO PESSOAL DE APRENDIZADO E ESTUDO · THIAGO PANINI`.
- A linha de edição dinâmica é as-built e permanece documentada, apesar de docs antigos terem dito que ela seria removida.
- Now Learning é qualitativo; sem barra de progresso ou percentual.

## Como editar

Novas faixas de descoberta devem derivar do catálogo ou de read-model explícito. Não use mock local. Se uma faixa for permanente, crie bloco CSS próprio em `globals.css` e adicione seção neste contrato.
