# Knowledge Graph

## Status

As-built com dívida consciente: layout determinístico tag/artifact e raio fixo,
embora o bundle original sugerisse raio por leituras.

## Propósito

Revelar conexões entre tags curadas e artefatos publicados.

## Fronteira de código

- View: `apps/web/app/_components/graph-view.tsx:7`
- Derivação/layout: `apps/web/lib/catalog/catalog.ts:304`
- Tipos: `apps/web/lib/catalog/domain.ts:59`
- CSS: `apps/web/app/globals.css:1363`

## Estrutura / DOM

`.graph-box` contém legenda e `<svg className="graph" viewBox="0 0 1000 640">`.
Tags são quadrados; artefatos são círculos dentro de links SVG; arestas são linhas.

## Tokens usados

`--bg2`, `--ln`, `--lns`, `--ac`, `--ac-line`, `--ac-text`, `--ac-soft`,
`--ink`, `--mut`, `--mono`.

## Estados e interação

- Hover em tag/artefato destaca vizinhança.
- Clique em artefato navega para leitura.
- Legenda mostra contagem de artefatos, tags e conexões.

## Movimento

Transições de stroke/fill/opacity em 140ms. Sem física, simulação ou animação
contínua.

## A11y

SVG tem `aria-label` e `<title>`. Artefatos são links. Tags ainda são grupos
hover-only; evolução futura deve adicionar foco equivalente.

## Invariantes

- Nós e arestas vêm de tags curadas em `content/tags.yml`.
- Layout é determinístico; não depende de viewport nem ordem aleatória.
- Não autorar posições manualmente no conteúdo.

## Como editar

Se views reais passarem a alimentar raio, atualize `KnowledgeGraphArtifactNode`
em `domain.ts`, `catalog.ts:304`, legenda em `graph-view.tsx:286` e este contrato.
