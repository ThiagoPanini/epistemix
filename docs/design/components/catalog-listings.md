# Catálogo, seções e sources

## Status

As-built para Courses e Blog. Shell construído, conteúdo pendente para Books e
Certifications. Talks tem rota própria documentada em `presentation-player.md`.

## Propósito

Listar o catálogo MDX respeitando o domínio:

- `direct`: Artifacts diretamente sob Section.
- `with_sources`: Sources como nível intermediário e Posts como notas/reviews.

## Fronteira de código

- `apps/web/app/[section]/page.tsx:15`
- `apps/web/app/_components/section-view.tsx:17`
- `apps/web/app/_components/section-direct-view.tsx:6`
- `apps/web/app/_components/source-view.tsx:11`
- `apps/web/app/_components/wip-page.tsx:1`
- `apps/web/lib/site/model.ts:51`
- `content/sections.yml:2`
- `apps/web/app/globals.css:569`, `600`, `694`, `730`

## Estrutura / DOM

- `.page.wrap` envolve seção.
- `.page-head` carrega kicker, H1, descrição e meta.
- `.src-card` representa um `Source`.
- `.art-row` representa um `Post` direto.
- `.note-row` representa um `Post` dentro de `Source`.
- `.empty-state` cobre listagens sem publicados.

## Tokens usados

`--ln`, `--lns`, `--ln-heavy`, `--sf`, `--bg2`, `--ink`, `--mut`, `--fnt`,
`--ac-text`, `--ac-line`, `--row-pad`, `--serif`, `--mono`.

## Estados e interação

- `with_sources`: cards linkam para `/<section>/<source>`.
- `direct`: rows linkam para `/<section>/<post>`.
- Source com `studyStatus` mostra `status-chip`.
- WIP aparece para seções planejadas sem materialização suficiente.
- Empty states não escondem rubricas do nav ou home.

## Movimento

Hover muda fundo/borda/cor em 140ms. Sem movimento espacial local.

## A11y

Listagens são links inteiros com texto suficiente. Datas visíveis devem ser
mantidas em texto, não apenas ícone/cor.

## Invariantes

- `Courses`, `Books`, `Certifications` são `with_sources`.
- `Blog` e `Presentations` são `direct` no domínio.
- Ordem de notas em Source respeita `post_order` quando declarado.

## Como editar

Para nova Section produtiva, atualize `content/sections.yml`, o catálogo e, se
ela exigir ícone/estado planejado, `apps/web/lib/site/model.ts:51`. Não crie rota
especial se a hierarquia `direct`/`with_sources` resolver.
