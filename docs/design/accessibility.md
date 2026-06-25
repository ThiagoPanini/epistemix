# Acessibilidade

## Contrato mínimo

O ethitorial mira WCAG AA como piso prático. A estética editorial não pode apagar foco, teclado, semântica ou estados reduzidos.

## Foco e teclado

Âncoras por símbolo/seletor, não por número de linha.

- Foco global usa `:focus-visible` com `2px solid var(--ac)` e offset `2px` (`apps/web/app/globals.css` regra `:focus-visible`).
- Topbar expõe busca por botão com `aria-label="Abrir paleta de comandos"` e `⌘K` em `<kbd>` (`apps/web/app/_components/topbar.tsx` `Topbar`, classe `.kbtn`).
- `AppShell` abre/fecha paleta por `Meta/Ctrl+K` e fecha por `Escape` (`apps/web/app/_components/app-shell.tsx` `AppShell`, handler de `keydown`).
- Paleta usa `role="dialog"`, `aria-modal`, foco inicial no input e navegação por setas/Enter/Escape (`apps/web/app/_components/command-palette.tsx` `CommandPalette`).
- Player usa `role="dialog"` e navegação por seta, espaço, PageUp/PageDown e Escape (`apps/web/app/_components/presentation-player.tsx` `PresentationPlayer`, handler de `keydown`).
- Vote usa `aria-pressed` e label alternado (`apps/web/app/_components/vote-button.tsx` `VoteButton`).
- Menu de conta usa `aria-expanded` e `role="menu"` (`apps/web/app/_components/account-nav.tsx` `AccountNav`).

## Reduced motion

Toda animação recorrente ou de entrada precisa de media query:

- `pulse` e `viewin` só rodam em `@media (prefers-reduced-motion: no-preference)`.
- Skeleton de conta (`acct-skeleton-pulse`) desliga animação em `@media (prefers-reduced-motion: reduce)`.
- Novos componentes com `animation` devem documentar o fallback reduzido no contrato do componente.

Transições simples de cor/borda permanecem permitidas, desde que não carreguem movimento espacial relevante.

## Forced colors e contraste

Ainda não há bloco `forced-colors` dedicado. Ao mexer em botões, inputs, tags, grafo ou player, valide manualmente contraste e foco. Se introduzir `forced-colors`, centralize a regra no componente afetado e adicione nota aqui.

## Semântica

- Navegação principal: `<nav aria-label="Rubricas">` (`apps/web/app/_components/rubrics.tsx` `Rubrics`).
- Leitura: `<article>` dentro de `.read-grid` (`apps/web/app/[section]/[source]/[post]/page.tsx` `PostPage`).
- Timeline: eventos são links em sequência, com `<time dateTime>` (`apps/web/app/_components/timeline-view.tsx` `TimelineView`).
- Grafo: SVG tem `<title>` e `aria-label`; nós de artefato são links (`apps/web/app/_components/graph-view.tsx` `GraphView` e `ArtifactNode`).

## Trade-offs conscientes

- O grafo usa hover para destacar vizinhança e tem suporte parcial de foco nos artefatos por serem links. Tags no SVG ainda são grupos hover-only. Isso é aceitável no as-built, mas qualquer evolução deve adicionar foco equivalente.
- Paleta fecha ao clicar no scrim; teclado continua coberto por Escape.
- Comentários são flat e sem threading por decisão de domínio; acessibilidade deve priorizar leitura linear.
