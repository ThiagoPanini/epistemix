# corpus/ — amostras canônicas da voz do autor

Esta pasta é o home documentado das amostras reais usadas para calibrar `references/STYLE.md`.

## Estado atual

`references/STYLE.md` **v1 já foi destilado** do backup completo do Hashnode — os 40 artigos das
séries Linux Básico, Visão Geral sobre o Ecossistema Hadoop e Apache Spark (2022) — que vive em
**`tmp/blog/hashnode_backup/`** no repo, mais o post atual `content/courses/aihero/
primeiras-impressoes.mdx` (2026). Por isso esta pasta pode estar vazia: o corpus-base mora no
`tmp/`, não duplicado aqui.

Para re-destilar a voz a qualquer momento, use o comando **`eptmx calibrate`** (playbook em
`commands/calibrate.md`) — ele sabe onde procurar (backup, posts do repo, exports novos).

## Quando chegar um export NOVO do Hashnode

O scraping direto não funciona (`panini.hashnode.dev` está atrás do Cloudflare; a GraphQL
gratuita foi aposentada em 2026-05). O caminho confiável para conteúdo novo:

1. **Exportar / fazer backup no Hashnode** (Dashboard → backup de dados). O backup atual já foi
   obtido e está em `tmp/blog/hashnode_backup/` como markdown por artigo.

2. **Se vier como JSON**, converta com:

   ```bash
   node .agents/skills/eptmx/scripts/hashnode-to-corpus.mjs <export>.json --out <dir>
   ```

   Grava um `.md` por Post (frontmatter leve: title, slug, date, tags, series). Prefere o campo
   markdown do export; se vier HTML, faz conversão de segurança e avisa. É defensivo a variações
   de schema — imprime as chaves detectadas se o formato tiver mudado.

3. **Re-destilar**: `eptmx calibrate` apontando para o novo material.

Quanto mais variado o corpus (post solto, nota de série técnica, review, texto opinativo), mais
fiel fica a calibragem.
