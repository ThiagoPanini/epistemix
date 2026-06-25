# Catálogo, seções e sources

## Status

As-built para Courses e Blog. Shell construído, conteúdo pendente para Books e Certifications (servidos via `WipPage` por `ready: false` no model). Presentations também é `direct` e `ready: false` no model — hoje cai no `WipPage`; a rota própria do player descrita em `presentation-player.md` ainda não está as-built para conteúdo produtivo.

## Propósito

Listar o catálogo MDX respeitando o domínio:

- `direct`: Artifacts diretamente sob Section.
- `with_sources`: Sources como nível intermediário e Posts como notas/reviews.

## Fronteira de código

- `apps/web/app/[section]/page.tsx` (rota de seção)
- `apps/web/app/_components/section-view.tsx` (componente `SectionView`, listagem `with_sources`)
- `apps/web/app/_components/section-direct-view.tsx` (componente `SectionDirectView`, listagem `direct`)
- `apps/web/app/_components/source-view.tsx` (componente `SourceView`, notas dentro de Source)
- `apps/web/app/_components/wip-page.tsx` (componente `WipPage`)
- `apps/web/lib/site/model.ts` (flags de section, ex.: `ready`)
- `content/sections.yml` (declaração das seções)
- `apps/web/app/globals.css`: blocos `.page-head`, `.art-row`, `.src-card`, `.note-row`

## Estrutura / DOM

- `.page.wrap` envolve seção.
- `.page-head` carrega kicker, H1, descrição e meta.
- `.src-card` representa um `Source`.
- `.art-row` representa um `Post` direto.
- `.note-row` representa um `Post` dentro de `Source`.
- `.empty-state` cobre listagens sem publicados.

## Tokens usados

`--ln`, `--lns`, `--ln-heavy`, `--sf`, `--bg2`, `--ink`, `--mut`, `--fnt`, `--ac-text`, `--ac-line`, `--row-pad`, `--serif`, `--mono`.

## Estados e interação

- `with_sources`: cards linkam para `/<section>/<source>`.
- `direct`: rows linkam para `/<section>/<post>`.
- Source com `studyStatus` mostra `status-chip`.
- WIP aparece para seções planejadas sem materialização suficiente.
- Empty states não escondem rubricas do nav ou home.

## Movimento

Todas as transições são 140ms; o hover difere por componente. `.art-row:hover` muda o fundo (`background`) e a cor do título `.art-t`. `.src-card:hover` muda `border-color` + `background`. `.note-row:hover` muda apenas a cor do título `.art-t` — não muda fundo nem borda. Nenhuma listagem muda fundo, borda e cor simultaneamente. Sem movimento espacial local.

## A11y

Listagens são links inteiros com texto suficiente: `.src-card`, `.art-row` e `.note-row` são `<Link>` envolvendo a row inteira. O único link fora das rows é o breadcrumb da Section no `.page-head` de `SourceView` (kicker `<Link>` para `/<section>`). Datas visíveis devem ser mantidas em texto, não apenas ícone/cor.

## Invariantes

- `Courses`, `Books`, `Certifications` são `with_sources`.
- `Blog` e `Presentations` são `direct` no domínio.
- Ordem de notas em Source respeita `post_order` quando declarado.

## Como editar

Para nova Section produtiva, atualize `content/sections.yml`, o catálogo e, se ela exigir ícone/estado planejado, o read-model em `apps/web/lib/site/model.ts`. Não crie rota especial se a hierarquia `direct`/`with_sources` resolver. Nota de acoplamento: o label de coluna `NOTAS DO CURSO` é hardcoded em `SourceView` (`source-view.tsx`) e usado para qualquer `with_sources`, não só Courses.
