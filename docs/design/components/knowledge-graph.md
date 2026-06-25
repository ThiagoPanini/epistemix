# Knowledge Graph

## Status

As-built com dívida consciente: layout determinístico tag/artifact e raio fixo, embora o bundle original sugerisse raio por leituras. A legenda renderiza "ARTEFATO (raio = leituras)", mas o raio hoje é hardcoded e `reads` é 0 na derivação (`catalog.ts`).

## Propósito

Revelar conexões entre tags curadas e artefatos publicados.

## Fronteira de código

- View: `apps/web/app/_components/graph-view.tsx` (componente `GraphView`, legenda `.graph-legend`, `ArtifactNode`)
- Derivação/layout: `apps/web/lib/catalog/catalog.ts` (read-model do grafo, raio/posições)
- Tipos: `apps/web/lib/catalog/domain.ts` (`KnowledgeGraph*`)
- CSS: `apps/web/app/globals.css`, bloco GRAFO (`.graph-box`, `.graph-legend`, `.gedge`, `.gnode`)

## Estrutura / DOM

`.graph-box` contém `.graph-legend` e `<svg className="graph" viewBox="0 0 1000 640">`. Tags são quadrados; artefatos são círculos dentro de links SVG; arestas são linhas.

## Tokens usados

`--bg`, `--bg2`, `--ln`, `--lns`, `--ac`, `--ac-line`, `--ac-text`, `--ac-soft`, `--ink`, `--mut`, `--mono`.

## Estados e interação

- Hover em tag/artefato destaca vizinhança.
- Clique em artefato navega para leitura.
- Legenda mostra contagem de artefatos, tags e conexões.

## Movimento

Transições de stroke/fill/opacity em 160ms (`.gedge`, `.gnode circle`, `.gnode text`). Sem física, simulação ou animação contínua.

## A11y

SVG tem `aria-label` e `<title>`. Artefatos são links. Tags ainda são grupos hover-only; evolução futura deve adicionar foco equivalente.

## Invariantes

- Nós e arestas vêm de tags curadas em `content/tags.yml`.
- Layout é determinístico; não depende de viewport nem ordem aleatória.
- Não autorar posições manualmente no conteúdo.

## Como editar

Se views reais passarem a alimentar raio, atualize `KnowledgeGraphArtifactNode` em `domain.ts`, a derivação em `catalog.ts`, a legenda `.graph-legend` em `graph-view.tsx` e este contrato.
