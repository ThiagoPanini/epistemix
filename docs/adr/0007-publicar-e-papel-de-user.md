# ADR 0007 — Publicar é um papel de `User`; sem entidade `Author` no domínio

- **Status:** Accepted
- **Data:** 2026-05-23
- **Decisores:** Thiago Panini (solo)
- **Relacionado:** [ADR-0001](0001-monorepo-and-boundaries.md), [ADR-0004](0004-hexagonal-pragmatica.md), [docs/CONTEXT.md](../CONTEXT.md)

## Contexto

O glossário inicial trazia `Author` como entidade própria no boundary `catalog` ("pessoa autora de uma `Presentation`") e, na mesma página, a invariante 4 dizia `Comment.author_id` deve referenciar um `User`. Dois conceitos ("quem publicou", "quem comentou") usavam a mesma palavra para entidades diferentes, e a fronteira entre `Author` (em `catalog`) e `User` (em `identity`) ficava obscura.

Na V1, o catálogo é alimentado por MDX versionado no repositório — não existe `Presentation` no banco. Em Fase 2 entra autenticação para comentários e votos, e o modelo `User` já precisa carregar persona pública (display name, avatar, bio). Em Fase 3, a publicação migra do MDX para CMS administrado — e aí surge a pergunta de quem é o "publicador" no banco.

Opções consideradas:

1. **`Author` é entidade em `catalog` com ligação opcional para `User`** em `identity`. Visitante anônimo lê catálogo sem tocar `identity`.
2. **`Author` é apenas um papel de `User`**: `Presentation.published_by → User`. Termo `Author` some do domínio. Publicador sempre tem conta.
3. **`Author` é entidade, mas todo `User` pode virar `Author`** (1:1 lazy). Adia o problema para V3.

## Decisão

**Adotar opção 2.** Apagar `Author` do glossário. Adicionar a regra:

- `Presentation.published_by: UserId` (value object em `shared`).
- `Comment.user_id: UserId` (renomeada da antiga `Comment.author_id`).
- UI pública pode usar o rótulo "author" como linguagem de display ("by Thiago Panini"); isso **não** ressuscita o termo no domínio. A URL pública canônica do publicador é `/authors/<username>` (onde `<username>` é `User.username`): `/@<username>` foi rejeitada por tom de rede social e `/users/<username>` por expor o schema numa interface humana.

**Boundary discipline preservada:** `catalog.Presentation` carrega só `UserId`. Enriquecimento de display (nome, avatar) acontece na camada `presentation/` de `catalog` via `UserQueryPort`, cujo adapter chama o use case de `identity`. Sem import direto cross-boundary. Compatível com a regra 6 de [ADR-0004](0004-hexagonal-pragmatica.md).

## Justificativa

- **Custo zero na V1 e V2.** Sem `Presentation` no banco até Fase 3; sem necessidade de "publicador" antes disso. A primeira aparição da FK coincide com a migração para CMS.
- **`User` já carrega persona pública** por causa de comentários (Fase 2). Reaproveitar para "quem publicou" (Fase 3) não adiciona responsabilidades novas.
- **V3 multi-tenant exige conta autenticada** para qualquer publicador de qualquer forma. "Publisher = User" não fecha porta.
- **Reduz sobrecarga de termo.** "Author" estava colidindo entre "quem publicou" e "quem comentou". Eliminando-o, a linguagem fica honesta.

## Consequências

### Positivas

- Modelo de domínio mais enxuto: uma entidade-pessoa em vez de duas.
- Schema mais simples na Fase 3: uma FK para `users`, sem tabela intermediária `authors`.
- Glossário sem termo ambíguo.

### Negativas

- `User` acumula dois chapéus: sujeito de autenticação e persona pública. Pragmático, não puro.
- Se um dia surgir "publicações importadas sem conta" ou "ghost author" (ex.: migração de conteúdo legado), será necessário ou criar `User` stubs ou reintroduzir `Author` como entidade separada — migração real, mas factível enquanto o volume for pequeno.
- UI pública e domínio usam vocabulários diferentes ("author" no front, `User` no back). Pequena dissonância documentada no glossário.

## Opções rejeitadas

- **Opção 1 (`Author` como entidade separada).** Mais purista, mas paga complexidade desde já para um cenário (publicador ≠ usuário) que não existe na V1–V3 e que talvez nunca exista.
- **Opção 3 (`Author` 1:1 lazy com `User`).** Pior dos dois mundos: entidade adicional sem ganho, e a relação 1:1 acaba sendo cosmética.
