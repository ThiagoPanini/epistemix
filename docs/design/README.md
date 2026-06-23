# Design system as-built do ethitorial

Este diretório é o contrato vivo de design do ethitorial para humanos e agentes.

Regra-mãe: **origem não é fonte-da-verdade**. O bundle congelado da Direção A
("Prensa") em `.claude/design/epistemix-redesenho-completo/` é a origem creditada
do redesign. A fonte-da-verdade é o código as-built, especialmente
`apps/web/app/globals.css:9` e os componentes em `apps/web/app/_components/`.
Quando o bundle e o código divergem, documente o delta e siga o código.

## Ordem de leitura

1. `procedencia-e-deltas.md` - de onde veio o design, o rename visível e o mapa de
   divergências.
2. `design-spec.md` - tokens, tipografia, voz, movimento, literais conscientes e
   convenções de extensão.
3. `layout.md` - estrutura, grid, breakpoints e z-index.
4. `accessibility.md` - foco, teclado, semântica, reduced-motion e trade-offs.
5. `components/*.md` - contratos por fronteira de código.
6. `como-adicionar-superficie.md` - fluxo para criar ou estender uma tela cruzando
   design, catálogo e domínio.

## Mapa dos contratos

| Área | Contrato | Código as-built |
|---|---|---|
| Shell, topbar, rubricas e footer | `components/app-shell-navigation.md` | `apps/web/app/_components/app-shell.tsx:23`, `topbar.tsx:33`, `rubrics.tsx:22`, `apps/web/app/globals.css:101` |
| Home, masthead, now-learning e grids | `components/home.md` | `apps/web/app/_components/home-view.tsx:80`, `apps/web/app/globals.css:244` |
| Seções, sources, listagens e WIP | `components/catalog-listings.md` | `section-view.tsx:17`, `section-direct-view.tsx:6`, `source-view.tsx:11`, `wip-page.tsx:1` |
| Leitura de post e prosa MDX | `components/reading.md` | `apps/web/app/[section]/[source]/[post]/page.tsx:59`, `apps/web/app/globals.css:752` |
| Views, votes e comentários | `components/engagement.md` | `vote-button.tsx:8`, `view-tracker.tsx:14`, `comment-section.tsx:139`, `apps/web/app/globals.css:785` |
| Timeline | `components/timeline.md` | `timeline-view.tsx:13`, `apps/web/app/globals.css:1290` |
| Knowledge Graph | `components/knowledge-graph.md` | `graph-view.tsx:7`, `apps/web/lib/catalog/catalog.ts:304`, `apps/web/app/globals.css:1363` |
| Paleta de comandos | `components/command-palette.md` | `command-palette.tsx:16`, `apps/web/lib/site/palette.ts:4`, `apps/web/app/globals.css:1486` |
| Talks e player de slides | `components/presentation-player.md` | `presentation-page-view.tsx:9`, `presentation-player.tsx:7`, `apps/web/app/talks/page.tsx:8` |
| Auth, conta e autor | `components/auth-account-author.md` | `auth-layout.tsx:28`, `account-nav.tsx:8`, `apps/web/app/authors/[username]/page.tsx:40` |
| Tags e estados vazios | `components/tags-empty-states.md` | `tag-link.tsx:4`, `apps/web/app/tags/[tag]/page.tsx:82`, `apps/web/app/globals.css:2172` |

## Escopo atual

Contrato as-built completo: shell, navegação, home, catálogo MDX, leitura,
engagement autenticado, comentários, timeline, grafo, busca, auth, conta, autor,
tags e empty states.

`Books`, `Certifications` e `Talks/Presentations` têm estrutura de rota e design,
mas ainda não têm conteúdo produtivo suficiente no `content/`. Marque extensões
dessas áreas como **shell construído, conteúdo pendente**. O player de slides está
construído e testável por fixtures, mas sem `content/presentations/` produtivo.

## Regras para agentes

- Use tokens de `apps/web/app/globals.css:9`. Não copie valores literais.
- Se precisar de literal, catalogue em `design-spec.md` como "literal consciente".
- Não abra o bundle para implementar fluxo comum. Abra-o só para procedência ou
  para spec futura rotulada como tal.
- Não reintroduza nomes, URLs ou copy do bundle antigo no produto vivo.
- Ao criar componente novo, documente contrato e código no mesmo PR.
- Onde domínio e forma divergirem, preserve a linguagem de `docs/CONTEXT.md` para
  intenção e o as-built para forma visual; registre a tensão em
  `procedencia-e-deltas.md`.
