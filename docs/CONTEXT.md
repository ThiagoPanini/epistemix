# Contexto de Domínio — epistemix

Este documento é o **glossário e conjunto de invariantes** que define a linguagem comum do projeto. É lido por humanos e por agentes de IA antes de qualquer trabalho substantivo. Mudanças aqui são mudanças no jeito de pensar o produto.

> **Status:** atualizado após sessão `grill-with-docs` de pivô (2026-05-31): de hub de apresentações (`talkingpres`) para hub pessoal de aprendizado multi-formato (`epistemix`). Mudanças futuras passam por ADR + atualização inline.

## Glossário

| Termo | Definição operacional |
|---|---|
| **Section** | Unidade de organização de nível 1 do hub. Criada pelo admin (dinâmica — não é enum fixo no código). Tem `slug` único e `kind`: `direct` (Artifacts vinculados diretamente à Section, ex: Blog, Presentations) ou `with_sources` (Artifacts vinculados a um `Source` intermediário, ex: Courses, Books, Certifications). |
| **Source** | Referência a um item externo real (curso, livro, certificação) dentro de uma Section `with_sources`. Carrega metadata: nome, URL externa, autor/criador, descrição. Pode existir sem nenhum `Post` vinculado. Pertence a exatamente uma `Section`. |
| **Artifact** | Unidade abstrata publicável no hub. Todo `Artifact` tem: slug único (espaço separado por subtipo), título, data, tags e referência ao `User` autor. Subtipo concreto: `Post` ou `Presentation`. Alvo de `View`, `Vote` e `Comment`. |
| **Post** | Subtipo concreto de `Artifact`. Conteúdo em texto prosa (MDX). Estruturalmente idêntico independente de onde está vinculado: pode estar vinculado a um `Source` (nota de curso, review de livro, anotação de cert) ou diretamente a uma Section `direct` (post de blog). |
| **Presentation** | Subtipo concreto de `Artifact`. Contém metadata (título, descrição, tags, publicador, data) e uma sequência ordenada de `Slide`s. Sempre pertence a uma Section `direct`. Renderizada via `slide-kit`. Ver [ADR-0012](adr/0012-slide-kit-base-plus-extensoes-locais.md). |
| **Slide** | Unidade atômica dentro de uma `Presentation`. Renderizado a partir de MDX usando o `slide-kit` (catálogo base de primitivas, animações e chrome de player) + opcionalmente componentes locais da própria Presentation. Tem ordem fixa dentro da Presentation. Ver [ADR-0012](adr/0012-slide-kit-base-plus-extensoes-locais.md). |
| **Tag** | Rótulo categórico aplicado a `Artifact`s para descoberta. Pertence a conjunto curado fechado definido em `content/tags.yml`. Ver [ADR-0008](adr/0008-tags-curadas.md). |
| **User** | Pessoa autenticada na plataforma. Acumula dois papéis: (a) **publicador** de `Artifact`s, referenciado em `Artifact.published_by`; (b) **comentarista/votante** em engagement. Carrega persona pública (display name, avatar, bio), `role` (`user` ou `admin`) e `username` único e imutável usado em `/authors/<username>`. Ver [ADR-0007](adr/0007-publicar-e-papel-de-user.md) e [ADR-0011](adr/0011-url-publica-do-publicador.md). |
| **View** | Registro persistido de visualização de um `Artifact`. Disparado no carregamento da página (POST client-side, com filtro server-side de bots/crawlers). Dedup por `(artifact_id, session_id, day_bucket_UTC)`. Carrega `user_id` opcional, `referrer_kind` e `country_code`. Usado como sinal público de popularidade e base analítica. Ver [ADR-0009](adr/0009-view-como-entidade-persistida.md) e [ADR-0015](adr/0015-epistemix-domain-model.md). |
| **Vote** | Upvote de usuário autenticado em um `Artifact`. Toggle (votar / desfazer). Um voto por par `(User, Artifact)`. |
| **Comment** | Texto curto de usuário autenticado em um `Artifact`. Sujeito a moderação. |
| **Narration** *(V2)* | Sequência de áudios gerados por TTS, um por `Slide`, narrados com a voz clonada do autor. Restrito ao subtipo `Presentation`. |
| **Knowledge Base** *(V2)* | Conjunto de embeddings derivados do conteúdo de um `Artifact`, usado para responder Q&A via RAG. |

## Invariantes de domínio

> Regras que SEMPRE valem. Qualquer código que possa violá-las é bug.

1. Uma `Presentation` tem ao menos um `Slide`.
2. A ordem dos `Slide`s dentro de uma `Presentation` é total e estável.
3. Um `Vote` é único por par `(User, Artifact)`.
4. `Comment.user_id` deve referenciar um `User` ativo.
5. O `slug` de um `Artifact` é único dentro do seu subtipo (`Post` e `Presentation` têm espaços de slug separados) e é imutável após publicação.
6. `Artifact` em estado `draft` não aparece em listagens públicas, busca, sitemap ou feeds.
7. `Artifact` publicado é mutável (conteúdo, metadata exceto `slug`). Sem entidade `Version` no domínio. Versionamento explícito deferido para a Fase 4.
8. Toda mudança em `Artifact` publicado gera registro de auditoria (V2+).
9. `Tag` pertence a um conjunto curado fechado definido em `content/tags.yml`. Tag fora desse conjunto referenciada em frontmatter MDX falha a build. Ver [ADR-0008](adr/0008-tags-curadas.md).
10. `Comment` é flat (sem replies aninhadas). Menções `@usuario` resolvem referência humana; não há `parent_comment_id`. Decisão pode ser revisada quando volume real justificar threading.
11. `Comment` não recebe reações na V1/V2. `Vote` é exclusivamente sobre `Artifact`. Emoji reactions ficam fora de escopo permanente para preservar o tom curado do hub.
12. Moderação de `Comment` na Fase 2 é exclusivamente por `User` com `role = admin`. Autor de `Artifact` não tem poder especial de moderação local.
13. `View` conta uma vez por `(artifact_id, session_id, day_bucket_UTC)`. Gatilho: carregamento da página do `Artifact`. Bots/crawlers identificados via User-Agent são descartados. `session_id` é cookie funcional anônimo.
14. Um `Post` está vinculado a exatamente um `Source` (se a Section pai for `with_sources`) ou diretamente a uma Section `direct` — nunca a ambos simultaneamente.
15. `Presentation` pertence exclusivamente a uma Section `direct`. Não pode ser aninhada sob um `Source`.
16. `Source` pertence a exatamente uma `Section` com `kind = with_sources`.

## Boundaries de domínio

Cada boundary é dono dos seus modelos, regras e dados. Comunicação entre boundaries é via interface explícita, nunca import direto de modelos.

- **`catalog`** — Section, Source, Artifact (Post, Presentation, Slide), Tag, busca, listagem, render. Referencia `User` apenas por `UserId` (value object em `shared`); enriquecimento de display via port → `identity`. Ver [ADR-0007](adr/0007-publicar-e-papel-de-user.md).
- **`identity`** — User, Session, Auth, Profile (display name, avatar, bio)
- **`engagement`** — View, Vote, Comment (todos apontam para `Artifact`), moderação, rate limiting
- **`narration`** *(V2)* — Narration, Knowledge Base, voice cloning, RAG, Q&A (restrito a `Presentation`)
- **`shared`** — tipos primitivos, erros base, value objects (ex.: `Slug`, `UserId`, `ArtifactId`)
- **`platform`** — adapters de DB, storage, observabilidade, AI providers

Detalhamento arquitetural em [ARCHITECTURE.md](ARCHITECTURE.md).

## Termos ambíguos a evitar

| Não use | Use |
|---|---|
| "Article" | `Post` |
| "Like" / "Heart" | `Vote` |
| "Page" (referindo-se a slide) | `Slide` |
| "Topic" | `Tag` |
| "Talk" *(no domínio, fora da UI)* | `Presentation` |
| "Author" *(como entidade de domínio)* | `User` (no domínio) ou "publicador" (em texto solto). UI pública pode dizer "author" como rótulo de display — não é termo de domínio. Ver [ADR-0007](adr/0007-publicar-e-papel-de-user.md). |
| "Category" | `Section` |
| "Item" (referindo-se a Source) | `Source` |
| "Content" (referindo-se a Artifact) | `Artifact`, `Post` ou `Presentation` |

## Decisões abertas

_(nenhuma no momento — sessão `grill-with-docs` de pivô (2026-05-31) resolveu o modelo de domínio epistemix)_
