# Design system as-built do ethitorial

Este diretório é o contrato vivo de design do ethitorial para humanos e agentes.

Regra-mãe: **origem não é fonte-da-verdade**. O bundle congelado da Direção A ("Prensa") em `.claude/design/epistemix-redesenho-completo/` é a origem creditada do redesign. A fonte-da-verdade é o código as-built, especialmente o bloco `:root` de `apps/web/app/globals.css` e os componentes em `apps/web/app/_components/`. Quando o bundle e o código divergem, documente o delta e siga o código.

## Ordem de leitura

1. `procedencia-e-deltas.md` - de onde veio o design, o rename visível e o mapa de divergências.
2. `design-spec.md` - tokens, tipografia, voz, movimento, literais conscientes e convenções de extensão.
3. `layout.md` - estrutura, grid, breakpoints e z-index.
4. `accessibility.md` - foco, teclado, semântica, reduced-motion e trade-offs.
5. `components/*.md` - contratos por fronteira de código.
6. `como-adicionar-superficie.md` - fluxo para criar ou estender uma tela cruzando design, catálogo e domínio.

## Mapa dos contratos

Âncoras de código usam símbolo (export/seletor CSS), não número de linha. Procure o símbolo no arquivo indicado.

| Área | Contrato | Código as-built |
|---|---|---|
| Shell, topbar, rubricas e footer | `components/app-shell-navigation.md` | `app-shell.tsx` `AppShell`, `topbar.tsx` `Topbar`, `rubrics.tsx` `Rubrics`, `globals.css` regra `.topbar` |
| Home, masthead, now-learning e grids | `components/home.md` | `home-view.tsx` `HomeView`, `globals.css` regra `.mast` |
| Seções, sources, listagens e WIP | `components/catalog-listings.md` | `section-view.tsx` `SectionWithSourcesView`, `section-direct-view.tsx` `SectionDirectView`, `source-view.tsx` `SourceView`, `wip-page.tsx` `WipPage` |
| Leitura de post e prosa MDX | `components/reading.md` | `apps/web/app/[section]/[source]/[post]/page.tsx` `PostPage`, `globals.css` regra `.read-grid` |
| Views, votes e comentários | `components/engagement.md` | `vote-button.tsx` `VoteButton`, `view-tracker.tsx` `ViewTracker`, `comment-section.tsx` `CommentSection`, `globals.css` regra `.engage` |
| Timeline | `components/timeline.md` | `timeline-view.tsx` `TimelineView`, `globals.css` regra `.tl-row` (bloco `CRONOLOGIA`) |
| Knowledge Graph | `components/knowledge-graph.md` | `graph-view.tsx` `GraphView`, `apps/web/lib/catalog/catalog.ts` builder `knowledgeGraph`, `globals.css` regra `.graph` (bloco `GRAFO`) |
| Paleta de comandos | `components/command-palette.md` | `command-palette.tsx` `CommandPalette`, `apps/web/lib/site/palette.ts` `buildPaletteItems`, `globals.css` regra `.pal` (bloco `COMMAND PALETTE`) |
| Talks e player de slides | `components/presentation-player.md` | `presentation-page-view.tsx` `PresentationPageView`, `presentation-player.tsx` `PresentationPlayer`, `apps/web/app/talks/page.tsx` `TalksPage` |
| Auth, conta e autor | `components/auth-account-author.md` | `auth-layout.tsx` `AuthLayout`, `account-nav.tsx` `AccountNav`, `apps/web/app/authors/[username]/page.tsx` `AuthorPage` |
| Tags e estados vazios | `components/tags-empty-states.md` | `tag-link.tsx` `TagLink`, `apps/web/app/tags/[tag]/page.tsx` `TagPage`, `globals.css` regras `.tag-link` e `.empty-state` |

## Escopo atual

Contrato as-built completo: shell, navegação, home, catálogo MDX, leitura, engagement autenticado, comentários, timeline, grafo, busca, auth, conta, autor, tags e empty states.

`Books`, `Certifications` e `Talks/Presentations` têm estrutura de rota e design, mas ainda não têm conteúdo produtivo suficiente no `content/`. Marque extensões dessas áreas como **shell construído, conteúdo pendente**. O player de slides está construído e testável por fixtures, mas sem `content/presentations/` produtivo.

## Regras para agentes

- Use tokens do bloco `:root` de `apps/web/app/globals.css`. Não copie valores literais.
- Se precisar de literal, catalogue em `design-spec.md` como "literal consciente".
- Não abra o bundle para implementar fluxo comum. Abra-o só para procedência ou para spec futura rotulada como tal.
- Não reintroduza nomes, URLs ou copy do bundle antigo no produto vivo.
- Ao criar componente novo, documente contrato e código no mesmo PR.
- Onde domínio e forma divergirem, preserve a linguagem de `docs/CONTEXT.md` para intenção e o as-built para forma visual; registre a tensão em `procedencia-e-deltas.md`.
