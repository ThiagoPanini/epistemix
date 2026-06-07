# Modelo do catálogo — onde o conteúdo vive e como ele valida

Tudo que a skill grava precisa casar com este modelo, senão a build/teste quebra.
Fonte de verdade no código: `apps/web/lib/catalog/` (schema Zod, loader, reserved).
Fonte de verdade no domínio: `docs/CONTEXT.md` (glossário + invariantes).

## Vocabulário canônico (use sempre estes termos)

`Post`, `Section`, `Source`, `Tag`, `Artifact`, `direct`, `with_sources`, `status`.
Termos banidos (ver `docs/CONTEXT.md`): "article" → `Post`; "category" → `Section`;
"item" → `Source`; "topic" → `Tag`; "content" → `Artifact`/`Post`. Use os canônicos
na sua interação com o autor e no frontmatter. O *corpo* do post pode usar linguagem
livre — a restrição é sobre a metalinguagem, não sobre a prosa publicada.

## Layout em disco

```
content/
├── sections.yml                       # lista de Sections (nível 1 do hub)
├── tags.yml                           # conjunto curado FECHADO de Tags
├── <section-direct>/                  # Section kind: direct
│   └── <post-slug>.mdx                #   Post vinculado direto à Section (ex: Blog)
└── <section-with-sources>/            # Section kind: with_sources
    └── <source-slug>/                 #   um diretório por Source
        ├── source.yml                 #     metadata do Source
        └── <post-slug>.mdx            #     Post vinculado ao Source (ex: nota de curso)
```

**Invariante 14:** um `Post` está vinculado a *exatamente um* `Source` (se a Section pai
for `with_sources`) **ou** diretamente a uma Section `direct` — nunca a ambos. O lugar do
arquivo é o que expressa esse vínculo. Não há campo de frontmatter para isso.

## `content/sections.yml` — schema

Array. Cada entrada (Zod: `sectionSchema`):

```yaml
- slug: blog            # único; vira o topo da rota /<slug>; kebab-case
  title: Blog           # rótulo de exibição
  kind: direct          # "direct" | "with_sources"
  order: 2              # inteiro; ordem de exibição
  description: "..."    # frase curta descrevendo a Section
```

- `slug` **não pode** ser reservado: `authors`, `about`, `api`, `_next`, `favicon.ico`,
  `robots.txt`, `sitemap.xml` (ver `reserved.ts`). "blog" é livre.
- Ao criar uma Section nova, escolha um `order` que não colida e faça sentido na navegação.

## `content/<section>/<source>/source.yml` — schema (só `with_sources`)

Zod: `sourceFileSchema`. **snake_case** no arquivo:

```yaml
name: "AI Coding for Real Engineers"
external_url: "https://www.aihero.dev/cohorts/..."
author: "Matt Pocock"
description: "Cohort sobre usar agentes de IA para programar software de verdade."
cover: "_assets/course-background.webp"        # opcional
author_avatar: "_assets/profile-instrutor.webp" # opcional
```

Os quatro primeiros campos são obrigatórios; `cover` e `author_avatar` são opcionais.
São **caminhos relativos ao diretório do Source** de imagens — a convenção é colocá-las
numa subpasta **`_assets/`** (ex.: `content/<section>/<source>/_assets/capa.webp`).
São servidas ao browser pela rota `app/content-assets/[...segments]` (o Next só serve
`public/` estático). Imagens de **identidade do hub** (ex.: avatar do autor dos posts) NÃO
vivem aqui — ficam em `public/`. O `slug` do Source é o nome do diretório (kebab-case),
não um campo do arquivo.

## Frontmatter do `Post` (`.mdx`) — schema EXATO

Zod: `postFrontmatterSchema`. Exatamente estes cinco campos, nada a mais que o schema
rejeite (campos extras são ignorados pelo parse, mas não os adicione — mantenha limpo):

```yaml
---
title: "Configurando uma VPS na Hostinger com Coolify"
date: 2026-06-06           # ISO YYYY-MM-DD (YAML sem aspas vira Date e é normalizado)
status: draft              # "draft" | "published" — a skill SEMPRE grava draft
tags: [vps, coolify]       # cada tag DEVE existir em content/tags.yml (gate fechado)
summary: "Passo a passo..."# uma frase; vira o preview/brief público
---
```

- **`slug` do Post = nome do arquivo** (`<slug>.mdx`), kebab-case, sem acento. Imutável
  após publicação (invariante 5). Espaço de slug é por subtipo.
- **`status: draft` sempre.** Invariante 6: `draft` não aparece em listagem pública,
  busca, sitemap nem feeds. É seguro mergear um draft — ele só fica público quando o
  autor trocar para `published` num PR posterior. A skill nunca grava `published`.

## Tag gate (ADR-0008 / invariante 9) — FECHADO

`content/tags.yml` é a lista curada fechada:

```yaml
- slug: ai
  label: "AI"
- slug: typescript
  label: "TypeScript"
```

Qualquer tag em frontmatter fora desta lista **quebra a build**. Por isso a skill:
1. Mapeia os temas do post contra os slugs existentes.
2. Para o que não existir, **propõe** tags candidatas (`slug` kebab + `label`), separando
   "já existe" de "seria adição".
3. Só edita `tags.yml` **após o OK explícito** do autor. Nunca adiciona em silêncio — a
   curadoria fechada é intencional.

## Self-verify (rode antes de declarar pronto)

A suíte de testes carrega o `content/` real e valida tudo (schema, tag gate, estrutura):

```bash
cd apps/web && pnpm vitest run lib/catalog
```

Verde = frontmatter válido + todas as tags existem + arquivos no lugar certo.
Vermelho = leia o erro do Zod/loader e corrija antes de entregar. Se `pnpm` não estiver
disponível, ao menos confira manualmente: cinco campos do frontmatter corretos, todas as
tags presentes em `tags.yml`, arquivo no path que expressa o vínculo certo.
