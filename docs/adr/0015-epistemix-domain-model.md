# ADR-0015 — Modelo de domínio epistemix: Section, Source, Artifact

**Status:** aceito  
**Data:** 2026-05-31  
**Contexto:** pivô de `talkingpres` (hub de apresentações) para `epistemix` (hub pessoal de aprendizado multi-formato)

---

## Contexto

O projeto nasceu como `talkingpres` — um catálogo de apresentações técnicas com `Presentation` como única unidade publicável. Após sessão `grill-with-docs`, ficou claro que o escopo deve ser expandido para contemplar múltiplos formatos de artefatos de aprendizado: posts de blog, notas de cursos, reviews de livros, anotações de certificações e apresentações em slides.

Essa expansão exige um novo modelo de domínio capaz de representar a hierarquia de conteúdo sem duplicar a lógica de engajamento para cada formato.

## Decisão

Adotar um modelo de domínio em três níveis:

### Nível 1 — Section

Unidade de organização de nível 1. **Dinâmica** (admin cria via painel, não é enum fixo no código). Tem `kind`:

- `direct` — Artifacts vinculados diretamente à Section (ex: Blog, Presentations)
- `with_sources` — Artifacts vinculados a um `Source` intermediário (ex: Courses, Books, Certifications)

### Nível 2 — Source

Referência a um item externo real (um curso existente, um livro publicado, uma certificação). Presente apenas em Sections `with_sources`. Pode existir sem Artifacts vinculados (é válido cadastrar uma referência antes de publicar conteúdo sobre ela).

### Nível 3 — Artifact (Post | Presentation)

Unidade publicável abstrata. Dois subtipos concretos:

- **Post** — texto prosa em MDX. Estruturalmente idêntico independente de onde está vinculado (blog, nota de curso, review de livro, anotação de cert).
- **Presentation** — sequência de Slides em MDX via `slide-kit`. Sempre pertence a uma Section `direct`.

`Artifact` é o alvo de `View`, `Vote` e `Comment`.

## Alternativas consideradas

**A — Post e Presentation como entidades separadas sem abstração comum**  
Descartada: duplicaria a lógica de engajamento (View, Vote, Comment) para cada tipo. Qualquer adição de novo formato exigiria novo conjunto de tabelas de engagement.

**B — Presentation absorve tudo (um Post é uma Presentation com um slide longo)**  
Descartada: forçaria o conceito de "Slide" para conteúdo prosa, o que é semanticamente incorreto e dificultaria o render correto de cada formato.

**C — Abstração comum `Artifact` com subtipos `Post` e `Presentation`** ✓  
Adotada. Engajamento aponta para `Artifact`. Cada subtipo tem sua estrutura própria (Slides para Presentation, MDX prosa para Post) sem contaminar o modelo de engagement.

## Consequências

- **`catalog` boundary:** passa a incluir `Section`, `Source`, `Artifact`, `Post`, `Presentation`, `Slide`, `Tag`.
- **`engagement` boundary:** `View`, `Vote`, `Comment` apontam para `ArtifactId` (polimórfico por subtipo) em vez de `PresentationId`.
- **`shared`:** adicionar `ArtifactId` como value object.
- **ADR-0009 (View):** atualizar referências de `presentation_id` para `artifact_id`.
- **Slugs:** espaço de slug separado por subtipo (`Post` e `Presentation` não compartilham o mesmo namespace de slug).
- **`Narration` (V2):** continua restrita ao subtipo `Presentation`.
- **Renomeação do repositório:** `talkingpres` → `epistemix` (operação manual, fora deste ADR).
